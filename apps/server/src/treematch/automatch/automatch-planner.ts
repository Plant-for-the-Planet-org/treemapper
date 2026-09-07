// Pure planning core of auto-match: no DI, no DB, no I/O, no clock.
//
// The planner walks the enabled rules top to bottom, appends the implicit
// catch-all, and greedily fills plant locations from the donations each rule
// selects. Consumption state is shared across rules, so a donation that
// several rules select (a German company donation matched by both a company
// rule and a country rule) can never be spent twice.
//
// Everything here is centi-units (100 = 1 tree), TTC's scale. Conversion to
// whole trees happens where the plan is stored.

import { CENTI } from '../match-math';
import {
  DEFAULT_RULE,
  PlannerRule,
  RuleFilter,
  sweepSignatureOf,
} from './rule-types';

export interface PlannerIntervention {
  id: number;
  uid: string;
  siteId: number | null;
  interventionStartDate: Date | null;
  // review_status = 'approved' and not flagged. Only consulted by rules that
  // ask for it via prefer.onlyApproved.
  approved: boolean;
  availableCenti: number;
}

export interface PlannerContribution {
  ttcId: number;
  paymentDate: Date | null;
  allocationPriority: string | null;
  // Total funded amount and what is still open, both centi-units.
  unitsCenti: number;
  availableCenti: number;
  unitType: string;
  currency: string | null;
  donationRef: string | null;
  ignored: boolean;
}

export interface PlannedPair {
  ttcContributionId: number;
  interventionUid: string;
  centi: number;
  // First rule that touched the pair; per-rule totals stay exact in perRule.
  ruleUid: string | null;
}

export interface PlanRuleSummary {
  ruleUid: string | null;
  label: string;
  matchedCenti: number;
  contributionsUsed: number;
  siteMissing?: boolean;
  skipped?: number;
}

/**
 * Why a rule saw the donations it saw. The planner cannot log (it is pure and
 * has no DI), so it counts instead and the service turns this into log lines.
 * Without it an empty plan is indistinguishable from a broken one.
 */
export interface PlanRuleDiagnostics {
  ruleUid: string | null;
  label: string;
  sweepSignature: string;
  // Never evaluated: an earlier rule had already hit maxPairs / maxCenti.
  skippedByCap: boolean;
  // Donations the sweep collected for this rule's signature.
  sweptDonations: number;
  // First reason wins, in the order the planner rejects them.
  dropped: {
    ignored: number;
    // Nothing open left: allocated at TTC, or claimed by an earlier rule.
    spent: number;
    // Failed the rule's own when.filters. A rule that filters on
    // allocationPriority lands its rejections here, like any other condition.
    filtered: number;
  };
  eligibleDonations: number;
  // Locations this rule may fill, after the site / approved narrowing.
  locationPool: number;
  // Of those, how many still had room when the rule started.
  locationsWithRoom: number;
}

export interface PlanDiagnostics {
  donationsSeen: number;
  ignoredDonations: number;
  // Donations with at least one open centi-unit, and their total.
  openDonations: number;
  openCenti: number;
  // Open and not ignored. The pool every rule draws from before its own filters
  // run: when this is zero, no rule could ever have matched anything.
  usableDonations: number;
  // allocationPriority across every donation swept. Nothing gates on it any
  // more, but a rule can filter on it, so the spread is worth reporting.
  priorityCounts: Record<string, number>;
  locations: number;
  locationsWithRoom: number;
  freeCenti: number;
  perRule: PlanRuleDiagnostics[];
}

export interface AutomatchPlanResult {
  pairs: PlannedPair[];
  perRule: PlanRuleSummary[];
  // Hit maxPairs or maxCenti before running out of work.
  capped: boolean;
  totals: {
    matchedCenti: number;
    contributionsMatched: number;
    interventionsFilled: number;
  };
  // Counts only, for logging. Nothing reads this to make a decision.
  diagnostics: PlanDiagnostics;
}

export interface PlanInput {
  // Enabled rules in position order. The catch-all is appended here, not by
  // the caller.
  rules: PlannerRule[];
  interventions: PlannerIntervention[];
  contributionIdsBySignature: Map<string, number[]>;
  contributionsById: Map<number, PlannerContribution>;
  // Passed in rather than read from the clock, so planning stays pure.
  now: Date;
  // Never plan more pairs than one match request can carry.
  maxPairs: number;
  // Optional per-run tree cap, centi-units.
  maxCenti?: number;
}

