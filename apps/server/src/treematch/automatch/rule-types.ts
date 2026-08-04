// Rule vocabulary for auto-match, plus the mapping from a rule to the TTC list
// it reads from. No DI, no DB, no I/O.
//
// The canonical shapes live on the column type in the database schema, since
// they are what `treematch_rule.definition` holds; this file re-exports them
// and adds the value lists the DTO validates against.

import type {
  TreematchAutomatchPlan,
  TreematchRuleDefinition,
  TreematchRuleFilter,
  TreematchRuleSnapshot,
} from '../../database/schema';

export type RuleDefinition = TreematchRuleDefinition;
export type RuleFilter = TreematchRuleFilter;
export type RuleSnapshot = TreematchRuleSnapshot;
export type AutomatchPlan = TreematchAutomatchPlan;

export const RULE_SWEEPS = ['any', 'company', 'individual', 'country'] as const;
export const RULE_PREFER_TYPES = [
  'oldest',
  'newest',
  'site',
  'capacityHigh',
  'capacityLow',
] as const;
export const RULE_ORDER_BY = ['oldest', 'newest', 'largest', 'smallest'] as const;
export const RULE_ACTIONS = ['match', 'skip'] as const;

// Every field is read straight off the TTC contribution item, so filtering on
// them is free. `donation.amount` is deliberately not here: it is minor units
// in mixed currencies, so "over 1000" would compare euros to pesos.
export const RULE_FILTER_FIELDS = [
  'openTrees',
  'totalTrees',
  'matchState',
  'unitType',
  'currency',
  'paymentDate',
  'olderThanDays',
  'donationRef',
  'allocationPriority',
] as const;

export const RULE_FILTER_OPS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in'] as const;

export type RuleSweep = (typeof RULE_SWEEPS)[number];
export type RulePreferType = (typeof RULE_PREFER_TYPES)[number];
export type RuleOrderBy = (typeof RULE_ORDER_BY)[number];
export type RuleAction = (typeof RULE_ACTIONS)[number];
export type RuleFilterField = (typeof RULE_FILTER_FIELDS)[number];
export type RuleFilterOp = (typeof RULE_FILTER_OPS)[number];

// Fields that only make sense against a number. Used by the DTO to reject
// `{ field: 'currency', op: 'gt', value: 5 }` before it reaches the planner.
export const NUMERIC_FILTER_FIELDS: ReadonlySet<string> = new Set([
  'openTrees',
  'totalTrees',
  'olderThanDays',
]);

// TTC's allocation priorities, offered as choices in the rule editor.
//
// `allocationPriority` is a rule condition, not a global gate. Until 2026-08-02
// it was a hard allowlist of 'automatic' and 'first' applied before any rule
// ran, which excluded every contribution the backend actually serves (they come
// back 'manual'), so every plan was empty and auto-match could not place
// anything at all. A project that wants the old behaviour writes it as a rule:
// `{ field: 'allocationPriority', op: 'in', value: ['automatic', 'first'] }`.
//
// The value is deliberately not validated against this list, so a priority TTC
// adds later works without a deploy. That is the mistake the allowlist made.
export const RULE_PRIORITY_VALUES = ['automatic', 'first', 'manual'] as const;

// Applied last, always, even when a project has no saved rules. Its uid is
// null, which is how the UI tells the catch-all from a real rule.
export const DEFAULT_RULE: PlannerRule = {
  uid: null,
  label: 'Everything else',
  definition: {
    when: { sweep: 'any' },
    prefer: { type: 'oldest' },
    orderBy: 'oldest',
    action: 'match',
  },
};

export interface PlannerRule {
  // null = the implicit catch-all.
  uid: string | null;
  label: string;
  definition: RuleDefinition;
  // Resolved from `definition.prefer.siteUid` before planning. Left undefined
  // when the rule does not prefer a site.
  preferSiteId?: number | null;
  // The preferred site is gone (soft-deleted or not in this project): the rule
  // matches nothing and its donations fall through to later rules.
  preferSiteMissing?: boolean;
}

/**
 * Which TTC list a rule's donations come from. `profileType` and `country`
 * exist only as query filters (items do not carry them), so each distinct
 * signature is one paged fetch. '' is the unfiltered list, shared by every
 * rule that does not need a filtered one.
 */
export function sweepSignatureOf(definition: RuleDefinition): string {
  switch (definition.when.sweep) {
    case 'company':
      return 'profileType=company';
    case 'individual':
      return 'profileType=individual';
    case 'country':
      return `country=${(definition.when.country || '').toUpperCase()}`;
    default:
      return '';
  }
}

/** Inverse of sweepSignatureOf, for building the TTC query. */
export function paramsForSignature(signature: string): {
  profileType?: 'individual' | 'company';
  country?: string;
} {
  if (!signature) return {};
  const [key, value] = signature.split('=');
  if (key === 'profileType') return { profileType: value as 'individual' | 'company' };
  if (key === 'country') return { country: value };
  return {};
}
