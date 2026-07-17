// Pure planning core of the auto-match engine: no DI, no DB, no I/O.
// Everything is centi-units (100 = 1 tree), same as the ledger.
//
// The planner walks the enabled rules top to bottom, appends the implicit
// catch-all default, and greedily fills plant locations from the donations
// each rule selects. Consumption state is shared across rules so a donation
// that several rule filters select (e.g. a German company donation matched
// by both a 'company' and a 'country: DE' rule) can never be double-spent.

export interface PlannerRule {
  // null = the implicit default catch-all.
  uid: string | null;
  label: string;
  whenType: 'all' | 'company' | 'individual' | 'country' | 'donor';
  whenValue: string | null;
  preferType: 'oldest' | 'site' | 'capacity';
  preferSiteId: number | null;
  // The preferred site no longer exists (soft-deleted): the rule matches
  // nothing and its donations fall through to later rules.
  preferSiteDeleted?: boolean;
  orderBy: 'oldest' | 'largest';
}

export interface PlannerIntervention {
  id: number;
  uid: string;
  siteId: number | null;
  interventionStartDate: Date | null;
  availableCenti: number;
}

export interface PlannerContribution {
  ttcId: number;
  paymentDate: Date | null;
  allocationPriority: string | null;
  availableCenti: number;
  donationRef: string | null;
  ignored: boolean;
}

export interface PlannedPair {
  ttcContributionId: number;
  interventionUid: string;
  deltaCenti: number;
  // First rule that touched the pair; per-rule stats stay exact in perRule.
  ruleUid: string | null;
}

export interface PlanRuleSummary {
  ruleUid: string | null;
  label: string;
  matchedCenti: number;
  contributionsUsed: number;
  siteMissing?: boolean;
}

export interface AutomatchPlan {
  pairs: PlannedPair[];
  perRule: PlanRuleSummary[];
  totals: {
    matchedCenti: number;
    contributionsMatched: number;
    interventionsFilled: number;
  };
}

// Auto-match only consumes these TTC allocation priorities. Allowlist on
// purpose: 'manual', 'never', and any future value stay untouched.
export const AUTOMATCH_PRIORITIES = new Set(['automatic', 'first']);

export const DEFAULT_RULE: PlannerRule = {
  uid: null,
  label: 'Everything else',
  whenType: 'all',
  whenValue: null,
  preferType: 'oldest',
  preferSiteId: null,
  orderBy: 'oldest',
};

/**
 * TTC list-filter signature a rule's donations come from. profileType and
 * country exist only as TTC query filters (items do not carry them), so each
 * distinct signature is one paged TTC fetch; '' is the unfiltered list, which
 * 'all', 'donor', and the default rule share.
 */
export function filterSignatureOf(
  rule: Pick<PlannerRule, 'whenType' | 'whenValue'>,
): string {
  switch (rule.whenType) {
    case 'company':
      return 'profileType=company';
    case 'individual':
      return 'profileType=individual';
    case 'country':
      return `country=${(rule.whenValue || '').toUpperCase()}`;
    default:
      return '';
  }
}

/** Inverse of filterSignatureOf, for building the TTC query. */
export function paramsForSignature(
  signature: string,
): { profileType?: 'individual' | 'company'; country?: string } {
  if (!signature) return {};
  const [key, value] = signature.split('=');
  if (key === 'profileType') return { profileType: value as 'individual' | 'company' };
  if (key === 'country') return { country: value };
  return {};
}

