import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull, lt, or } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import { site, treematchAutomatchRun, treematchRule } from '../../database/schema';
import type {
  TreematchAutomatchEmptyReason,
  TreematchAutomatchPlan,
  TreematchAutomatchProgress,
  TreematchRuleSnapshot,
} from '../../database/schema';
import { generateUid } from '../../util/uidGenerator';
import { toCentiUnits, toTrees } from '../match-math';
import { TreeMatchService } from '../treematch.service';
import { TtcContributionsClient, TtcContributionItem } from '../ttc-contributions.client';
import {
  ApplyAutomatchRunDto,
  AutomatchRunDto,
  MAX_PLAN_PAIRS,
  StartAutomatchRunDto,
} from '../dto/automatch.dto';
import {
  AutomatchPlanResult,
  PlanDiagnostics,
  PlannerContribution,
  planAutomatch,
} from './automatch-planner';
import {
  DEFAULT_RULE,
  PlannerRule,
  paramsForSignature,
  sweepSignatureOf,
} from './rule-types';

// TTC serves one page at a time and does not overlap concurrent requests, so
// pages cost roughly 700ms each and stack. 100 pages is 10,000 donations and
// about 70 seconds, which is the ceiling one list is allowed to spend.
//
// The ceiling exists because some projects cannot be read to the end at all:
// 172k contributions is ~1,720 pages, or ~20 minutes, and every extra rule
// signature stacks another sweep on top. The run reports its progress per page
// and can be stopped early, so the cap is a backstop rather than the usual way
// a sweep finishes.
const SCAN_PAGE_LIMIT = 100;
const MAX_SCAN_PAGES = 100;

// A planned run holds the project's only run slot. Past this it is fair game
// for the next run to discard.
const PLAN_TTL_MS = 30 * 60 * 1000;

// A 'planning' row older than this belongs to a crashed process.
const STALE_PLANNING_MS = 5 * 60 * 1000;

// An apply is one transaction bounded by the TTC HTTP timeout, so an
// 'applying' row this old is a dead process, not slow work.
const STALE_APPLYING_MS = 10 * 60 * 1000;

