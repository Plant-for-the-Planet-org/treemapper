// Types for the TreeMatch screens, mirroring the server responses:
//  - Plant locations: GET /treematch/projects/{uid}/interventions
//    (a TreeMatch-scoped read of the `intervention` table)
//  - Donations: GET /treematch/projects/{uid}/contributions
//    (proxied TTC contributions; the server converts centi-units to whole
//    trees, so every unit number here is trees)
//  - Recording a match: POST /treematch/projects/{uid}/matches
//
// Ownership matters for reading these: TTC owns contributions, their allocated
// totals and the ignore flag, and TreeMapper stores none of it. TreeMapper owns
// trees and interventions, plus one table saying how many of its own trees are
// claimed by which contribution.

// ---------------------------------------------------------------------------
// Plant locations (intervention)
// ---------------------------------------------------------------------------

// Subset of intervention_type that TreeMatch cares about: only registrations
// carry a tree count worth matching. The server enforces the same set.
export type InterventionType =
  | 'single-tree-registration'
  | 'multi-tree-registration'
  | 'generic-tree-registration'
  | 'enrichment-planting'
  | 'direct-seeding';

export type InterventionStatus =
  | 'planned' | 'planning' | 'active' | 'completed' | 'failed' | 'on-hold' | 'cancelled';

// A location is only matchable once its capture is 'complete'. The server
// already filters to complete; the type keeps the union for safety.
export type CaptureStatus = 'complete' | 'partial' | 'incomplete';

// GeoJSON geometry as stored on the intervention (PostGIS). Points for
// single-tree locations, (Multi)Polygons for areas. Can be null.
export interface TreeMatchGeometry {
  type: string;
  coordinates: any;
}

export interface TreeMatchIntervention {
  uid: string;
  hid: string;
  type: InterventionType | string;
  status: InterventionStatus | string | null;
  /** joined from site.name -- intervention.siteId is nullable, so this can be empty */
  siteName: string;
  /** intervention.interventionStartDate -- the planting date shown in the UI */
  interventionStartDate: string; // ISO
  totalTreeCount: number;
  captureStatus: CaptureStatus | string;
  /** part of the response, deliberately not surfaced: matching does not care
   * whether a location is publicly visible */
  isPrivate: boolean;
  location: TreeMatchGeometry | null;
  area?: number | null;

  /** trees already claimed by a donation, summed from treematch_allocation;
   * local matches bump it optimistically until the next fetch */
  matchedTrees: number;

  /** set by the client, not the API: the location belongs to another project of
   * the same owner (matching across projects is allowed) */
  crossProjectName?: string;
}

export const availableTrees = (i: TreeMatchIntervention) =>
  Math.max(0, i.totalTreeCount - i.matchedTrees);

// ---------------------------------------------------------------------------
// Donations (project contributions)
// ---------------------------------------------------------------------------

// What a unit of a contribution buys. Everything in TreeMatch today is 'tree';
// 'm2' exists for conservation projects sold by area.
export type UnitType = 'tree' | 'm2' | string;

// TTC's own ordering hint. Never shown on a donation card; it surfaces only as
// an auto-match rule condition, where a project can hold one kind back.
export type AllocationPriority = 'manual' | 'automatic' | 'first';

/** The parent donation. One donation can fund several projects/ROs. */
export interface Donation {
  guid: string;
  /** the donation reference -- the stable, always-visible identifier for an RO */
  uid: string;
  paymentDate: string; // ISO
  /** minor units (100 = one euro/dollar/peso), the same hundredths scale TTC
   * uses for `units`. Render it through `toMajorAmount`, never raw. */
  amount: number;
  currency: string;
}

// Donor identity is deliberately absent and is never coming: ROs do not get to
// see who donated. A contribution is identified by its donation reference
// (donation.uid) everywhere in the UI.
export interface Contribution {
  id: number;
  /** whole trees (converted from TTC centi-units server-side); can be
   * fractional, since TTC allows partial units */
  units: number;
  unitsAllocated: number;
  /** server-computed units - unitsAllocated */
  available: number;
  unitType: UnitType;
  currency: string | null;
  allocationPriority: AllocationPriority;
  /** excluded from matching. Owned by TTC, so it arrives with every read and
   * is changed through the ignore endpoint, never locally */
  ignored: boolean;
  ignoreReason?: string | null;
  donation: Donation;
}

export const contribAvailable = (c: Contribution) =>
  Math.max(0, c.units - c.unitsAllocated);

/** Units are trees today; conservation projects sell area instead. */
export const unitLabel = (c: Contribution) => (c.unitType === 'tree' ? 'trees' : 'm²');

// How much of a donation still needs trees: none matched, some matched, or all matched.
export type ContribMatchState = 'none' | 'partial' | 'complete';

