import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { and, asc, eq, inArray, isNull, lt, sql } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import {
  intervention,
  site,
  treematchAllocation,
  treematchAutomatchRun,
  treematchContribution,
  treematchInterventionBlock,
  treematchRule,
} from '../../database/schema';
import { generateUid } from '../../util/uidGenerator';
import { TtcContributionsClient } from '../clients/ttc-contributions.client';
import {
  AutomatchResultDto,
  MATCHABLE_INTERVENTION_TYPES,
  WriteBackAllocationsDto,
} from '../dto/treematch.dto';
import {
  AutomatchPlan,
  PlannerContribution,
  PlannerIntervention,
  PlannerRule,
  DEFAULT_RULE,
  filterSignatureOf,
  paramsForSignature,
  planAutomatch,
} from './automatch-planner';
import { TreeMatchLedgerService } from './treematch-ledger.service';
import { TreeMatchService } from './treematch.service';

const CENTI = 100;
const toTrees = (centiUnits: number) => centiUnits / CENTI;

// Full TTC pagination per filter signature, capped: 50 pages x 100 items =
// 5000 contributions per signature. Hitting the cap flags the run truncated.
const PAGE_LIMIT = 100;
const MAX_PAGES = 50;

// A 'running' row older than this is a crash leftover and may be taken over.
const STALE_RUN_MS = 10 * 60 * 1000;

/**
 * The auto-match engine. One synchronous run:
 *   1. claim the run row (partial unique index = concurrency guard)
 *   2. load enabled rules + this project's available plant locations
 *   3. page the TTC contribution lists each rule filter needs, refreshing
 *      the local mirror per page
 *   4. plan greedily (pure planner, centi-units, mirror-derived availability)
 *   5. persist the whole plan through the ordinary 3-phase write-back
 *
 * The planner's absolutes are derived from the same mirror rows the ledger's
 * staleness check compares against, so a concurrent manual match between
 * fetch and write surfaces as the usual 409 and a re-run converges.
 */