@Injectable()
export class TreeMatchAutomatchService {
  private readonly logger = new Logger(TreeMatchAutomatchService.name);

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly ttcClient: TtcContributionsClient,
    private readonly treeMatchService: TreeMatchService,
  ) {}

  // --- Logging --------------------------------------------------------------
  //
  // A run is a rare, user-triggered action that talks to a slow upstream and
  // can legitimately end with an empty plan, so the default level narrates the
  // whole run: what it read, what each rule did with it, and why. Roughly a
  // dozen lines. Per-page and per-donation detail is behind the debug flag.

  /** Set TREEMATCH_AUTOMATCH_DEBUG=true to follow a run page by page. */
  private get verbose(): boolean {
    return process.env.TREEMATCH_AUTOMATCH_DEBUG === 'true';
  }

  // Every line carries the run uid: runs from different projects interleave in
  // one terminal, and planning is async.
  private runLog(runUid: string, message: string): void {
    this.logger.log(`[${runUid}] ${message}`);
  }

  private runWarn(runUid: string, message: string): void {
    this.logger.warn(`[${runUid}] ${message}`);
  }

  private runDebug(runUid: string, message: string): void {
    if (this.verbose) this.logger.debug(`[${runUid}] ${message}`);
  }

  // --- Run lifecycle --------------------------------------------------------

  /**
   * Start a run. Returns as soon as the row exists; planning continues in the
   * background and the client polls `getRun`.
   *
   * Deliberately not on a queue. Bull is installed but has no working processor
   * in this codebase, the Redis config is only wired through one module, and
   * local dev has no Redis at all. The run row is enough coordination: the
   * partial unique index stops two runs overlapping even across instances, and
   * a crashed process leaves a stale row the next run takes over.
   */
  async startRun(
    projectId: number,
    userId: number,
    dto: StartAutomatchRunDto,
  ): Promise<AutomatchRunDto> {
    const run = await this.claimRun(projectId, userId);
    this.runLog(
      run.uid,
      `start: project=${projectId} user=${userId} scan=${dto.scan || 'oldest'} ` +
        `maxPairs=${dto.maxPairs || MAX_PLAN_PAIRS} maxTrees=${dto.maxTrees ?? 'none'}`,
    );

    // Floating on purpose: the HTTP response should not wait for the TTC sweep.
    void this.plan(run, projectId, dto).catch(async (error) => {
      const message = error?.message || String(error);
      this.logger.error(`[${run.uid}] planning failed for project ${projectId}: ${message}`);
      try {
        await this.drizzleService.db
          .update(treematchAutomatchRun)
          .set({ status: 'failed', error: message, finishedAt: new Date() })
          .where(eq(treematchAutomatchRun.id, run.id));
      } catch (updateError: any) {
        this.logger.error(
          `Could not mark run ${run.uid} failed: ${updateError?.message || updateError}`,
        );
      }
    });

    return this.getRun(projectId, run.uid);
  }

  async getRun(projectId: number, runUid: string): Promise<AutomatchRunDto> {
    const [row] = await this.drizzleService.db
      .select()
      .from(treematchAutomatchRun)
      .where(and(
        eq(treematchAutomatchRun.projectId, projectId),
        eq(treematchAutomatchRun.uid, runUid),
      ))
      .limit(1);
    if (!row) throw new NotFoundException('Auto-match run not found');
    return this.toDto(row);
  }

  async getLatestRun(projectId: number): Promise<AutomatchRunDto | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(treematchAutomatchRun)
      .where(eq(treematchAutomatchRun.projectId, projectId))
      .orderBy(desc(treematchAutomatchRun.startedAt))
      .limit(1);
    return row ? this.toDto(row) : null;
  }

  /**
   * Apply a planned run.
   *
   * The whole write is the existing match path: same advisory locks, same lock
   * ordering, same capacity check, same derived absolute totals, same TTC PUT
   * inside the same transaction. Auto-match adds no second way to write an
   * allocation.
   */
  async apply(
    projectId: number,
    userId: number,
    runUid: string,
    dto: ApplyAutomatchRunDto = {},
  ) {
    const run = await this.lockPlannedRun(projectId, runUid);
    const plan = run.plan;

    // The trees come from the stored plan, never from the request: the body
    // only says which pairs to keep. A pair the planner did not produce is
    // rejected rather than silently written with a client-supplied amount.
    const selected = selectPlanPairs(plan?.pairs ?? [], dto.pairs);
    if (dto.pairs && selected.length !== dto.pairs.length) {
      // Put the run back so the user can retry rather than losing the plan.
      await this.drizzleService.db
        .update(treematchAutomatchRun)
        .set({ status: 'planned' })
        .where(eq(treematchAutomatchRun.id, run.id));
      throw new BadRequestException(
        'Some of the selected links are not part of this plan. Reload and try again.',
      );
    }

    if (!selected.length) {
      this.runLog(
        runUid,
        plan?.pairs.length
          ? 'apply: every link was removed, nothing written'
          : 'apply: plan is empty, nothing written',
      );
      await this.drizzleService.db
        .update(treematchAutomatchRun)
        .set({ status: 'completed', finishedAt: new Date() })
        .where(eq(treematchAutomatchRun.id, run.id));
      return { applied: {} as Record<string, number> };
    }

    const startedAt = Date.now();
    const plannedTrees = selected.reduce((sum, pair) => sum + pair.trees, 0);
    const donations = new Set(selected.map((pair) => pair.contributionId)).size;
    const locations = new Set(selected.map((pair) => pair.interventionUid)).size;
    const dropped = (plan?.pairs.length ?? 0) - selected.length;
    this.runLog(
      runUid,
      `apply: ${selected.length} pairs, ${fmtTrees(plannedTrees)} trees, ` +
        `${donations} donations -> ${locations} locations` +
        (dropped > 0 ? ` (${dropped} link(s) removed by the user)` : ''),
    );

    try {
      const result = await this.treeMatchService.createMatches(projectId, userId, {
        matches: selected.map((pair) => ({
          contributionId: pair.contributionId,
          interventionUid: pair.interventionUid,
          trees: pair.trees,
        })),
      });

      await this.drizzleService.db
        .update(treematchAutomatchRun)
        .set({
          status: 'completed',
          matchedUnits: selected.reduce((sum, p) => sum + toCentiUnits(p.trees), 0),
          contributionsMatched: donations,
          interventionsFilled: locations,
          finishedAt: new Date(),
        })
        .where(eq(treematchAutomatchRun.id, run.id));

      this.runLog(
        runUid,
        `applied: TTC accepted ${Object.keys(result.applied || {}).length} contribution ` +
          `totals in ${since(startedAt)}`,
      );
      return result;
    } catch (error: any) {
      // A 409 means capacity moved since the plan was made; anything else came
      // from TTC. Either way the plan is spent: the user runs again.
      const message = error?.message || String(error);
      this.logger.error(
        `[${runUid}] apply failed after ${since(startedAt)} ` +
          `(status ${error?.status ?? 'none'}): ${message}`,
      );
      await this.drizzleService.db
        .update(treematchAutomatchRun)
        .set({
          status: 'failed',
          error: message,
          finishedAt: new Date(),
        })
        .where(eq(treematchAutomatchRun.id, run.id));
      throw error;
    }
  }

  async discard(projectId: number, runUid: string): Promise<AutomatchRunDto> {
    const updated = await this.drizzleService.db
      .update(treematchAutomatchRun)
      .set({ status: 'discarded', finishedAt: new Date() })
      .where(and(
        eq(treematchAutomatchRun.projectId, projectId),
        eq(treematchAutomatchRun.uid, runUid),
        inArray(treematchAutomatchRun.status, ['planning', 'planned']),
      ))
      .returning();
    if (!updated.length) {
      throw new NotFoundException('No open auto-match run with that id');
    }
    this.runLog(runUid, `discarded by user (project ${projectId})`);
    return this.toDto(updated[0]);
  }

  // --- Claiming -------------------------------------------------------------

  /**
   * Insert the run row. The partial unique index rejects a second open run for
   * the project; an expired plan or a crashed 'planning' row is closed first
   * and the insert retried once.
   */
  private async claimRun(
    projectId: number,
    userId: number,
  ): Promise<{ id: number; uid: string }> {
    const insert = async () => {
      try {
        const [row] = await this.drizzleService.db
          .insert(treematchAutomatchRun)
          .values({ uid: generateUid('tmar'), projectId, createdById: userId })
          .returning({ id: treematchAutomatchRun.id, uid: treematchAutomatchRun.uid });
        return row;
      } catch (error: any) {
        const code = error?.code ?? error?.cause?.code;
        if (code === '23505') return null; // the open-run unique index
        throw error;
      }
    };

    const first = await insert();
    if (first) return first;

    const now = new Date();
    const closed = await this.drizzleService.db
      .update(treematchAutomatchRun)
      .set({ status: 'discarded', finishedAt: now })
      .where(and(
        eq(treematchAutomatchRun.projectId, projectId),
        or(
          // A plan nobody applied in time.
          and(
            eq(treematchAutomatchRun.status, 'planned'),
            lt(treematchAutomatchRun.expiresAt, now),
          ),
          // A planning run whose process died.
          and(
            eq(treematchAutomatchRun.status, 'planning'),
            lt(treematchAutomatchRun.startedAt, new Date(now.getTime() - STALE_PLANNING_MS)),
          ),
          // An apply that died mid-flight. Closing the row only frees the
          // project slot; it neither undoes nor repeats any write, and an
          // apply is one bounded transaction, so nothing this old is alive.
          and(
            eq(treematchAutomatchRun.status, 'applying'),
            lt(treematchAutomatchRun.startedAt, new Date(now.getTime() - STALE_APPLYING_MS)),
          ),
        ),
      ))
      .returning({ id: treematchAutomatchRun.id });

    if (closed.length) {
      // Expected after a crash or an abandoned plan, but worth a line: it is
      // also what a run looks like when a user's earlier plan quietly expired.
      this.logger.warn(
        `Project ${projectId}: discarded ${closed.length} stale auto-match run(s) ` +
          'to free the run slot',
      );
      const second = await insert();
      if (second) return second;
    }

    this.logger.warn(
      `Project ${projectId}: an auto-match run is already open; new run rejected`,
    );
    throw new ConflictException(
      'An auto-match run is already open for this project. Apply or discard it first.',
    );
  }

  private async lockPlannedRun(projectId: number, runUid: string) {
    // Flip to 'applying' as the claim, so two concurrent applies cannot both
    // send the same plan.
    const claimed = await this.drizzleService.db
      .update(treematchAutomatchRun)
      .set({ status: 'applying' })
      .where(and(
        eq(treematchAutomatchRun.projectId, projectId),
        eq(treematchAutomatchRun.uid, runUid),
        eq(treematchAutomatchRun.status, 'planned'),
      ))
      .returning();
    if (!claimed.length) {
      // Usually a double-click, an expired plan, or an apply that already ran.
      this.runWarn(runUid, 'apply rejected: the run is not in "planned" state');
      throw new ConflictException(
        'This run has no plan waiting to be applied. Start a new run.',
      );
    }
    return claimed[0];
  }

  // --- Planning -------------------------------------------------------------

  private async plan(
    run: { id: number; uid: string },
    projectId: number,
    dto: StartAutomatchRunDto,
  ): Promise<void> {
    const runId = run.id;
    const runUid = run.uid;
    const startedAt = Date.now();

    const rules = await this.loadEnabledRules(projectId);
    const snapshot: TreematchRuleSnapshot[] = [...rules, DEFAULT_RULE].map((rule) => ({
      uid: rule.uid,
      label: rule.label,
      definition: rule.definition,
    }));
    await this.drizzleService.db
      .update(treematchAutomatchRun)
      .set({ rulesSnapshot: snapshot })
      .where(eq(treematchAutomatchRun.id, runId));

    this.runLog(
      runUid,
      rules.length
        ? `rules: ${rules.length} enabled + catch-all -- ${rules.map(describeRule).join(', ')}`
        : 'rules: none enabled, catch-all only',
    );
    for (const rule of rules) {
      if (rule.preferSiteMissing) {
        this.runWarn(
          runUid,
          `rule "${rule.label}" prefers a site that no longer exists ` +
            `(${rule.definition.prefer.siteUid}); it will match nothing`,
        );
      }
    }

    const interventions = await this.treeMatchService.loadMatchableInterventions(projectId);
    const freeCenti = interventions.reduce((sum, iv) => sum + iv.availableCenti, 0);
    const withRoom = interventions.filter((iv) => iv.availableCenti > 0).length;
    this.runLog(
      runUid,
      `capacity: ${fmtTrees(toTrees(freeCenti))} free trees across ${withRoom} of ` +
        `${interventions.length} matchable locations`,
    );

    // Nothing to fill: finish without touching TTC at all. This is the whole
    // point of bounding the sweep by local capacity.
    if (freeCenti <= 0) {
      this.runWarn(
        runUid,
        interventions.length
          ? 'planned nothing: every matchable location is already full. No TTC call made.'
          : 'planned nothing: the project has no matchable locations (approved, ' +
              'complete captures, not plots). No TTC call made.',
      );
      await this.storePlan(runId, emptyPlan(interventions.length));
      return;
    }

    const wantedCenti = Math.min(
      freeCenti,
      dto.maxTrees ? toCentiUnits(dto.maxTrees) : Number.POSITIVE_INFINITY,
    );
    if (wantedCenti < freeCenti) {
      this.runLog(
        runUid,
        `target: ${fmtTrees(toTrees(wantedCenti))} trees (maxTrees caps the free capacity)`,
      );
    }

    const projectUid = await this.treeMatchService.getProjectUid(projectId);
    const signatures = [...new Set(['', ...rules.map((r) => sweepSignatureOf(r.definition))])];

    // Say this before the wait, not after it. TTC serves one page at a time, so
    // the worst case is the whole budget serialized, and a project with more
    // free trees than a sweep can ever cover always pays it in full.
    this.runLog(
      runUid,
      `sweep: ${signatures.length} donation list(s) to read ` +
        `(${signatures.map((s) => s || 'all donations').join(', ')}), up to ` +
        `${MAX_SCAN_PAGES} pages each. TTC serializes these at roughly 0.7s a page, ` +
        `so worst case is ${signatures.length * MAX_SCAN_PAGES} pages and about ` +
        `${Math.round(signatures.length * MAX_SCAN_PAGES * 0.7)}s.`,
    );

    const sweptAt = Date.now();
    const scan = await this.sweep(
      runId,
      runUid,
      projectUid,
      signatures,
      wantedCenti,
      dto.scan || 'oldest',
    );
    this.runLog(
      runUid,
      `sweep done: ${scan.pagesRead} page(s) over ${signatures.length} list(s), ` +
        `${scan.contributionsById.size} distinct donations, ${since(sweptAt)}` +
        (scan.stopped
          ? ' (stopped by the user)'
          : scan.truncated
            ? ' (truncated by the page cap)'
            : ''),
    );

    const result = planAutomatch({
      rules,
      interventions,
      contributionIdsBySignature: scan.idsBySignature,
      contributionsById: scan.contributionsById,
      now: new Date(),
      maxPairs: dto.maxPairs || MAX_PLAN_PAIRS,
      maxCenti: dto.maxTrees ? toCentiUnits(dto.maxTrees) : undefined,
    });
    this.logPlanResult(runUid, result, startedAt);

    // A sweep reaches donations the client never loaded, so the plan carries
    // its own labels rather than leaving the review screen to show raw ids.
    const hidByUid = new Map(interventions.map((iv) => [iv.uid, iv.hid]));

    await this.storePlan(runId, {
      pairs: result.pairs.map((pair) => ({
        contributionId: pair.ttcContributionId,
        interventionUid: pair.interventionUid,
        trees: toTrees(pair.centi),
        donationRef:
          scan.contributionsById.get(pair.ttcContributionId)?.donationRef ?? null,
        interventionHid: hidByUid.get(pair.interventionUid) || pair.interventionUid,
      })),
      perRule: result.perRule.map((rule) => ({
        ruleUid: rule.ruleUid,
        label: rule.label,
        matchedTrees: toTrees(rule.matchedCenti),
        contributionsUsed: rule.contributionsUsed,
        ...(rule.siteMissing ? { siteMissing: true } : {}),
        ...(rule.skipped ? { skipped: rule.skipped } : {}),
      })),
      scan: {
        pagesRead: scan.pagesRead,
        donationsSeen: scan.contributionsById.size,
        truncated: scan.truncated,
      },
      capped: result.capped,
      // Only when the plan placed nothing: that is the case the review dialog
      // cannot explain on its own.
      ...(result.pairs.length
        ? {}
        : {
            empty: emptyPlanBlock(
              emptyPlanReason(result.diagnostics),
              result.diagnostics,
            ),
          }),
    });
  }

  /**
   * Narrate what the planner did with what the sweep gave it.
   *
   * An empty plan is a normal outcome here (nothing open, everything already
   * matched, an exclusion rule holding it all back), so the interesting part is
   * always the reason. The planner counts rejections per reason precisely so
   * these lines can name one instead of shrugging.
   */
  private logPlanResult(
    runUid: string,
    result: AutomatchPlanResult,
    startedAt: number,
  ): void {
    const d = result.diagnostics;

    this.runLog(
      runUid,
      `donations: ${d.donationsSeen} seen, ${d.ignoredDonations} ignored, ` +
        `${d.openDonations} still open (${fmtTrees(toTrees(d.openCenti))} trees); ` +
        `priority ${fmtPriorities(d.priorityCounts)}`,
    );

    // perRule and diagnostics.perRule are built in lockstep, one entry per rule
    // in evaluation order, so the index is the join.
    for (const [index, rule] of d.perRule.entries()) {
      const summary = result.perRule[index];
      if (rule.skippedByCap) {
        this.runLog(runUid, `rule "${rule.label}": not evaluated, the plan was already capped`);
        continue;
      }
      const dropped = rule.dropped.ignored + rule.dropped.spent + rule.dropped.filtered;
      const outcome = summary?.siteMissing
        ? 'preferred site is gone, placed nothing'
        : summary?.skipped != null
          ? `held back ${summary.skipped} donation(s) from later rules (skip rule)`
        : // locationsWithRoom is the pool as the rule found it, not how many it
          // filled: a rule that places nothing with plenty of room left is a
          // donation problem, one with zero room is a capacity problem.
          `placed ${fmtTrees(toTrees(summary?.matchedCenti || 0))} trees from ` +
          `${summary?.contributionsUsed || 0} donation(s) ` +
          `(pool: ${rule.locationsWithRoom} of ${rule.locationPool} locations had room)`;

      this.runLog(
        runUid,
        `rule "${rule.label}" [${rule.sweepSignature || 'all donations'}]: ` +
          `swept ${rule.sweptDonations}, dropped ${dropped} ` +
          `(ignored ${rule.dropped.ignored}, spent ${rule.dropped.spent}, ` +
          `filters ${rule.dropped.filtered}), ` +
          `eligible ${rule.eligibleDonations} -> ${outcome}`,
      );
    }

    if (result.pairs.length) {
      this.runLog(
        runUid,
        `planned: ${result.pairs.length} pairs, ` +
          `${fmtTrees(toTrees(result.totals.matchedCenti))} trees, ` +
          `${result.totals.contributionsMatched} donations -> ` +
          `${result.totals.interventionsFilled} locations` +
          (result.capped ? ', capped (more work remains, run again)' : '') +
          `, in ${since(startedAt)}`,
      );
      return;
    }

    const reason = emptyPlanReason(d);
    this.runWarn(
      runUid,
      `planned nothing (${reason}): ${describeEmptyReason(reason, d)}. ` +
        `Took ${since(startedAt)}`,
    );
  }

  private async storePlan(runId: number, plan: TreematchAutomatchPlan): Promise<void> {
    const now = new Date();
    const stored = await this.drizzleService.db
      .update(treematchAutomatchRun)
      .set({
        status: 'planned',
        plan,
        plannedAt: now,
        expiresAt: new Date(now.getTime() + PLAN_TTL_MS),
      })
      // Still 'planning' only: the user can discard a run while the sweep is
      // in flight, and a finished sweep must not bring it back to life.
      .where(and(
        eq(treematchAutomatchRun.id, runId),
        eq(treematchAutomatchRun.status, 'planning'),
      ))
      .returning({ id: treematchAutomatchRun.id });

    if (!stored.length) {
      this.logger.warn(
        `Auto-match run ${runId} was closed (discarded or taken over) while planning; ` +
          'the finished plan was dropped',
      );
    }
  }

  /**
   * Read TTC until there are enough open donations to fill the free trees.
   *
   * A full sweep is not viable: one project has 172k contributions and TTC
   * serves about one page per 700ms, serialized, so paging everything is ~20
   * minutes and every extra signature stacks on top. Free capacity is known
   * locally before the sweep starts, so the sweep can stop as soon as it has
   * collected enough open donations to use it all.
   */
  private async sweep(
    runId: number,
    runUid: string,
    projectUid: string,
    signatures: string[],
    wantedCenti: number,
    direction: 'oldest' | 'newest',
  ): Promise<{
    idsBySignature: Map<string, number[]>;
    contributionsById: Map<number, PlannerContribution>;
    pagesRead: number;
    truncated: boolean;
    stopped: boolean;
  }> {
    const idsBySignature = new Map<string, number[]>();
    const contributionsById = new Map<number, PlannerContribution>();
    let pagesRead = 0;
    let truncated = false;
    let stopped = false;

    // One entry per list up front, so the UI can draw every bar from the first
    // poll instead of having them appear one at a time.
    const progress: TreematchAutomatchProgress = {
      lists: signatures.map((signature) => ({
        signature,
        page: 0,
        maxPages: MAX_SCAN_PAGES,
        done: false,
      })),
      donationsRead: 0,
      usableDonations: 0,
    };
    await this.publishProgress(runId, progress);

    for (const [listIndex, signature] of signatures.entries()) {
      if (stopped) break;
      const params = paramsForSignature(signature);
      const label = signature || 'all donations';
      const ids: number[] = [];
      // Each signature needs its own budget: a company sweep that stops early
      // must not starve the unfiltered one that follows it.
      let openCenti = 0;
      let page = 1;
      const listStartedAt = Date.now();
      let stopReason = 'no more pages';

      for (;;) {
        const pageStartedAt = Date.now();
        const response = await this.ttcClient.listContributions(projectUid, {
          page,
          limit: SCAN_PAGE_LIMIT,
          sortBy: direction === 'newest' ? '-paymentDate' : '+paymentDate',
          ...params,
        });
        pagesRead += 1;

        const items = response.items || [];
        const pagePriorities: Record<string, number> = {};
        for (const item of items) {
          ids.push(item.id);
          if (!contributionsById.has(item.id)) {
            const contribution = toPlannerContribution(item);
            contributionsById.set(item.id, contribution);
            // Counted as they arrive: lists overlap, so this has to key off
            // "first time seen", and rescanning the whole map every page would
            // be 100 passes over up to 10,000 entries for one number.
            if (isUsable(contribution)) progress.usableDonations += 1;
          }
          openCenti += Math.max(0, item.units - item.unitsAllocated);
          const priority = item.allocationPriority || 'unknown';
          pagePriorities[priority] = (pagePriorities[priority] || 0) + 1;
        }

        progress.lists[listIndex].page = page;
        progress.donationsRead = contributionsById.size;
        await this.publishProgress(runId, progress);

        // Every page, at the default level. This is the slow phase: TTC serves
        // one page at a time at roughly 0.7s each and a list may run to 20
        // pages, so a run with two lists sits here for half a minute. Behind a
        // debug flag it made the longest part of a run the only silent one.
        this.runLog(
          runUid,
          `sweep [${label}] page ${page}/${MAX_SCAN_PAGES}: ${items.length} items, ` +
            `${fmtTrees(toTrees(openCenti))} of ${fmtTrees(toTrees(wantedCenti))} ` +
            `open trees collected, ${since(pageStartedAt)}`,
        );
        this.runDebug(
          runUid,
          `sweep [${label}] page ${page} priority mix: ${fmtPriorities(pagePriorities)}`,
        );

        // Enough open donations in hand to use every free tree.
        if (openCenti >= wantedCenti) {
          stopReason = 'collected enough open trees';
          break;
        }

        // Between pages, never mid-page: the plan then always describes a whole
        // number of pages, and the user's stop lands within about one page.
        if (await this.stopWasRequested(runId)) {
          stopped = true;
          stopReason = 'the user stopped it';
          break;
        }

        const hasNext = Boolean(response._links?.next) && items.length > 0;
        if (!hasNext) break;

        if (page >= MAX_SCAN_PAGES) {
          truncated = true;
          stopReason = `hit the ${MAX_SCAN_PAGES}-page cap`;
          this.runWarn(
            runUid,
            `sweep [${label}] hit the ${MAX_SCAN_PAGES}-page cap with only ` +
              `${fmtTrees(toTrees(openCenti))} of ${fmtTrees(toTrees(wantedCenti))} ` +
              'open trees found. ' +
              (direction === 'oldest'
                ? "The oldest pages are likely all matched already; try scan: 'newest'."
                : 'The plan will use only what this sweep reached; run again to continue.'),
          );
          break;
        }
        page += 1;
      }

      this.runLog(
        runUid,
        `sweep [${label}]: ${page} page(s), ${ids.length} donations, ` +
          `${fmtTrees(toTrees(openCenti))} open trees, stopped because it ` +
          `${stopReason}, ${since(listStartedAt)}`,
      );

      progress.lists[listIndex].done = true;
      idsBySignature.set(signature, ids);
    }

    if (stopped) {
      progress.stopped = true;
      this.runWarn(
        runUid,
        `sweep stopped by the user after ${pagesRead} page(s); ` +
          `planning with the ${contributionsById.size} donations read so far`,
      );
    }
    await this.publishProgress(runId, progress);

    return { idsBySignature, contributionsById, pagesRead, truncated, stopped };
  }

  /**
   * Rewrite the run's progress. Fire and forget on failure: this is a display
   * detail, and losing one update must never abort a sweep that is otherwise
   * working. Called once per page, which is a write every ~700ms.
   */
  private async publishProgress(
    runId: number,
    progress: TreematchAutomatchProgress,
  ): Promise<void> {
    try {
      await this.drizzleService.db
        .update(treematchAutomatchRun)
        .set({ progress: { ...progress, lists: progress.lists.map((l) => ({ ...l })) } })
        .where(eq(treematchAutomatchRun.id, runId));
    } catch (error: any) {
      this.logger.warn(
        `Could not publish auto-match progress for run ${runId}: ${error?.message || error}`,
      );
    }
  }

  private async stopWasRequested(runId: number): Promise<boolean> {
    try {
      const [row] = await this.drizzleService.db
        .select({ stopRequested: treematchAutomatchRun.stopRequested })
        .from(treematchAutomatchRun)
        .where(eq(treematchAutomatchRun.id, runId))
        .limit(1);
      return Boolean(row?.stopRequested);
    } catch {
      // A failed read must not stop the sweep; the page cap still bounds it.
      return false;
    }
  }

  /** Ask a planning run to stop reading and plan with what it has. */
  async requestStop(projectId: number, runUid: string): Promise<AutomatchRunDto> {
    const updated = await this.drizzleService.db
      .update(treematchAutomatchRun)
      .set({ stopRequested: true })
      .where(and(
        eq(treematchAutomatchRun.projectId, projectId),
        eq(treematchAutomatchRun.uid, runUid),
        eq(treematchAutomatchRun.status, 'planning'),
      ))
      .returning();
    if (!updated.length) {
      throw new NotFoundException('No planning auto-match run with that id');
    }
    this.runLog(runUid, 'stop requested; the sweep will finish its current page');
    return this.toDto(updated[0]);
  }

  // --- Loading --------------------------------------------------------------

  private async loadEnabledRules(projectId: number): Promise<PlannerRule[]> {
    const rows = await this.drizzleService.db
      .select({
        uid: treematchRule.uid,
        label: treematchRule.label,
        enabled: treematchRule.enabled,
        definition: treematchRule.definition,
      })
      .from(treematchRule)
      .where(and(eq(treematchRule.projectId, projectId), eq(treematchRule.enabled, true)))
      .orderBy(asc(treematchRule.position));

    const siteUids = rows
      .map((row) => row.definition?.prefer?.siteUid)
      .filter((uid): uid is string => Boolean(uid));

    const siteIdByUid = siteUids.length
      ? new Map(
          (
            await this.drizzleService.db
              .select({ uid: site.uid, id: site.id })
              .from(site)
              .where(and(
                eq(site.projectId, projectId),
                inArray(site.uid, siteUids),
                isNull(site.deletedAt),
              ))
          ).map((row) => [row.uid, row.id]),
        )
      : new Map<string, number>();

    return rows.map((row) => {
      const siteUid = row.definition.prefer.siteUid;
      const preferSiteId = siteUid ? siteIdByUid.get(siteUid) ?? null : null;
      return {
        uid: row.uid,
        label: row.label,
        definition: row.definition,
        preferSiteId,
        // A site deleted after the rule was saved: the rule matches nothing and
        // its donations fall through, rather than failing the run.
        preferSiteMissing: Boolean(siteUid) && preferSiteId == null,
      };
    });
  }

  private toDto(row: typeof treematchAutomatchRun.$inferSelect): AutomatchRunDto {
    return {
      uid: row.uid,
      status: row.status as AutomatchRunDto['status'],
      plan: row.plan ?? null,
      progress: row.progress ?? null,
      stopRequested: row.stopRequested,
      matchedTrees: toTrees(row.matchedUnits),
      contributionsMatched: row.contributionsMatched,
      locationsFilled: row.interventionsFilled,
      error: row.error,
      startedAt: row.startedAt,
      plannedAt: row.plannedAt,
      finishedAt: row.finishedAt,
      expiresAt: row.expiresAt,
    };
  }
}