export const contribMatchState = (c: Contribution): ContribMatchState => {
  if (c.unitsAllocated <= 0) return 'none';
  if (c.unitsAllocated >= c.units) return 'complete';
  return 'partial';
};

// ---------------------------------------------------------------------------
// Partial matching
// ---------------------------------------------------------------------------

/** How many trees each donation should claim in the next match, keyed by
 * contribution id. Held as the raw input string, not a number, so the field can
 * sit empty while the user retypes it. A donation with no entry claims
 * everything still open, which is what selecting a card has always meant. */
export type MatchAmounts = Record<number, string>;

/** Trees a donation will claim in the next match: the typed partial if there is
 * one, otherwise its full open amount.
 *
 * Typed partials are whole trees only. Open amounts are not, since TTC works in
 * hundredths, so leaving the field untouched is the only way to close out a
 * donation with a fractional remainder -- which is exactly what the card's
 * "Max" button restores. */
export const requestedTrees = (c: Contribution, amounts: MatchAmounts): number => {
  const open = contribAvailable(c);
  const raw = amounts[c.id];
  if (raw === undefined) return open;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, Math.floor(open));
};

// ---------------------------------------------------------------------------
// Envelopes
// ---------------------------------------------------------------------------

export interface TreeMatchPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Rows per page in both panes. The donations side is the constraint: every
 * page is a serialized ~700ms TTC round trip. */
export const PAGE_SIZE = 20;

export const EMPTY_PAGINATION: TreeMatchPagination = {
  total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0,
};

/** A project site, as the sites endpoint returns it. `id` is what the location
 * filter sends; `uid` is what an auto-match rule stores. */
export interface Site { id: number | string; uid: string; name: string; }

export interface InterventionListData {
  items: TreeMatchIntervention[];
  pagination: TreeMatchPagination;
  /** locations still syncing from the field or capture-incomplete */
  notReadyCount: number;
  stats: {
    /** project-wide planted total (independent of filters) */
    plantedTrees: number;
    /** project-wide claimed total (independent of filters) */
    matchedTrees: number;
  };
}

export interface ContributionListData {
  items: Contribution[];
  pagination: TreeMatchPagination;
}

// ---------------------------------------------------------------------------
// Recording a match
// ---------------------------------------------------------------------------

/** One (donation, plant location) pair, in whole trees. The request carries
 * nothing else: the server derives each contribution's absolute total itself. */
export interface MatchPair {
  contributionId: number;
  interventionUid: string;
  trees: number;
}

/** The server caps one request at this many pairs. */
// Mirrors MAX_MATCH_PAIRS on the server: one match request is one transaction
// and one donation-backend write, so this is what keeps a match all-or-nothing.
export const MAX_MATCH_PAIRS = 2000;

/** Mirrors the server's MaxLength on the ignore reason. The field is capped in
 * the dialog so a long note is trimmed while it is being typed, rather than
 * coming back as a validation error after the round trip. */
export const IGNORE_REASON_MAX = 500;