@Injectable()
export class TreeMatchAutomatchService {
  private readonly logger = new Logger(TreeMatchAutomatchService.name);

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly ttcClient: TtcContributionsClient,
    private readonly ledger: TreeMatchLedgerService,
    private readonly treeMatchService: TreeMatchService,
  ) {}

  async run(projectId: number, actorId: number): Promise<AutomatchResultDto> {
    const projectUid = await this.treeMatchService.getProjectUid(projectId);
    const runRow = await this.startRun(projectId, actorId);

    try {
      return await this.execute(projectId, actorId, projectUid, runRow);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      try {
        await this.drizzleService.db
          .update(treematchAutomatchRun)
          .set({ status: 'failed', error: message, finishedAt: new Date() })
          .where(eq(treematchAutomatchRun.id, runRow.id));
      } catch (updateError) {
        this.logger.error(
          `Failed to mark automatch run ${runRow.uid} as failed: ${updateError}`,
        );
      }
      throw error;
    }
  }

  private async execute(
    projectId: number,
    actorId: number,
    projectUid: string,
    runRow: { id: number; uid: string },
  ): Promise<AutomatchResultDto> {
    const enabledRules = await this.loadEnabledRules(projectId);

    // Snapshot what this run evaluates (rules change; the run should not lie).
    await this.drizzleService.db
      .update(treematchAutomatchRun)
      .set({
        rulesSnapshot: [...enabledRules, DEFAULT_RULE].map((rule) => ({
          ruleUid: rule.uid,
          label: rule.label,
          whenType: rule.whenType,
          whenValue: rule.whenValue,
          preferType: rule.preferType,
          preferSiteId: rule.preferSiteId,
          orderBy: rule.orderBy,
        })),
      })
      .where(eq(treematchAutomatchRun.id, runRow.id));

    const interventions = await this.loadAvailableInterventions(projectId);

    // One paged TTC fetch per distinct filter signature. '' (unfiltered) is
    // always needed: the default rule reads from it.
    const signatures = [
      ...new Set(['', ...enabledRules.map((rule) => filterSignatureOf(rule))]),
    ];
    const { idsBySignature, truncated } = await this.fetchContributions(
      projectId,
      projectUid,
      signatures,
    );

    const allTtcIds = [...new Set([...idsBySignature.values()].flat())];
    const { contributionsById, unitsAllocatedByTtcId } = await this.loadMirrors(
      projectId,
      allTtcIds,
    );

    const plan = planAutomatch(enabledRules, interventions, idsBySignature, contributionsById);

    if (plan.pairs.length) {
      const dto = this.buildWriteBackDto(plan, unitsAllocatedByTtcId);
      await this.treeMatchService.writeAllocations(projectId, actorId, dto, {
        source: 'automatch',
        runUid: runRow.uid,
        ruleUidByPair: new Map(
          plan.pairs.map((pair) => [
            `${pair.ttcContributionId}:${pair.interventionUid}`,
            pair.ruleUid,
          ]),
        ),
      });
    }

    const summary = {
      perRule: plan.perRule,
      ...(truncated ? { truncated: true } : {}),
    };
    await this.drizzleService.db
      .update(treematchAutomatchRun)
      .set({
        status: 'completed',
        matchedUnits: plan.totals.matchedCenti,
        contributionsMatched: plan.totals.contributionsMatched,
        interventionsFilled: plan.totals.interventionsFilled,
        summary,
        finishedAt: new Date(),
      })
      .where(eq(treematchAutomatchRun.id, runRow.id));

    return {
      runUid: runRow.uid,
      matchedTrees: toTrees(plan.totals.matchedCenti),
      contributionsMatched: plan.totals.contributionsMatched,
      locationsFilled: plan.totals.interventionsFilled,
      perRule: plan.perRule.map((rule) => ({
        ruleUid: rule.ruleUid,
        label: rule.label,
        matchedTrees: toTrees(rule.matchedCenti),
        contributionsUsed: rule.contributionsUsed,
        ...(rule.siteMissing ? { siteMissing: true } : {}),
      })),
      ...(truncated ? { truncated: true } : {}),
    };
  }

  /**
   * Claim the run row. The partial unique index (project_id WHERE
   * status = 'running') rejects a second concurrent run; a stale leftover
   * from a crashed run is failed and taken over.
   */
  private async startRun(
    projectId: number,
    actorId: number,
  ): Promise<{ id: number; uid: string }> {
    const insertRun = async () => {
      try {
        const [row] = await this.drizzleService.db
          .insert(treematchAutomatchRun)
          .values({ uid: generateUid('tmar'), projectId, createdById: actorId })
          .returning({ id: treematchAutomatchRun.id, uid: treematchAutomatchRun.uid });
        return row;
      } catch (error: any) {
        const code = error?.code ?? error?.cause?.code;
        if (code === '23505') return null; // active-run unique index hit
        throw error;
      }
    };

    let row = await insertRun();
    if (row) return row;

    const staleBefore = new Date(Date.now() - STALE_RUN_MS);
    const takenOver = await this.drizzleService.db
      .update(treematchAutomatchRun)
      .set({
        status: 'failed',
        error: 'Superseded: the run never finished (probable crash)',
        finishedAt: new Date(),
      })
      .where(
        and(
          eq(treematchAutomatchRun.projectId, projectId),
          eq(treematchAutomatchRun.status, 'running'),
          lt(treematchAutomatchRun.startedAt, staleBefore),
        ),
      )
      .returning({ id: treematchAutomatchRun.id });
    if (takenOver.length) {
      row = await insertRun();
      if (row) return row;
    }
    throw new ConflictException('An auto-match run is already in progress for this project.');
  }

  private async loadEnabledRules(projectId: number): Promise<PlannerRule[]> {
    const rows = await this.drizzleService.db
      .select({
        uid: treematchRule.uid,
        enabled: treematchRule.enabled,
        whenType: treematchRule.whenType,
        whenValue: treematchRule.whenValue,
        preferType: treematchRule.preferType,
        preferSiteId: treematchRule.preferSiteId,
        orderBy: treematchRule.orderBy,
        siteName: site.name,
        siteDeletedAt: site.deletedAt,
      })
      .from(treematchRule)
      .leftJoin(site, eq(treematchRule.preferSiteId, site.id))
      .where(and(eq(treematchRule.projectId, projectId), isNull(treematchRule.deletedAt)))
      .orderBy(asc(treematchRule.position));

    return rows
      .filter((row) => row.enabled)
      .map((row) => ({
        uid: row.uid,
        label: this.ruleLabel(row),
        whenType: row.whenType as PlannerRule['whenType'],
        whenValue: row.whenValue,
        preferType: row.preferType as PlannerRule['preferType'],
        preferSiteId: row.preferSiteId,
        preferSiteDeleted:
          row.preferSiteId != null && (row.siteName == null || row.siteDeletedAt != null),
        orderBy: row.orderBy as PlannerRule['orderBy'],
      }));
  }

  private ruleLabel(rule: {
    whenType: string;
    whenValue: string | null;
    preferType: string;
    orderBy: string;
    siteName: string | null;
  }): string {
    const when =
      rule.whenType === 'company'
        ? 'Company donations'
        : rule.whenType === 'individual'
          ? 'Individual donations'
          : rule.whenType === 'country'
            ? `Donations from ${rule.whenValue}`
            : rule.whenType === 'donor'
              ? `Donation ${rule.whenValue}`
              : 'Any donation';
    const prefer =
      rule.preferType === 'site'
        ? `site ${rule.siteName || '(deleted)'}`
        : rule.preferType === 'capacity'
          ? 'locations with most capacity'
          : 'oldest available locations';
    const order = rule.orderBy === 'largest' ? 'largest first' : 'oldest first';
    return `${when} -> ${prefer} (${order})`;
  }

  /**
   * This project's matchable plant locations with free capacity, excluding
   * blocked ones. Same base filters as getInterventions; auto-match is
   * project-local by design (manual matching keeps its cross-project reach).
   */
  private async loadAvailableInterventions(projectId: number): Promise<PlannerIntervention[]> {
    const matched = this.drizzleService.db
      .select({
        interventionId: treematchAllocation.interventionId,
        matchedCenti: sql<number>`sum(${treematchAllocation.units})`.as('matched_centi'),
      })
      .from(treematchAllocation)
      .where(isNull(treematchAllocation.deletedAt))
      .groupBy(treematchAllocation.interventionId)
      .as('matched');

    const rows = await this.drizzleService.db
      .select({
        id: intervention.id,
        uid: intervention.uid,
        siteId: intervention.siteId,
        interventionStartDate: intervention.interventionStartDate,
        totalTreeCount: intervention.totalTreeCount,
        matchedCenti: sql<number>`coalesce(${matched.matchedCenti}, 0)`,
      })
      .from(intervention)
      .leftJoin(matched, eq(matched.interventionId, intervention.id))
      .leftJoin(
        treematchInterventionBlock,
        and(
          eq(treematchInterventionBlock.interventionId, intervention.id),
          isNull(treematchInterventionBlock.deletedAt),
        ),
      )
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt),
          eq(intervention.discriminator, 'intervention' as const),
          inArray(intervention.type, [...MATCHABLE_INTERVENTION_TYPES] as any),
          eq(intervention.captureStatus, 'complete' as const),
          isNull(treematchInterventionBlock.id),
          sql`coalesce(${intervention.totalTreeCount}, 0) * ${CENTI} > coalesce(${matched.matchedCenti}, 0)`,
        ),
      );

    return rows.map((row) => ({
      id: row.id,
      uid: row.uid,
      siteId: row.siteId,
      interventionStartDate: row.interventionStartDate,
      availableCenti: (row.totalTreeCount || 0) * CENTI - Number(row.matchedCenti || 0),
    }));
  }

  /**
   * Page through the TTC list once per filter signature, refreshing the
   * mirror per page (same as the interactive list) and deduping by id
   * (`total` can drift while paginating).
   */
  private async fetchContributions(
    projectId: number,
    projectUid: string,
    signatures: string[],
  ): Promise<{ idsBySignature: Map<string, number[]>; truncated: boolean }> {
    const idsBySignature = new Map<string, number[]>();
    let truncated = false;

    for (const signature of signatures) {
      const params = paramsForSignature(signature);
      const seen = new Set<number>();
      let page = 1;
      for (;;) {
        const response = await this.ttcClient.listContributions(projectUid, {
          page,
          limit: PAGE_LIMIT,
          sortBy: '+paymentDate',
          ...params,
        });
        const items = response.items || [];
        await this.ledger.refreshMirrorFromTtc(projectId, items);
        for (const item of items) seen.add(item.id);

        const hasNext = Boolean(response._links?.next) && items.length > 0;
        if (!hasNext) break;
        if (page >= MAX_PAGES) {
          truncated = true;
          this.logger.warn(
            `Automatch TTC fetch for project ${projectUid} hit the ${MAX_PAGES}-page cap (signature '${signature}')`,
          );
          break;
        }
        page += 1;
      }
      idsBySignature.set(signature, [...seen]);
    }

    return { idsBySignature, truncated };
  }

  /**
   * Planner inputs come from the mirror, never from raw TTC items: the
   * ledger's staleness check compares absolutes against these same rows,
   * and a 'pending' mirror deliberately diverges from what TTC reports.
   */
  private async loadMirrors(
    projectId: number,
    ttcIds: number[],
  ): Promise<{
    contributionsById: Map<number, PlannerContribution>;
    unitsAllocatedByTtcId: Map<number, number>;
  }> {
    const contributionsById = new Map<number, PlannerContribution>();
    const unitsAllocatedByTtcId = new Map<number, number>();
    if (!ttcIds.length) return { contributionsById, unitsAllocatedByTtcId };

    const rows = await this.drizzleService.db
      .select({
        ttcContributionId: treematchContribution.ttcContributionId,
        units: treematchContribution.units,
        unitsAllocated: treematchContribution.unitsAllocated,
        ignored: treematchContribution.ignored,
        allocationPriority: treematchContribution.allocationPriority,
        paymentDate: treematchContribution.paymentDate,
        donationRef: treematchContribution.donationRef,
      })
      .from(treematchContribution)
      .where(
        and(
          inArray(treematchContribution.ttcContributionId, ttcIds),
          eq(treematchContribution.projectId, projectId),
          isNull(treematchContribution.deletedAt),
        ),
      );

    for (const row of rows) {
      // units is null until the first refresh; an unknown funding total
      // cannot be spent.
      const availableCenti = Math.max(0, (row.units ?? 0) - row.unitsAllocated);
      contributionsById.set(row.ttcContributionId, {
        ttcId: row.ttcContributionId,
        paymentDate: row.paymentDate,
        allocationPriority: row.allocationPriority,
        availableCenti,
        donationRef: row.donationRef,
        ignored: row.ignored,
      });
      unitsAllocatedByTtcId.set(row.ttcContributionId, row.unitsAllocated);
    }
    return { contributionsById, unitsAllocatedByTtcId };
  }

  private buildWriteBackDto(
    plan: AutomatchPlan,
    unitsAllocatedByTtcId: Map<number, number>,
  ): WriteBackAllocationsDto {
    const deltaByContribution = new Map<number, number>();
    for (const pair of plan.pairs) {
      deltaByContribution.set(
        pair.ttcContributionId,
        (deltaByContribution.get(pair.ttcContributionId) || 0) + pair.deltaCenti,
      );
    }
    return {
      // Absolute totals derived from the mirror baseline; the round trip is
      // exact because the ledger converts back with Math.round(trees * 100).
      allocations: [...deltaByContribution.entries()].map(([id, deltaCenti]) => ({
        id,
        allocatedTrees: toTrees((unitsAllocatedByTtcId.get(id) || 0) + deltaCenti),
      })),
      matches: plan.pairs.map((pair) => ({
        contributionId: pair.ttcContributionId,
        interventionUid: pair.interventionUid,
        trees: toTrees(pair.deltaCenti),
      })),
    };
  }
}