// --- Log formatting ---------------------------------------------------------

function since(startedAt: number): string {
  const ms = Date.now() - startedAt;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

// Unit counts can be fractional (TTC works in hundredths); show decimals only
// when there are any, the same rule the web client uses.
function fmtTrees(trees: number): string {
  return Number.isInteger(trees) ? String(trees) : trees.toFixed(2);
}

function fmtPriorities(counts: Record<string, number>): string {
  const entries = Object.entries(counts);
  if (!entries.length) return 'none';
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([priority, count]) => `${priority}=${count}`)
    .join(' ');
}

function describeRule(rule: PlannerRule): string {
  const { when, prefer, orderBy, action } = rule.definition;
  const sweep = when.sweep === 'country' ? `country:${when.country}` : when.sweep;
  const filters = when.filters?.length ? `+${when.filters.length}f` : '';
  return `"${rule.label}" [${sweep}${filters}/${prefer.type}/${orderBy}/${action}]`;
}

/**
 * Which of the several very different causes produced an empty plan, checked in
 * the order the planner rejects donations. Reads only the counts the planner
 * returned; it re-derives nothing.
 */
function emptyPlanReason(d: PlanDiagnostics): TreematchAutomatchEmptyReason {
  if (d.locations === 0) return 'noLocations';
  if (d.freeCenti <= 0) return 'noFreeTrees';
  if (d.donationsSeen === 0) return 'noDonations';
  if (d.ignoredDonations === d.donationsSeen) return 'allIgnored';
  if (d.openDonations === 0) return 'allAllocated';
  if (d.usableDonations === 0 || d.perRule.some((rule) => rule.dropped.filtered > 0)) {
    return 'filteredOut';
  }
  return 'noRoom';
}

