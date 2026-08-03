import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, ilike, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { ProjectsService } from '../projects/projects.service';
import { ProjectCacheService } from '../cache/project-cache.service';
import { intervention, project, site, treematchAllocation } from '../database/schema';
import { generateUid } from '../util/uidGenerator';
import {
  CreateMatchesDto,
  CreateMatchesResponseDto,
  GetTreeMatchContributionsQueryDto,
  GetTreeMatchInterventionsQueryDto,
  GetTreeMatchInterventionsResponseDto,
  MATCHABLE_INTERVENTION_TYPES,
  SetContributionIgnoreDto,
} from './dto/treematch.dto';
import { TtcContributionsClient } from './ttc-contributions.client';
import { CENTI, aggregateMatches, exceedsCapacity, toTrees } from './match-math';

// Roles that may claim a project's trees, same set the routes require. Owner
// only: matching writes totals to TTC on the project's behalf, so it does not
// follow the app's usual owner-or-admin rule.
const MATCHER_ROLES = ['owner'];

// A plant location with free trees, as auto-match planning needs it.
export interface MatchableIntervention {
  id: number;
  uid: string;
  // Shown in the auto-match plan review; the uid means nothing to a reader.
  hid: string;
  siteId: number | null;
  interventionStartDate: Date | null;
  // review_status = 'approved' and not flagged.
  approved: boolean;
  availableCenti: number;
}