// --- Filters ----------------------------------------------------------------

type Scalar = string | number | null;

/**
 * Value of one filter field for one donation. Returns null when the donation
 * cannot answer the question (no payment date, no currency), which makes the
 * filter fail rather than pass: a rule that cannot be evaluated should match
 * nothing.
 */
function fieldValue(
  contribution: PlannerContribution,
  field: RuleFilter['field'],
  now: Date,
): Scalar {
  switch (field) {
    case 'openTrees':
      return contribution.availableCenti / CENTI;
    case 'totalTrees':
      return contribution.unitsCenti / CENTI;
    case 'matchState': {
      const allocated = contribution.unitsCenti - contribution.availableCenti;
      if (allocated <= 0) return 'none';
      if (contribution.availableCenti <= 0) return 'complete';
      return 'partial';
    }
    case 'unitType':
      return contribution.unitType || null;
    case 'currency':
      return contribution.currency || null;
    case 'paymentDate':
      return contribution.paymentDate ? contribution.paymentDate.getTime() : null;
    case 'olderThanDays':
      return contribution.paymentDate
        ? (now.getTime() - contribution.paymentDate.getTime()) / 86_400_000
        : null;
    case 'donationRef':
      return contribution.donationRef;
    case 'allocationPriority':
      return contribution.allocationPriority;
    default:
      return null;
  }
}

// paymentDate is compared as a timestamp, so its rule value (an ISO string)
// has to become one too.
function normaliseValue(field: RuleFilter['field'], value: unknown): Scalar {
  if (field === 'paymentDate') {
    if (typeof value !== 'string') return null;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'string' || typeof value === 'number') return value;
  return null;
}

function compareScalar(op: RuleFilter['op'], left: Scalar, right: Scalar): boolean {
  if (left === null || right === null) return false;
  switch (op) {
    case 'eq':
      return left === right;
    case 'ne':
      return left !== right;
    case 'gt':
      return left > right;
    case 'gte':
      return left >= right;
    case 'lt':
      return left < right;
    case 'lte':
      return left <= right;
    default:
      return false;
  }
}

function matchesFilter(
  contribution: PlannerContribution,
  filter: RuleFilter,
  now: Date,
): boolean {
  const left = fieldValue(contribution, filter.field, now);
  if (left === null) return false;

  if (filter.op === 'in') {
    const values = Array.isArray(filter.value) ? filter.value : [filter.value];
    return values.some((value) => normaliseValue(filter.field, value) === left);
  }

  return compareScalar(filter.op, left, normaliseValue(filter.field, filter.value));
}

// --- Ordering ---------------------------------------------------------------

const startTime = (iv: PlannerIntervention): number =>
  iv.interventionStartDate ? iv.interventionStartDate.getTime() : Infinity;

function orderLocations(
  rule: PlannerRule,
  candidates: PlannerIntervention[],
  remainingByIntervention: Map<string, number>,
): PlannerIntervention[] {
  const sorted = [...candidates];
  const remaining = (iv: PlannerIntervention) => remainingByIntervention.get(iv.uid) || 0;

  switch (rule.definition.prefer.type) {
    case 'capacityHigh':
      // Snapshot of remaining capacity at rule start; ties on id so two runs
      // over the same data agree.
      sorted.sort((a, b) => remaining(b) - remaining(a) || a.id - b.id);
      break;
    case 'capacityLow':
      // Least free first, but full locations last rather than first.
      sorted.sort((a, b) => {
        const ra = remaining(a) > 0 ? remaining(a) : Infinity;
        const rb = remaining(b) > 0 ? remaining(b) : Infinity;
        return ra - rb || a.id - b.id;
      });
      break;
    case 'newest':
      sorted.sort((a, b) => {
        const ta = startTime(a);
        const tb = startTime(b);
        // Undated last in both directions, so it is never a silent first pick.
        if (ta === Infinity || tb === Infinity) return ta - tb || a.id - b.id;
        return tb - ta || a.id - b.id;
      });
      break;
    default:
      // 'oldest', and 'site' within the site: oldest planting first.
      sorted.sort((a, b) => startTime(a) - startTime(b) || a.id - b.id);
  }
  return sorted;
}