/** TTC's accepted absolute totals, in whole trees, keyed by contribution id. */
export interface CreateMatchesResponse {
  applied: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Auto-match rules
//
// A rule reads: WHEN <these donations> -> PREFER <these locations> -> ORDER BY
// <this donation order>. Rules run top to bottom, each takes what it can and
// passes the remainder down, and a locked catch-all always runs last.
// ---------------------------------------------------------------------------

/** Which TTC list a rule's donations come from. `profileType` and `country` are
 * not returned per donation, so anything other than 'any' costs the server its
 * own paged sweep of the donation backend. Keep the count low. */
export type RuleSweep = 'any' | 'company' | 'individual' | 'country';

export type RulePreferType = 'oldest' | 'newest' | 'site' | 'capacityHigh' | 'capacityLow';
export type RuleOrderBy = 'oldest' | 'newest' | 'largest' | 'smallest';

/** 'skip' is the exclusion rule: it holds its donations back from every later
 * rule and places nothing. */
export type RuleAction = 'match' | 'skip';

export type RuleFilterField =
  | 'openTrees' | 'totalTrees' | 'matchState' | 'unitType'
  | 'currency' | 'paymentDate' | 'olderThanDays' | 'donationRef'
  | 'allocationPriority';

export type RuleFilterOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';

export interface RuleFilter {
  field: RuleFilterField;
  op: RuleFilterOp;
  value: string | number | Array<string | number>;
}

/** A rule as the API returns it. The server accepts up to 10 filters; the
 * editor writes at most one, so a deeper editor needs no API change. */
export interface TreeMatchRule {
  /** changes on every save: the server replaces the whole list */
  uid: string;
  position: number;
  enabled: boolean;
  label: string;
  when: { sweep: RuleSweep; country?: string; filters?: RuleFilter[] };
  prefer: {
    type: RulePreferType;
    siteUid?: string;
    /** resolved by the server; empty string means the site is gone */
    siteName?: string;
  };
  orderBy: RuleOrderBy;
  action: RuleAction;
}

/** A rule while it is being edited. Unsaved rows have no uid yet, so the list
 * is keyed by a client-only id instead. */
export interface DraftRule extends Omit<TreeMatchRule, 'uid' | 'position'> {
  localId: string;
  uid?: string;
}

/** The server takes at most this many rules. */
export const MAX_RULES = 50;

// ---------------------------------------------------------------------------
// Auto-match runs
//
// A run plans and stops. Nothing is written until the plan is applied, which
// goes through the same match path as a manual match.
// ---------------------------------------------------------------------------

export type AutomatchRunStatus =
  | 'planning' | 'planned' | 'applying' | 'completed' | 'failed' | 'discarded';

export interface AutomatchPlanPair {
  contributionId: number;
  interventionUid: string;
  trees: number;
  /** resolved server-side: a sweep reaches donations this client never loaded */
  donationRef: string | null;
  interventionHid: string;
}

export interface AutomatchPlanRule {
  /** null is the locked catch-all */
  ruleUid: string | null;
  label: string;
  matchedTrees: number;
  contributionsUsed: number;
  /** the rule prefers a site that no longer exists, so it matched nothing */
  siteMissing?: boolean;
  /** donations an exclusion rule held back */
  skipped?: number;
}

/** An empty plan has several very different causes and they need different
 * answers from the user, so the server names which one it was. */
export type AutomatchEmptyReason =
  | 'noLocations'
  | 'noFreeTrees'
  | 'noDonations'
  | 'allIgnored'
  | 'allAllocated'
  | 'filteredOut'
  | 'noRoom';

export interface AutomatchPlanEmpty {
  reason: AutomatchEmptyReason;
  donationsSeen: number;
  ignoredDonations: number;
  openDonations: number;
  /** open, not ignored, and a priority auto-match may consume */
  usableDonations: number;
  priorityCounts: Record<string, number>;
  freeTrees: number;
  locations: number;
  locationsWithRoom: number;
}

export interface AutomatchPlan {
  pairs: AutomatchPlanPair[];
  perRule: AutomatchPlanRule[];
  /** how far the donation sweep reached. Ordering inside a rule is true over
   * this window, not over the whole project. */
  scan: { pagesRead: number; donationsSeen: number; truncated: boolean };
  /** the plan hit the pair or tree cap and was cut short */
  capped: boolean;
  /** present only when the plan placed nothing */
  empty?: AutomatchPlanEmpty;
}

/** Live sweep state, rewritten server-side after every donation page. Only
 * meaningful while the run is 'planning'. */
export interface AutomatchProgress {
  lists: Array<{
    /** '' is the unfiltered list, otherwise the rule's sweep signature */
    signature: string;
    page: number;
    maxPages: number;
    done: boolean;
  }>;
  donationsRead: number;
  /** open, not ignored, and a priority auto-match may consume */
  usableDonations: number;
  stopped?: boolean;
}

export interface AutomatchRun {
  uid: string;
  status: AutomatchRunStatus;
  plan?: AutomatchPlan | null;
  progress?: AutomatchProgress | null;
  stopRequested?: boolean;
  matchedTrees: number;
  contributionsMatched: number;
  locationsFilled: number;
  error?: string | null;
  startedAt: string;
  plannedAt?: string | null;
  finishedAt?: string | null;
  expiresAt?: string | null;
}

// The contributions endpoint filters by ISO-2 payment country but does not
// return the country per item, so the choices are a fixed list.
export const COUNTRY_OPTIONS = [
  'DE', 'AT', 'CH', 'US', 'GB', 'FR', 'NL', 'BE', 'ES', 'IT',
  'SE', 'NO', 'DK', 'CA', 'AU', 'MX', 'IN',
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** TTC sends the paid amount in minor units, so 1401300 is 14,013.00. Every
 * currency seen on this endpoint (EUR, USD, GBP, CHF, MXN, PLN, CZK, RUB, AED)
 * is a two-decimal one; a zero-decimal currency such as JPY would need TTC's
 * scale confirmed before this divisor can be trusted for it. */
export const toMajorAmount = (minorUnits: number) => minorUnits / 100;

/** Money. Like fmtTrees, decimals only when there are any. */
export const fmtAmount = (a: number, c: string) => {
  const digits = Number.isInteger(a) ? 0 : 2;
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: c,
    // Currency style defaults minimumFractionDigits to 2, which would be
    // greater than the maximum below and throw a RangeError.
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(a);
};

/** Counts (totals, pages, list lengths). Always whole. */
export const fmtNum = (n: number) => new Intl.NumberFormat('en').format(n);

/** Tree and unit quantities. TTC works in hundredths of a unit, so these can be
 * fractional; decimals are shown only when there are any. */
export const fmtTrees = (n: number) =>
  new Intl.NumberFormat('en', {
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