export function planAutomatch(
  enabledRules: PlannerRule[],
  interventions: PlannerIntervention[],
  contributionIdsBySignature: Map<string, number[]>,
  contributionsById: Map<number, PlannerContribution>,
): AutomatchPlan {
  // The default always applies last, even with zero saved or enabled rules.
  const rules = [...enabledRules, DEFAULT_RULE];

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

  for (const rule of rules) {
    const summary: PlanRuleSummary = {
      ruleUid: rule.uid,
      label: rule.label,
      matchedCenti: 0,
      contributionsUsed: 0,
    };
    perRule.push(summary);

    // --- Locations this rule fills, in preference order. -------------------
    let candidateIvs: PlannerIntervention[];
    if (rule.preferType === 'site') {
      if (rule.preferSiteId == null || rule.preferSiteDeleted) {
        summary.siteMissing = true;
        continue;
      }
      candidateIvs = interventions.filter((iv) => iv.siteId === rule.preferSiteId);
    } else {
      candidateIvs = [...interventions];
    }
    if (rule.preferType === 'capacity') {
      // Snapshot of remaining capacity at rule start; ties on id for
      // determinism.
      candidateIvs.sort(
        (a, b) =>
          (remainingByIntervention.get(b.uid) || 0) - (remainingByIntervention.get(a.uid) || 0) ||
          a.id - b.id,
      );
    } else {
      // 'oldest' (and within a site): oldest planting first, undated last.
      candidateIvs.sort((a, b) => {
        const ta = a.interventionStartDate ? a.interventionStartDate.getTime() : Infinity;
        const tb = b.interventionStartDate ? b.interventionStartDate.getTime() : Infinity;
        return ta - tb || a.id - b.id;
      });
    }

    // --- Donations this rule spends, in order. ------------------------------
    const signatureIds = contributionIdsBySignature.get(filterSignatureOf(rule)) || [];
    let candidates = signatureIds
      .map((id) => contributionsById.get(id))
      .filter((c): c is PlannerContribution => Boolean(c));
    if (rule.whenType === 'donor') {
      candidates = candidates.filter((c) => c.donationRef === rule.whenValue);
    }
    candidates = candidates.filter(
      (c) =>
        !c.ignored &&
        AUTOMATCH_PRIORITIES.has(c.allocationPriority || '') &&
        (remainingByContribution.get(c.ttcId) || 0) > 0,
    );
    candidates.sort((a, b) => {
      // TTC 'first' donations are consumed before 'automatic' ones.
      const pa = a.allocationPriority === 'first' ? 0 : 1;
      const pb = b.allocationPriority === 'first' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      if (rule.orderBy === 'largest') {
        const diff =
          (remainingByContribution.get(b.ttcId) || 0) - (remainingByContribution.get(a.ttcId) || 0);
        if (diff) return diff;
      } else {
        const ta = a.paymentDate ? a.paymentDate.getTime() : Infinity;
        const tb = b.paymentDate ? b.paymentDate.getTime() : Infinity;
        if (ta !== tb) return ta - tb;
      }
      return a.ttcId - b.ttcId;
    });

    // --- Greedy fill; remainders pass down via the shared state. ------------
    for (const contribution of candidates) {
      let contribRemaining = remainingByContribution.get(contribution.ttcId) || 0;
      if (contribRemaining <= 0) continue;
      let used = false;
      for (const iv of candidateIvs) {
        if (contribRemaining <= 0) break;
        const ivRemaining = remainingByIntervention.get(iv.uid) || 0;
        if (ivRemaining <= 0) continue;
        const take = Math.min(contribRemaining, ivRemaining);
        contribRemaining -= take;
        remainingByIntervention.set(iv.uid, ivRemaining - take);

        // Two rules can legitimately hit the same pair (e.g. a site rule and
        // the default whose oldest location sits in that site): one merged
        // delta per pair, since the ledger upserts per pair.
        const key = `${contribution.ttcId}:${iv.uid}`;
        const existing = mergedPairs.get(key);
        if (existing) {
          existing.deltaCenti += take;
        } else {
          mergedPairs.set(key, {
            ttcContributionId: contribution.ttcId,
            interventionUid: iv.uid,
            deltaCenti: take,
            ruleUid: rule.uid,
          });
        }
        summary.matchedCenti += take;
        used = true;
      }
      remainingByContribution.set(contribution.ttcId, contribRemaining);
      if (used) summary.contributionsUsed += 1;
    }
  }

  const pairs = [...mergedPairs.values()];
  return {
    pairs,
    perRule,
    totals: {
      matchedCenti: pairs.reduce((sum, pair) => sum + pair.deltaCenti, 0),
      contributionsMatched: new Set(pairs.map((pair) => pair.ttcContributionId)).size,
      interventionsFilled: new Set(pairs.map((pair) => pair.interventionUid)).size,
    },
  };
}