function orderDonations(
  rule: PlannerRule,
  candidates: PlannerContribution[],
  remainingByContribution: Map<number, number>,
): PlannerContribution[] {
  const sorted = [...candidates];
  const remaining = (c: PlannerContribution) => remainingByContribution.get(c.ttcId) || 0;
  const orderBy = rule.definition.orderBy;

  sorted.sort((a, b) => {
    // TTC 'first' donations are consumed before 'automatic' ones, whatever the
    // rule's own order says.
    const pa = a.allocationPriority === 'first' ? 0 : 1;
    const pb = b.allocationPriority === 'first' ? 0 : 1;
    if (pa !== pb) return pa - pb;

    if (orderBy === 'largest' || orderBy === 'smallest') {
      const diff =
        orderBy === 'largest' ? remaining(b) - remaining(a) : remaining(a) - remaining(b);
      if (diff) return diff;
    } else {
      const ta = a.paymentDate ? a.paymentDate.getTime() : Infinity;
      const tb = b.paymentDate ? b.paymentDate.getTime() : Infinity;
      if (ta !== tb) {
        // Undated last either way.
        if (ta === Infinity || tb === Infinity) return ta - tb;
        return orderBy === 'newest' ? tb - ta : ta - tb;
      }
    }
    return a.ttcId - b.ttcId;
  });
  return sorted;
}

// --- Planner ----------------------------------------------------------------

