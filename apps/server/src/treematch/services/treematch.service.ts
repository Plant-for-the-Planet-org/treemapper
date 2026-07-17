import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, gte, ilike, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import { intervention, project, site, treematchAllocation } from '../../database/schema';
import {
  GetTreeMatchContributionsQueryDto,
  GetTreeMatchInterventionsQueryDto,
  GetTreeMatchInterventionsResponseDto,
  MATCHABLE_INTERVENTION_TYPES,
  SetContributionIgnoreDto,
  WriteBackAllocationsDto,
} from '../dto/treematch.dto';
import { TtcContributionsClient } from '../clients/ttc-contributions.client';
import { MatchWriteAudit, TreeMatchLedgerService } from './treematch-ledger.service';

// TTC exposes contribution units in centi-units (100 = 1 tree). The web app
// works in whole trees on both panes, so this service converts at the boundary
// in both directions.
const CENTI = 100;
const toTrees = (centiUnits: number) => centiUnits / CENTI;
const toCentiUnits = (trees: number) => Math.round(trees * CENTI);

// The TTC contributions response does not carry `status` (public/private) yet.
// It is donor-owned data with no local source, so it stays mocked until TTC
// ships the field. `ignore` is TreeMapper-owned and read from the mirror.
const mockStatusOf = (id: number): 'public' | 'private' =>
  id % 7 === 0 ? 'private' : 'public';