@Injectable()
export class TreeMatchService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly ttcClient: TtcContributionsClient,
    private readonly projectsService: ProjectsService,
    private readonly projectCacheService: ProjectCacheService,
  ) {}

  // TTC identifies a project by the same uid TreeMapper uses.
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

    // Claimed centi-units per plant location.
    const matched = this.drizzleService.db
      .select({
        interventionId: treematchAllocation.interventionId,
        matchedCenti: sql<number>`sum(${treematchAllocation.units})`.as('matched_centi'),
      })
      .from(treematchAllocation)
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
            // Selecting the column directly returns PostGIS WKB hex
            // ("0103000020E6..."), not GeoJSON: the schema's `location` custom
            // type declares GeoJSON but its `fromDriver` hands the driver string
            // straight back. The map then reads no `type` on it, every centroid
            // throws, and nothing draws. Every other service converts in SQL;
            // this one has to as well.
            location: sql<GeoJSON.Point | GeoJSON.Polygon | GeoJSON.MultiPolygon | null>`ST_AsGeoJSON(${intervention.location})::json`,
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

    // Project-wide claimed total, summed over this project's plant locations.
    const [matchedRow] = await this.drizzleService.db
      .select({ matched: sql<number>`coalesce(sum(${treematchAllocation.units}), 0)` })
      .from(treematchAllocation)
      .innerJoin(intervention, eq(treematchAllocation.interventionId, intervention.id))
      .where(and(
        eq(intervention.projectId, projectId),
        isNull(intervention.deletedAt),
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

  /**
   * Every plant location in this project that still has free trees, unpaginated.
   *
   * Same eligibility rule as `getInterventions` and the match write path, so
   * auto-match can never plan a pair the write path would reject. Project-local
   * by design: cross-project matching is a deliberate manual action, not
   * something a rule should reach into.
   */
  async loadMatchableInterventions(projectId: number): Promise<MatchableIntervention[]> {
    const matched = this.drizzleService.db
      .select({
        interventionId: treematchAllocation.interventionId,
        matchedCenti: sql<number>`sum(${treematchAllocation.units})`.as('matched_centi'),
      })
      .from(treematchAllocation)
      .groupBy(treematchAllocation.interventionId)
      .as('matched');

    const rows = await this.drizzleService.db
      .select({
        id: intervention.id,
        uid: intervention.uid,
        hid: intervention.hid,
        siteId: intervention.siteId,
        interventionStartDate: intervention.interventionStartDate,
        reviewStatus: intervention.reviewStatus,
        flag: intervention.flag,
        totalTreeCount: intervention.totalTreeCount,
        matchedCenti: sql<number>`coalesce(${matched.matchedCenti}, 0)`,
      })
      .from(intervention)
      .leftJoin(matched, eq(matched.interventionId, intervention.id))
      .where(and(
        eq(intervention.projectId, projectId),
        isNull(intervention.deletedAt),
        eq(intervention.discriminator, 'intervention' as const),
        eq(intervention.captureStatus, 'complete' as const),
        inArray(intervention.type, [...MATCHABLE_INTERVENTION_TYPES] as any),
        sql`coalesce(${intervention.totalTreeCount}, 0) * ${CENTI} > coalesce(${matched.matchedCenti}, 0)`,
      ))
      .orderBy(intervention.id);

    return rows.map((row) => ({
      id: row.id,
      uid: row.uid,
      hid: row.hid,
      siteId: row.siteId,
      interventionStartDate: row.interventionStartDate,
      approved: row.reviewStatus === 'approved' && !row.flag,
      availableCenti: (row.totalTreeCount || 0) * CENTI - Number(row.matchedCenti || 0),
    }));
  }

  // Straight proxy. TTC owns contributions, their allocated totals and the
  // ignore flag, so nothing here is stored or merged with local state.
  async getContributions(
    projectId: number,
    query: GetTreeMatchContributionsQueryDto,
  ) {
    const { page = 1, limit = 20, profileType, country, sort, ignored } = query;
    const projectUid = await this.getProjectUid(projectId);

    const response = await this.ttcClient.listContributions(projectUid, {
      page,
      limit,
      profileType,
      country: country ? country.toUpperCase() : undefined,
      sortBy: sort === 'newest' ? '-paymentDate' : '+paymentDate',
      ignored,
    });

    return {
      // TTC sends centi-units; the web works in whole trees.
      items: (response.items || []).map((item) => ({
        ...item,
        units: toTrees(item.units),
        unitsAllocated: toTrees(item.unitsAllocated),
        available: toTrees(item.available),
      })),
      pagination: {
        total: response.total || 0,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil((response.total || 0) / limit) : 0,
      },
    };
  }

  // The flag lives in TTC, which also enforces its own rule (it refuses to
  // change the flag of a fully allocated contribution). Note that the TTC
  // endpoint is not project-scoped, so this cannot verify the contribution
  // belongs to the project in the path.
  async setContributionIgnore(
    ttcContributionId: number,
    dto: SetContributionIgnoreDto,
  ) {
    return this.ttcClient.setIgnore(ttcContributionId, {
      ignored: dto.ignored,
      ...(dto.ignored && dto.reason ? { reason: dto.reason } : {}),
    });
  }

  /**
   * Which projects the caller may take trees from.
   *
   * Matching across projects is allowed on purpose: TTC only cares that a
   * contribution's total is right, not which project holds the trees. The route
   * guard proves ownership of the project in the path, which is the
   * contributions side, so every other project the target locations belong to
   * has to be authorized here.
   *
   * Deliberately runs before the match transaction: these lookups need their
   * own database connection, and taking one while the transaction holds row
   * locks could starve the pool.
   */
  private async authorizeSourceProjects(
    uids: string[],
    pathProjectId: number,
    userId: number,
  ): Promise<Set<number>> {
    const rows = await this.drizzleService.db
      .select({
        projectId: intervention.projectId,
        projectUid: project.uid,
        projectDeletedAt: project.deletedAt,
      })
      .from(intervention)
      .innerJoin(project, eq(intervention.projectId, project.id))
      .where(inArray(intervention.uid, uids));

    const byProject = new Map<number, { uid: string; deleted: boolean }>();
    for (const row of rows) {
      byProject.set(row.projectId, {
        uid: row.projectUid,
        deleted: Boolean(row.projectDeletedAt),
      });
    }

    const allowed = new Set<number>();
    for (const [id, info] of byProject) {
      // A deleted project's locations are not matchable. Left out of the
      // allowed set, so the write below reports them as not found.
      if (info.deleted) continue;
      // The guard already authorized the project in the path.
      if (id === pathProjectId) {
        allowed.add(id);
        continue;
      }
      await this.assertCanMatchFrom(info.uid, userId);
      allowed.add(id);
    }
    return allowed;
  }

  // Same membership resolution the route guard uses, held to the same owner-only
  // rule the routes are. There is deliberately no workspace-admin fallback here:
  // the guard would resolve a workspace owner or admin as a project admin, and
  // admins cannot match, so accepting one on this side would be a way into
  // another project's trees that the front door does not offer.
  private async assertCanMatchFrom(
    projectUid: string,
    userId: number,
  ): Promise<void> {
    const membership =
      (await this.projectCacheService.getUserProject(projectUid, userId)) ??
      (await this.projectsService.getMemberRoleFromUid(projectUid, userId));
    if (membership && MATCHER_ROLES.includes(membership.role)) return;

    throw new ForbiddenException(
      'You need to be the owner of the project the plant locations belong to',
    );
  }

  /**
   * Allocate planted trees to contributions.
   *
   * One transaction: claim the trees locally, derive each contribution's new
   * absolute total by summing our own rows, then write those totals to TTC. A
   * TTC failure propagates and rolls the transaction back, so TreeMapper never
   * claims trees TTC has not accepted.
   *
   * The TTC call sits inside the transaction, which holds locks for the length
   * of one request. That is the trade for having no sync state, no pending rows
   * and no compensation path: matching is a low-frequency admin action.
   *
   * The locations may live in other projects (see authorizeSourceProjects);
   * the contributions always belong to the project in the path.
   */
  async createMatches(
    projectId: number,
    userId: number,
    dto: CreateMatchesDto,
  ): Promise<CreateMatchesResponseDto> {
    const { pairs, byIntervention, contributionIds } = aggregateMatches(dto.matches);

    const roundsToZero = pairs.find((pair) => pair.centiUnits <= 0);
    if (roundsToZero) {
      throw new BadRequestException(
        `Match for contribution ${roundsToZero.contributionId} rounds to zero trees`,
      );
    }

    const uids = [...byIntervention.keys()];
    const allowedProjectIds = await this.authorizeSourceProjects(uids, projectId, userId);

    const applied = await this.drizzleService.db.transaction(async (tx) => {
      // Serialise on each contribution, ascending, so two concurrent requests
      // cannot each derive a total that ignores the other. Contribution locks
      // are always taken before location locks, giving one global lock order.
      //
      // One statement, not one per id: a plan can carry thousands of pairs, and
      // a round trip each would spend most of the transaction waiting while
      // already holding locks. ORDER BY inside the query preserves the lock
      // order that stops concurrent requests deadlocking.
      if (contributionIds.length) {
        // sql.param, not a bare array: drizzle expands a bare JS array into a
        // row constructor, `($1, $2, $3)`, which unnest cannot take. This binds
        // the whole list as one array parameter whatever its length.
        await tx.execute(sql`
          SELECT pg_advisory_xact_lock(hashtext('treematch:' || id))
          FROM unnest(${sql.param(contributionIds)}::bigint[]) AS t(id)
          ORDER BY id
        `);
      }

      // Resolve and lock the locations. Eligibility is the same rule the read
      // endpoint applies, enforced here too so a client cannot allocate to a
      // plot or an incomplete capture.
      const locked = await tx
        .select({
          id: intervention.id,
          uid: intervention.uid,
          hid: intervention.hid,
          projectId: intervention.projectId,
          totalTreeCount: intervention.totalTreeCount,
        })
        .from(intervention)
        .where(and(
          inArray(intervention.uid, uids),
          isNull(intervention.deletedAt),
          eq(intervention.discriminator, 'intervention' as const),
          eq(intervention.captureStatus, 'complete' as const),
          inArray(intervention.type, [...MATCHABLE_INTERVENTION_TYPES] as any),
        ))
        .orderBy(intervention.id)
        .for('update');

      // Only projects authorized above. Filtering here rather than in the query
      // keeps authorization decided by one code path.
      const locations = locked.filter((row) => allowedProjectIds.has(row.projectId));

      if (locations.length !== uids.length) {
        const found = new Set(locations.map((row) => row.uid));
        const missing = uids.filter((uid) => !found.has(uid));
        throw new NotFoundException(
          `Plant locations not found or not matchable: ${missing.join(', ')}`,
        );
      }

      const idByUid = new Map(locations.map((row) => [row.uid, row.id]));

      const claimedRows = await tx
        .select({
          interventionId: treematchAllocation.interventionId,
          centi: sql<number>`sum(${treematchAllocation.units})`,
        })
        .from(treematchAllocation)
        .where(inArray(
          treematchAllocation.interventionId,
          locations.map((row) => row.id),
        ))
        .groupBy(treematchAllocation.interventionId);
      const claimedById = new Map(
        claimedRows.map((row) => [row.interventionId, Number(row.centi || 0)]),
      );

      for (const location of locations) {
        const adding = byIntervention.get(location.uid) || 0;
        const claimed = claimedById.get(location.id) || 0;
        if (exceedsCapacity(claimed, adding, location.totalTreeCount)) {
          const free = toTrees(
            Math.max(0, (location.totalTreeCount || 0) * CENTI - claimed),
          );
          throw new ConflictException(
            `${location.hid} has ${free} trees available, cannot match ${toTrees(adding)}`,
          );
        }
      }

      // One multi-row upsert, not one statement per pair. A plan can carry
      // thousands of pairs and a round trip each would hold every lock taken
      // above for the whole walk. `excluded` is the row this insert would have
      // written, so the add-to-existing behaviour is unchanged.
      await tx
        .insert(treematchAllocation)
        .values(
          pairs.map((pair) => ({
            uid: generateUid('tma'),
            ttcContributionId: pair.contributionId,
            interventionId: idByUid.get(pair.interventionUid)!,
            units: pair.centiUnits,
          })),
        )
        .onConflictDoUpdate({
          target: [
            treematchAllocation.ttcContributionId,
            treematchAllocation.interventionId,
          ],
          set: {
            units: sql`${treematchAllocation.units} + excluded.units`,
            updatedAt: new Date(),
          },
        });

      // The absolute total TTC should hold is just the sum of our own rows, so
      // the client never sends it and therefore can never be stale.
      const totals = await tx
        .select({
          ttcContributionId: treematchAllocation.ttcContributionId,
          centi: sql<number>`sum(${treematchAllocation.units})`,
        })
        .from(treematchAllocation)
        .where(inArray(treematchAllocation.ttcContributionId, contributionIds))
        .groupBy(treematchAllocation.ttcContributionId);

      // TTC rejects the whole batch if a total exceeds the funded amount or the
      // contribution is ignored; that error rolls this transaction back.
      return this.ttcClient.writeAllocations(
        totals.map((row) => ({
          id: row.ttcContributionId,
          unitsAllocated: Number(row.centi || 0),
        })),
      );
    });

    const appliedTrees: Record<string, number> = {};
    for (const [id, unitsAllocated] of Object.entries(applied || {})) {
      appliedTrees[id] = toTrees(Number(unitsAllocated));
    }
    return { applied: appliedTrees };
  }
}
