// Types for the TreeMatch screens, mirroring the server responses:
//  - Plant locations: GET /treematch/projects/{uid}/interventions
//    (a TreeMatch-scoped read of the `intervention` table)
//  - Donations: GET /treematch/projects/{uid}/contributions
//    (proxied TTC contributions; the server converts centi-units to whole
//    trees, so every unit number here is trees)

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
  isPrivate: boolean;
  location: TreeMatchGeometry | null;
  area?: number | null;

  /** trees already allocated to a donation, read from the server's match
   * ledger; local matches bump it optimistically until the next fetch. */
  matchedTrees: number;

  // --- Future ledger fields, never set by the current API ---
  /** manually excluded from matching by the RO */
  blocked?: boolean;
  /** belongs to a different project of the same RO (cross-project matching) */
  crossProjectName?: string;
  /** hidden intervention holding legacy pre-TreeMapper trees */
  legacy?: boolean;
}

export const availableTrees = (i: TreeMatchIntervention) =>
  Math.max(0, i.totalTreeCount - i.matchedTrees);

// ---------------------------------------------------------------------------
// Donations (project contributions)
// ---------------------------------------------------------------------------

// What a unit of a contribution buys. Everything in TreeMatch today is 'tree';
// 'm2' exists for conservation projects sold by area.
export type UnitType = 'tree' | 'm2' | string;

export type AllocationPriority = 'manual' | 'automatic' | 'first' | 'never';

/** Whether the contribution may be shown on the public project page. */
export type ContributionStatus = 'public' | 'private';

/** The parent donation. One donation can fund several projects/ROs. */
export interface Donation {
  guid: string;
  /** the donation reference -- the stable, always-visible identifier for an RO */
  uid: string;
  paymentDate: string; // ISO
  amount: number; // major units
  currency: string;
}

// Donor identity is deliberately absent and is never coming: ROs do not get to
// see who donated. A contribution is identified by its donation reference
// (donation.uid) everywhere in the UI.
//
// `status` and `ignore` are planned TTC response fields; until the endpoint
// returns them, the server proxy injects sample values so these UI paths stay
// alive.
export interface Contribution {
  id: number;
  /** whole trees (converted from TTC centi-units server-side) */
  units: number;
  unitsAllocated: number;
  /** server-computed units - unitsAllocated */
  available: number;
  unitType: UnitType;
  currency: string | null;
  allocationPriority: AllocationPriority;
  status: ContributionStatus;
  /** excluded from matching by the RO */
  ignore: boolean;
  /** why it was ignored; local-only until the API carries it */
  ignoreReason?: string;
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
// Envelopes
// ---------------------------------------------------------------------------

export interface TreeMatchPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InterventionListData {
  items: TreeMatchIntervention[];
  pagination: TreeMatchPagination;
  /** locations still syncing from the field or capture-incomplete */
  notReadyCount: number;
  stats: {
    /** project-wide planted total (independent of filters) */
    plantedTrees: number;
    /** project-wide matched total; 0 until the match ledger exists */
    matchedTrees: number;
  };
}

export interface ContributionListData {
  items: Contribution[];
  pagination: TreeMatchPagination;
}

// ---------------------------------------------------------------------------
// Auto-match rules (GET/PUT /treematch/projects/{uid}/rules)
// ---------------------------------------------------------------------------

// A rule reads: WHEN <these donations> -> PREFER <these locations> -> ORDER BY
// <tiebreak>. Rules run top to bottom (array order = priority); each matches
// what it can and passes the rest down. A locked "everything else" default
// always applies last (server-side too).
//
// 'company' and 'individual' map to the contributions endpoint's `profileType`
// filter (company is aliased 'organization' there). Plant organisations are
// excluded from that endpoint entirely, so those two values are an exhaustive,
// mutually exclusive split of everything TreeMatch can ever see.
export type RuleWhenType = 'all' | 'company' | 'individual' | 'country' | 'donor';
export type RulePreferType = 'oldest' | 'site' | 'capacity';
export type RuleOrderBy = 'oldest' | 'largest';

/** A rule as edited in the dialog. */
export interface TreeMatchRule {
  /** server uid; absent on new unsaved rows (uids change on every save) */
  uid?: string;
  /** client-only stable React key */
  localId: string;
  enabled: boolean;
  whenType: RuleWhenType;
  /** ISO-2 country for 'country', donation ref for 'donor' */
  whenValue?: string;
  preferType: RulePreferType;
  preferSiteUid?: string;
  preferSiteName?: string;
  orderBy: RuleOrderBy;
}

/** A rule as the server returns it. */
export interface TreeMatchRuleItem {
  uid: string;
  position: number;
  enabled: boolean;
  whenType: RuleWhenType;
  whenValue?: string;
  preferType: RulePreferType;
  preferSite?: { uid: string; name: string };
  orderBy: RuleOrderBy;
}

export const ruleFromItem = (item: TreeMatchRuleItem): TreeMatchRule => ({
  uid: item.uid,
  localId: item.uid,
  enabled: item.enabled,
  whenType: item.whenType,
  whenValue: item.whenValue,
  preferType: item.preferType,
  preferSiteUid: item.preferSite?.uid,
  preferSiteName: item.preferSite?.name,
  orderBy: item.orderBy,
});

/** The PUT body shape; also the basis for dirty comparison. */
export const ruleToPayload = (rule: TreeMatchRule) => ({
  enabled: rule.enabled,
  whenType: rule.whenType,
  ...(rule.whenValue ? { whenValue: rule.whenValue } : {}),
  preferType: rule.preferType,
  ...(rule.preferSiteUid ? { preferSiteUid: rule.preferSiteUid } : {}),
  orderBy: rule.orderBy,
});

// Result of POST /treematch/projects/{uid}/automatch (whole trees).
export interface AutomatchRuleResult {
  /** null = the implicit default catch-all */
  ruleUid: string | null;
  label: string;
  matchedTrees: number;
  contributionsUsed: number;
  /** the rule prefers a site that no longer exists */
  siteMissing?: boolean;
}

export interface AutomatchResult {
  runUid: string;
  matchedTrees: number;
  contributionsMatched: number;
  locationsFilled: number;
  perRule: AutomatchRuleResult[];
  /** not every donation was scanned (pagination cap); a re-run matches more */
  truncated?: boolean;
}

// The contributions endpoint filters by ISO-2 payment country but does not
// return the country per item, so the choices are a fixed list. Shared by the
// donations filter and the rules editor.
export const COUNTRY_OPTIONS = [
  'DE', 'AT', 'CH', 'US', 'GB', 'FR', 'NL', 'BE', 'ES', 'IT',
  'SE', 'NO', 'DK', 'CA', 'AU', 'MX', 'IN',
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export const fmtAmount = (a: number, c: string) =>
  new Intl.NumberFormat('en', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(a);

export const fmtNum = (n: number) => new Intl.NumberFormat('en').format(n);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