/** The same reason worded for whoever is reading the server log. */
function describeEmptyReason(
  reason: TreematchAutomatchEmptyReason,
  d: PlanDiagnostics,
): string {
  switch (reason) {
    case 'noLocations':
      return 'the project has no matchable locations';
    case 'noFreeTrees':
      return `all ${d.locations} matchable locations are already full`;
    case 'noDonations':
      return 'the donation backend returned no contributions for this project';
    case 'allIgnored':
      return `all ${d.donationsSeen} donations swept are marked ignored`;
    case 'allAllocated':
      return `all ${d.donationsSeen} donations swept are already fully allocated`;
    case 'filteredOut':
      // The priority spread is named here because a rule filtering on
      // allocationPriority is the likeliest way to reject everything, and it is
      // invisible otherwise.
      return (
        'the rules filtered out every usable donation, see the per-rule lines ' +
        `above (priorities seen: ${fmtPriorities(d.priorityCounts)})`
      );
    default:
      return 'no usable donation reached a location with room, see the per-rule lines above';
  }
}

/** The counts the review dialog needs to word the reason for a user. */
function emptyPlanBlock(
  reason: TreematchAutomatchEmptyReason,
  d: PlanDiagnostics,
): NonNullable<TreematchAutomatchPlan['empty']> {
  return {
    reason,
    donationsSeen: d.donationsSeen,
    ignoredDonations: d.ignoredDonations,
    openDonations: d.openDonations,
    usableDonations: d.usableDonations,
    priorityCounts: d.priorityCounts,
    freeTrees: toTrees(d.freeCenti),
    locations: d.locations,
    locationsWithRoom: d.locationsWithRoom,
  };
}