export function planAutomatch(input: PlanInput): AutomatchPlanResult {
  const { interventions, contributionIdsBySignature, contributionsById, now, maxPairs } = input;
  const maxCenti = input.maxCenti && input.maxCenti > 0 ? input.maxCenti : Infinity;

  // The catch-all applies last, even with zero saved or enabled rules.
  const rules = [...input.rules, DEFAULT_RULE];

  const remainingByContribution = new Map<number, number>();
  for (const contribution of contributionsById.values()) {
    remainingByContribution.set(contribution.ttcId, Math.max(0, contribution.availableCenti));
  }
  const remainingByIntervention = new Map<string, number>();
  for (const iv of interventions) {
    remainingByIntervention.set(iv.uid, Math.max(0, iv.availableCenti));
  }

  const mergedPairs = new Map<string, PlannedPair>();
  const perRule: PlanRuleSummary[] = [];
  const perRuleDiagnostics: PlanRuleDiagnostics[] = [];
  let placedCenti = 0;
  let capped = false;

  for (const rule of rules) {
    const summary: PlanRuleSummary = {
      ruleUid: rule.uid,
      label: rule.label,
      matchedCenti: 0,
      contributionsUsed: 0,
    };
    perRule.push(summary);

    const signature = sweepSignatureOf(rule.definition);
    const signatureIds = contributionIdsBySignature.get(signature) || [];
    const diagnostics: PlanRuleDiagnostics = {
      ruleUid: rule.uid,
      label: rule.label,
      sweepSignature: signature,
      skippedByCap: capped,
      sweptDonations: signatureIds.length,
      dropped: { ignored: 0, spent: 0, filtered: 0 },
      eligibleDonations: 0,
      locationPool: 0,
      locationsWithRoom: 0,
    };
    perRuleDiagnostics.push(diagnostics);
    if (capped) continue;

    // --- Donations this rule claims, in order. ----------------------------
    const filters = rule.definition.when.filters || [];
    // One pass with an explicit reason per rejection, rather than a chain of
    // predicates: "the rule matched nothing" is useless on its own, and the
    // reason is the whole diagnostic.
    const eligible: PlannerContribution[] = [];
    for (const id of signatureIds) {
      const contribution = contributionsById.get(id);
      if (!contribution) continue;
      if (contribution.ignored) {
        diagnostics.dropped.ignored += 1;
      } else if ((remainingByContribution.get(contribution.ttcId) || 0) <= 0) {
        diagnostics.dropped.spent += 1;
      } else if (!filters.every((filter) => matchesFilter(contribution, filter, now))) {
        diagnostics.dropped.filtered += 1;
      } else {
        eligible.push(contribution);
      }
    }
    diagnostics.eligibleDonations = eligible.length;
    const candidates = orderDonations(rule, eligible, remainingByContribution);

    // An exclusion rule places nothing and holds its donations back from every
    // later rule, including the catch-all.
    if (rule.definition.action === 'skip') {
      for (const contribution of candidates) {
        remainingByContribution.set(contribution.ttcId, 0);
      }
      summary.skipped = candidates.length;
      continue;
    }

    // --- Locations this rule fills, in preference order. ------------------
    let pool = interventions;
    if (rule.definition.prefer.type === 'site') {
      if (rule.preferSiteId == null || rule.preferSiteMissing) {
        // The preferred site is gone: match nothing, let the donations fall
        // through to later rules rather than failing the run.
        summary.siteMissing = true;
        continue;
      }
      const siteId = rule.preferSiteId;
      pool = pool.filter((iv) => iv.siteId === siteId);
    }
    if (rule.definition.prefer.onlyApproved) {
      pool = pool.filter((iv) => iv.approved);
    }
    diagnostics.locationPool = pool.length;
    diagnostics.locationsWithRoom = pool.filter(
      (iv) => (remainingByIntervention.get(iv.uid) || 0) > 0,
    ).length;
    const candidateIvs = orderLocations(rule, pool, remainingByIntervention);

    // --- Greedy fill; remainders pass down via the shared state. ----------
    for (const contribution of candidates) {
      if (capped) break;
      let contribRemaining = remainingByContribution.get(contribution.ttcId) || 0;
      if (contribRemaining <= 0) continue;
      let used = false;

      for (const iv of candidateIvs) {
        if (contribRemaining <= 0) break;
        const ivRemaining = remainingByIntervention.get(iv.uid) || 0;
        if (ivRemaining <= 0) continue;

        const key = `${contribution.ttcId}:${iv.uid}`;
        const existing = mergedPairs.get(key);
        // A new pair past the cap ends the plan. Topping up a pair that is
        // already in the plan costs no extra room in the match request.
        if (!existing && mergedPairs.size >= maxPairs) {
          capped = true;
          break;
        }

        const take = Math.min(contribRemaining, ivRemaining, maxCenti - placedCenti);
        if (take <= 0) {
          capped = true;
          break;
        }

        contribRemaining -= take;
        remainingByIntervention.set(iv.uid, ivRemaining - take);
        placedCenti += take;

        // Two rules can legitimately hit the same pair (a site rule, then the
        // catch-all whose oldest location sits in that site): one merged
        // amount per pair, since the write path upserts per pair.
        if (existing) {
          existing.centi += take;
        } else {
          mergedPairs.set(key, {
            ttcContributionId: contribution.ttcId,
            interventionUid: iv.uid,
            centi: take,
            ruleUid: rule.uid,
          });
        }
        summary.matchedCenti += take;
        used = true;

        if (placedCenti >= maxCenti) {
          capped = true;
          break;
        }
      }

      remainingByContribution.set(contribution.ttcId, contribRemaining);
      if (used) summary.contributionsUsed += 1;
    }
  }

  const pairs = [...mergedPairs.values()];
  return {
    pairs,
    perRule,
    capped,
    totals: {
      matchedCenti: pairs.reduce((sum, pair) => sum + pair.centi, 0),
      contributionsMatched: new Set(pairs.map((pair) => pair.ttcContributionId)).size,
      interventionsFilled: new Set(pairs.map((pair) => pair.interventionUid)).size,
    },
    diagnostics: {
      ...describeInputs(contributionsById, interventions),
      perRule: perRuleDiagnostics,
    },
  };
}

/**
 * Shape of what the sweep handed the planner, before any rule ran. Counted from
 * the inputs rather than tracked during the walk, so it always describes the
 * starting state even when the plan is empty.
 */
function describeInputs(
  contributionsById: Map<number, PlannerContribution>,
  interventions: PlannerIntervention[],
): Omit<PlanDiagnostics, 'perRule'> {
  const priorityCounts: Record<string, number> = {};
  let ignoredDonations = 0;
  let openDonations = 0;
  let openCenti = 0;
  let usableDonations = 0;

  for (const contribution of contributionsById.values()) {
    const priority = contribution.allocationPriority || 'unknown';
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    if (contribution.ignored) ignoredDonations += 1;
    if (contribution.availableCenti > 0) {
      openDonations += 1;
      openCenti += contribution.availableCenti;
      if (!contribution.ignored) usableDonations += 1;
    }
  }

  return {
    donationsSeen: contributionsById.size,
    ignoredDonations,
    openDonations,
    openCenti,
    usableDonations,
    priorityCounts,
    locations: interventions.length,
    locationsWithRoom: interventions.filter((iv) => iv.availableCenti > 0).length,
    freeCenti: interventions.reduce((sum, iv) => sum + Math.max(0, iv.availableCenti), 0),
  };
}