@Injectable()
export class TreeMatchService {
  private readonly logger = new Logger(TreeMatchService.name);

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly ttcClient: TtcContributionsClient,
    private readonly ledger: TreeMatchLedgerService,
  ) {}

  // Also used by the auto-match engine, which shares the write-back path.
  async getProjectUid(projectId: number): Promise<string> {
    const [row] = await this.drizzleService.db
      .select({ uid: project.uid })
      .from(project)
      .where(and(eq(project.id, projectId), isNull(project.deletedAt)))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Project not found');
    }
    return row.uid;
  }

  async getInterventions(
    projectId: number,
    query: GetTreeMatchInterventionsQueryDto,
  ): Promise<GetTreeMatchInterventionsResponseDto> {
    const {
      page = 1,
      limit = 20,
      type,
      siteId,
      noSite,
      visibility,
      interventionStartDate,
      interventionStartDateTo,
      search,
      onlyAvailable,
    } = query;

    const matchableTypes =
      type === 'single'
        ? ['single-tree-registration']
        : type === 'multi'
          ? ['multi-tree-registration']
          : [...MATCHABLE_INTERVENTION_TYPES];

    // Always-on: this project's real (non-plot) registrations, not deleted.
    const baseConditions = [
      eq(intervention.projectId, projectId),
      isNull(intervention.deletedAt),
      eq(intervention.discriminator, 'intervention' as const),
      inArray(intervention.type, matchableTypes as any),
    ];

    // Only fully captured locations are matchable.
    const whereConditions: any[] = [
      ...baseConditions,
      eq(intervention.captureStatus, 'complete' as const),
    ];

    if (siteId) {
      whereConditions.push(eq(intervention.siteId, siteId));
    } else if (noSite) {
      whereConditions.push(isNull(intervention.siteId));
    }

    if (visibility) {
      whereConditions.push(eq(intervention.isPrivate, visibility === 'private'));
    }

    if (interventionStartDate) {
      whereConditions.push(
        gte(intervention.interventionStartDate, new Date(interventionStartDate)),
      );
    }

    if (interventionStartDateTo) {
      const toDate = new Date(interventionStartDateTo);
      toDate.setHours(23, 59, 59, 999);
      whereConditions.push(lte(intervention.interventionStartDate, toDate));
    }

    if (search) {
      whereConditions.push(
        or(
          ilike(intervention.hid, `%${search}%`),
          ilike(site.name, `%${search}%`),
        ),
      );
    }

    // Active matched centi-units per intervention, from the ledger. Not
    // scoped to this project: cross-project matches consume the same trees.
    const matched = this.drizzleService.db
      .select({
        interventionId: treematchAllocation.interventionId,
        matchedCenti: sql<number>`sum(${treematchAllocation.units})`.as('matched_centi'),
      })
      .from(treematchAllocation)
      .where(isNull(treematchAllocation.deletedAt))
      .groupBy(treematchAllocation.interventionId)
      .as('matched');

    if (onlyAvailable) {
      whereConditions.push(
        sql`coalesce(${intervention.totalTreeCount}, 0) * ${CENTI} > coalesce(${matched.matchedCenti}, 0)`,
      );
    }

    const where = and(...whereConditions);

    const [countRow] = await this.drizzleService.db
      .select({ count: sql<number>`count(*)` })
      .from(intervention)
      .leftJoin(site, eq(intervention.siteId, site.id))
      .leftJoin(matched, eq(matched.interventionId, intervention.id))
      .where(where);
    const total = Number(countRow?.count || 0);

    const rows = total
      ? await this.drizzleService.db
          .select({
            uid: intervention.uid,
            hid: intervention.hid,
            type: intervention.type,
            status: intervention.status,
            siteName: site.name,
            interventionStartDate: intervention.interventionStartDate,
            totalTreeCount: intervention.totalTreeCount,
            captureStatus: intervention.captureStatus,
            isPrivate: intervention.isPrivate,
            location: intervention.location,
            area: intervention.area,
            matchedCenti: sql<number>`coalesce(${matched.matchedCenti}, 0)`,
          })
          .from(intervention)
          .leftJoin(site, eq(intervention.siteId, site.id))
          .leftJoin(matched, eq(matched.interventionId, intervention.id))
          .where(where)
          .orderBy(sql`${intervention.interventionStartDate} DESC`)
          .limit(limit)
          .offset((page - 1) * limit)
      : [];

    // Locations still syncing / capture incomplete (shown as an info count).
    const [notReadyRow] = await this.drizzleService.db
      .select({ count: sql<number>`count(*)` })
      .from(intervention)
      .where(and(...baseConditions, ne(intervention.captureStatus, 'complete' as const)));

    // Project-wide planted total for the stats ribbon (independent of filters).
    const [plantedRow] = await this.drizzleService.db
      .select({ planted: sql<number>`coalesce(sum(${intervention.totalTreeCount}), 0)` })
      .from(intervention)
      .where(and(
        eq(intervention.projectId, projectId),
        isNull(intervention.deletedAt),
        eq(intervention.discriminator, 'intervention' as const),
        inArray(intervention.type, [...MATCHABLE_INTERVENTION_TYPES] as any),
      ));

    // Project-wide matched total: active ledger units sitting on this
    // project's plant locations, whichever project's donations funded them.
    const [matchedRow] = await this.drizzleService.db
      .select({ matched: sql<number>`coalesce(sum(${treematchAllocation.units}), 0)` })
      .from(treematchAllocation)
      .innerJoin(intervention, eq(treematchAllocation.interventionId, intervention.id))
      .where(and(
        eq(intervention.projectId, projectId),
        isNull(intervention.deletedAt),
        isNull(treematchAllocation.deletedAt),
      ));

    return {
      items: rows.map(({ matchedCenti, ...row }) => ({
        ...row,
        siteName: row.siteName || '',
        totalTreeCount: row.totalTreeCount || 0,
        matchedTrees: toTrees(Number(matchedCenti || 0)),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      notReadyCount: Number(notReadyRow?.count || 0),
      stats: {
        plantedTrees: Number(plantedRow?.planted || 0),
        matchedTrees: toTrees(Number(matchedRow?.matched || 0)),
      },
    };
  }

  async getContributions(
    projectId: number,
    query: GetTreeMatchContributionsQueryDto,
  ) {
    const { page = 1, limit = 20, profileType, country, sort } = query;
    const projectUid = await this.getProjectUid(projectId);

    const response = await this.ttcClient.listContributions(projectUid, {
      page,
      limit,
      profileType,
      country: country ? country.toUpperCase() : undefined,
      sortBy: sort === 'newest' ? '-paymentDate' : '+paymentDate',
    });

    // Refresh the local mirror from this page (snapshot fields, and the
    // allocated counter for rows that are in sync) and pick up local flags.
    const localFlags = await this.ledger.refreshMirrorFromTtc(projectId, response.items || []);

    const items = (response.items || []).map((item) => {
      const flags = localFlags.get(item.id);
      return {
        id: item.id,
        units: toTrees(item.units),
        unitsAllocated: toTrees(item.unitsAllocated),
        available: toTrees(item.available),
        unitType: item.unitType,
        currency: item.currency,
        allocationPriority: item.allocationPriority,
        donation: item.donation,
        // Planned TTC response field, mocked until the endpoint returns it.
        status: mockStatusOf(item.id),
        // Locally owned flag, read from the treematch_contribution mirror.
        ignore: flags?.ignored ?? false,
        ...(flags?.ignored && flags.ignoreReason ? { ignoreReason: flags.ignoreReason } : {}),
      };
    });

    return {
      items,
      pagination: {
        total: response.total || 0,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil((response.total || 0) / limit) : 0,
      },
    };
  }

  async setContributionIgnore(
    projectId: number,
    actorId: number,
    ttcContributionId: number,
    dto: SetContributionIgnoreDto,
  ) {
    return this.ledger.setContributionIgnore(projectId, actorId, ttcContributionId, dto);
  }

  // Three phases: persist to the local ledger (mirrors go 'pending'), write
  // the absolute totals to TTC, then confirm or reverse the local write.
  // `audit` is only set by the auto-match engine, to tag the events.
  async writeAllocations(
    projectId: number,
    actorId: number,
    dto: WriteBackAllocationsDto,
    audit?: MatchWriteAudit,
  ) {
    // Membership is already checked by the guard; resolving the uid also
    // confirms the project still exists before we touch the remote backend.
    await this.getProjectUid(projectId);

    const ledgerWrite = await this.ledger.applyMatchLocally(projectId, actorId, dto, audit);

    let applied: Record<string, number>;
    try {
      applied = await this.ttcClient.writeAllocations(
        dto.allocations.map((allocation) => ({
          id: allocation.id,
          unitsAllocated: toCentiUnits(allocation.allocatedTrees),
        })),
      );
    } catch (error) {
      // Reverse the local write so the ledger never sits ahead of TTC; the
      // absolute write-back means the user redoing the match converges.
      try {
        await this.ledger.compensateFailedWrite(projectId, actorId, ledgerWrite, error, audit);
      } catch (compensationError) {
        // Mirrors stay 'pending' (sync-attention index finds them); surface
        // the original TTC error to the user either way.
        this.logger.error(
          `TreeMatch compensation failed after TTC write error: ${compensationError}`,
        );
      }
      throw error;
    }

    await this.ledger.confirmSync(projectId, actorId, ledgerWrite, applied, audit);

    // Convert the applied map back to whole trees for the web app.
    const appliedTrees: Record<string, number> = {};
    for (const [id, unitsAllocated] of Object.entries(applied || {})) {
      appliedTrees[id] = toTrees(Number(unitsAllocated));
    }
    return { applied: appliedTrees };
  }
}