// The pre-sweep exit: no TTC call happened, so every donation count is zero and
// the reason is purely local.
function emptyPlan(locations: number): TreematchAutomatchPlan {
  return {
    pairs: [],
    perRule: [],
    scan: { pagesRead: 0, donationsSeen: 0, truncated: false },
    capped: false,
    empty: {
      reason: locations ? 'noFreeTrees' : 'noLocations',
      donationsSeen: 0,
      ignoredDonations: 0,
      openDonations: 0,
      usableDonations: 0,
      priorityCounts: {},
      freeTrees: 0,
      locations,
      locationsWithRoom: 0,
    },
  };
}

type PlanPair = TreematchAutomatchPlan['pairs'][number];

/**
 * Narrow a stored plan to the pairs the client kept.
 *
 * Matching is by (contributionId, interventionUid) only; the tree amount always
 * comes from the plan. A selection entry that names no stored pair is dropped
 * here, and the caller turns a short result into a 400 rather than quietly
 * applying less than the user asked for.
 */
function selectPlanPairs(
  pairs: PlanPair[],
  selection?: Array<{ contributionId: number; interventionUid: string }>,
): PlanPair[] {
  if (!selection) return pairs;
  const wanted = new Set(
    selection.map((pair) => `${pair.contributionId}:${pair.interventionUid}`),
  );
  return pairs.filter((pair) =>
    wanted.has(`${pair.contributionId}:${pair.interventionUid}`),
  );
}

// The same test the planner applies before any rule's own filters run. Kept
// here as a one-liner rather than exported from the planner so the pure module
// keeps a single entry point.
function isUsable(contribution: PlannerContribution): boolean {
  return !contribution.ignored && contribution.availableCenti > 0;
}

function toPlannerContribution(item: TtcContributionItem): PlannerContribution {
  const paymentDate = item.donation?.paymentDate
    ? new Date(item.donation.paymentDate)
    : null;
  return {
    ttcId: item.id,
    paymentDate: paymentDate && !Number.isNaN(paymentDate.getTime()) ? paymentDate : null,
    allocationPriority: item.allocationPriority ?? null,
    unitsCenti: item.units ?? 0,
    availableCenti: Math.max(0, (item.units ?? 0) - (item.unitsAllocated ?? 0)),
    unitType: item.unitType,
    currency: item.currency ?? item.donation?.currency ?? null,
    donationRef: item.donation?.uid ?? null,
    ignored: Boolean(item.ignored),
  };
}
