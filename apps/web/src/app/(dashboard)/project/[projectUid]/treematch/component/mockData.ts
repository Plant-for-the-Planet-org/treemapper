// Mock data for the TreeMatch dummy UI.
// This is a throwaway visualization only -- no backend, no real donations.
// It exists so the team (Maria, Shyam, Jorgo) can react to the layout and
// every option before we build the real feature.

export type InterventionType = 'single-tree-registration' | 'multi-tree-registration';

// Minimal GeoJSON geometry for the map view. Multi-tree locations are small
// polygons, single-tree locations are points.
export type MockGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'Polygon'; coordinates: [number, number][][] };

export interface MockIntervention {
  uid: string;
  hid: string;
  type: InterventionType;
  siteName: string;
  plantingDate: string; // ISO
  totalTrees: number; // planted trees are whole numbers
  matchedTrees: number; // already allocated (may be fractional once decimal donations are matched)
  /** where this plant location sits (fictional coordinates near the Yucatán restoration area) */
  location: MockGeometry;
  /** manually excluded from matching by the RO (e.g. already funded, or a free re-planting under a survival guarantee) */
  blocked?: boolean;
  /** belongs to a different project of the same RO (cross-project matching) */
  crossProjectName?: string;
  /** hidden intervention holding legacy pre-TreeMapper trees */
  legacy?: boolean;
  /** not matchable yet: still uploading from mobile, or capture not finished */
  notReady?: 'syncing' | 'incomplete';
}

export interface MockContribution {
  uid: string; // project contribution id -- the matchable unit (one donation can fund several projects/ROs)
  donationGuid: string; // parent donation (internal context, not exposed to ROs)
  donor: string;
  date: string; // payment date, ISO
  amount: number; // major units
  currency: string;
  units: number; // trees funded (may be fractional -- money converts to decimal tree units)
  allocated: number; // trees already matched (may be fractional)
  priority: 'manual' | 'automatic' | 'first' | 'never';
  country: string; // ISO-2 (payment country; kept in data, not shown)
  payout: string; // treecounter payout batch the RO received this money in (payouts are per entity)
  ignored?: boolean;
  ignoreReason?: string;
  /** never exposed publicly (legacy / donor request) */
  private?: boolean;
}

// A rule reads: WHEN <these donations> -> PREFER <these locations> -> ORDER BY <tiebreak>.
// Rules run top to bottom (array order = priority); each matches what it can and
// passes the rest to the next. A locked "everything else" default sits below them.
export type RuleWhen = 'all' | 'company' | 'individual' | 'country' | 'donor' | 'payout';
export type RulePrefer = 'oldest' | 'site' | 'capacity';
export type RuleOrder = 'oldest' | 'largest';

export interface MockRule {
  id: string;
  enabled: boolean;
  when: RuleWhen;
  whenValue?: string;   // country / contribution id / payout label
  prefer: RulePrefer;
  preferValue?: string; // site name when prefer === 'site'
  order: RuleOrder;
}


// Geometry helpers for the mock map. `quad` builds a slightly irregular
// polygon around a center (w/h in degrees; 0.005 ≈ 550 m). Fictional
// coordinates clustered per site so the map view reads naturally.
const quad = (lng: number, lat: number, w = 0.006, h = 0.005): MockGeometry => ({
  type: 'Polygon',
  coordinates: [[
    [lng - w, lat - h * 0.8],
    [lng + w * 0.9, lat - h],
    [lng + w, lat + h * 0.85],
    [lng - w * 0.8, lat + h],
    [lng - w, lat - h * 0.8],
  ]],
});
const pt = (lng: number, lat: number): MockGeometry => ({ type: 'Point', coordinates: [lng, lat] });

export const MOCK_INTERVENTIONS: MockIntervention[] = [
  { uid: 'ivn_a1', hid: 'AB1-2024', type: 'multi-tree-registration', siteName: 'North Ridge', plantingDate: '2024-07-12', totalTrees: 5200, matchedTrees: 1200, location: quad(-90.095, 18.455, 0.007, 0.005) },
  { uid: 'ivn_a2', hid: 'AB2-2024', type: 'multi-tree-registration', siteName: 'North Ridge', plantingDate: '2024-08-03', totalTrees: 4700, matchedTrees: 0, location: quad(-90.115, 18.447, 0.006, 0.005) },
  { uid: 'ivn_a3', hid: 'CD9-2024', type: 'single-tree-registration', siteName: 'Riverside', plantingDate: '2024-09-21', totalTrees: 1, matchedTrees: 0.2, location: pt(-90.168, 18.409) },
  { uid: 'ivn_a4', hid: 'CD8-2024', type: 'multi-tree-registration', siteName: 'Riverside', plantingDate: '2024-10-05', totalTrees: 8800, matchedTrees: 8800, location: quad(-90.179, 18.401, 0.008, 0.006) },
  { uid: 'ivn_a5', hid: 'EF3-2025', type: 'multi-tree-registration', siteName: 'South Basin', plantingDate: '2025-02-14', totalTrees: 3000, matchedTrees: 500, blocked: true, location: quad(-90.128, 18.334, 0.006, 0.005) },
  { uid: 'ivn_a6', hid: 'EF7-2025', type: 'multi-tree-registration', siteName: 'Volcano Valley', plantingDate: '2025-03-02', totalTrees: 6400, matchedTrees: 0, crossProjectName: 'Volcano Valley (id 227)', location: quad(-90.298, 18.502, 0.009, 0.007) },
  { uid: 'ivn_a7', hid: 'LEG-0001', type: 'multi-tree-registration', siteName: 'Legacy holding', plantingDate: '2019-11-01', totalTrees: 20000, matchedTrees: 14000, legacy: true, location: quad(-90.052, 18.381, 0.011, 0.008) },
  { uid: 'ivn_a8', hid: 'GH4-2025', type: 'single-tree-registration', siteName: 'South Basin', plantingDate: '2025-04-18', totalTrees: 1, matchedTrees: 0, location: pt(-90.117, 18.329) },
  // Not linked to any site (site is optional on an intervention).
  { uid: 'ivn_a11', hid: 'KL9-2025', type: 'multi-tree-registration', siteName: '', plantingDate: '2025-06-01', totalTrees: 900, matchedTrees: 0, location: quad(-90.222, 18.362, 0.004, 0.004) },
  // Not matchable yet: must be fully synced from the field + capture complete first.
  { uid: 'ivn_a9', hid: 'IJ2-2025', type: 'multi-tree-registration', siteName: 'North Ridge', plantingDate: '2025-05-09', totalTrees: 2000, matchedTrees: 0, notReady: 'syncing', location: quad(-90.104, 18.462, 0.005, 0.004) },
  { uid: 'ivn_a10', hid: 'IJ5-2025', type: 'multi-tree-registration', siteName: 'Riverside', plantingDate: '2025-05-20', totalTrees: 1500, matchedTrees: 0, notReady: 'incomplete', location: quad(-90.188, 18.394, 0.005, 0.004) },
];

const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const MOCK_CONTRIBUTIONS: MockContribution[] = [
  { uid: 'pc_1', donationGuid: 'don_9Qh2', donor: 'Acme GmbH', date: '2023-05-11', amount: 4700, currency: 'EUR', units: 4700, allocated: 0.2, priority: 'automatic', country: 'DE', payout: '2023 payout' },
  { uid: 'pc_2', donationGuid: 'don_7Rt8', donor: 'Lena Fischer', date: '2023-06-02', amount: 100, currency: 'EUR', units: 20.5, allocated: 5.2, priority: 'manual', country: 'DE', payout: '2023 payout' },
  { uid: 'pc_3', donationGuid: 'don_2Kb5', donor: 'Northwind Corp', date: '2024-01-19', amount: 100000, currency: 'USD', units: 100000, allocated: 62000, priority: 'first', country: 'US', payout: 'Feb 2024 payout' },
  { uid: 'pc_4', donationGuid: 'don_5Vd1', donor: 'Sofia Mariani', date: '2024-03-08', amount: 250, currency: 'CHF', units: 250, allocated: 0, priority: 'manual', country: 'CH', payout: 'Mar 2024 payout' },
  { uid: 'pc_5', donationGuid: 'don_1Aa0', donor: 'Old CRM import', date: '2018-09-14', amount: 5000, currency: 'EUR', units: 5000, allocated: 0, priority: 'never', country: 'MX', payout: 'Legacy', ignored: true, ignoreReason: 'Legacy promise, handled manually' },
  { uid: 'pc_6', donationGuid: 'don_8Cf3', donor: 'Verdant Fund', date: '2024-02-27', amount: 30000, currency: 'EUR', units: 30000, allocated: 0, priority: 'automatic', country: 'DE', payout: 'Feb 2024 payout' },
  { uid: 'pc_7', donationGuid: 'don_3Ng6', donor: 'Private donor', date: '2020-12-01', amount: 12000, currency: 'EUR', units: 12000, allocated: 12000, priority: 'manual', country: 'ES', payout: 'Legacy', private: true },
  { uid: 'pc_8', donationGuid: 'don_6Wp4', donor: 'Green Roots e.V.', date: '2024-04-30', amount: 800, currency: 'EUR', units: 800, allocated: 0, priority: 'automatic', country: 'DE', payout: 'May 2024 payout' },
  // Recent paid donations (newer than 90 days).
  { uid: 'pc_11', donationGuid: 'don_N0w1', donor: 'Recent donor A', date: daysAgoISO(12), amount: 500, currency: 'EUR', units: 500, allocated: 0, priority: 'automatic', country: 'DE', payout: 'Jun 2024 payout' },
  { uid: 'pc_12', donationGuid: 'don_N0w2', donor: 'Recent donor B', date: daysAgoISO(58), amount: 1200, currency: 'EUR', units: 1200, allocated: 0, priority: 'manual', country: 'CH', payout: 'May 2024 payout' },
];

export const MOCK_RULES: MockRule[] = [
  { id: 'r1', enabled: true, when: 'company', prefer: 'site', preferValue: 'North Ridge', order: 'largest' },
  { id: 'r2', enabled: true, when: 'country', whenValue: 'DE', prefer: 'site', preferValue: 'South Basin', order: 'oldest' },
  { id: 'r3', enabled: false, when: 'payout', whenValue: 'Feb 2024 payout', prefer: 'oldest', order: 'oldest' },
];

// A slice of the match ledger for the overview page: which donations are matched
// to which plant location. In the real build this is a read of treematch_match.
export interface MockMatchedDonation {
  interventionUid: string;
  interventionHid: string;
  donor: string;
  contributionUid: string;
  trees: number;
}

export const MOCK_MATCHED_DONATIONS: MockMatchedDonation[] = [
  { interventionUid: 'ivn_a1', interventionHid: 'AB1-2024', donor: 'Acme GmbH', contributionUid: 'pc_1', trees: 1200 },
  { interventionUid: 'ivn_a4', interventionHid: 'CD8-2024', donor: 'Northwind Corp', contributionUid: 'pc_3', trees: 8800 },
  { interventionUid: 'ivn_a5', interventionHid: 'EF3-2025', donor: 'Lena Fischer', contributionUid: 'pc_2', trees: 500 },
  { interventionUid: 'ivn_a7', interventionHid: 'LEG-0001', donor: 'Private donor', contributionUid: 'pc_7', trees: 12000 },
];

// Dummy: which donors support a given intervention, keyed by its HID. Real
// interventions on the map have their own HIDs (not the fake ones above), so we
// derive a stable pseudo-link from the HID for the prototype -- roughly a third
// of interventions get no donors, the rest get one or two. The real build reads
// the match ledger by intervention. Throwaway.
const SUPPORT_POOL: Omit<MockMatchedDonation, 'interventionUid' | 'interventionHid'>[] = [
  { donor: 'Acme GmbH', contributionUid: 'pc_1', trees: 1200 },
  { donor: 'Northwind Corp', contributionUid: 'pc_3', trees: 900 },
  { donor: 'Verdant Fund', contributionUid: 'pc_6', trees: 3000 },
  { donor: 'Lena Fischer', contributionUid: 'pc_2', trees: 500 },
  { donor: 'Private donor', contributionUid: 'pc_7', trees: 250 },
  { donor: 'Green Roots e.V.', contributionUid: 'pc_8', trees: 800 },
];

const hashHid = (hid: string) => {
  let h = 0;
  for (let i = 0; i < hid.length; i++) h = (h * 31 + hid.charCodeAt(i)) >>> 0;
  return h;
};

export function mockSupportingDonors(hid: string): MockMatchedDonation[] {
  // Honor any explicit ledger link first (the fake HIDs above).
  const explicit = MOCK_MATCHED_DONATIONS.filter(m => m.interventionHid === hid);
  if (explicit.length) return explicit;
  if (!hid) return [];
  const h = hashHid(hid);
  if (h % 3 === 0) return []; // ~1/3 have no supporting donors
  const count = (h % 2) + 1; // 1 or 2 donors
  return Array.from({ length: count }, (_, k) => {
    const p = SUPPORT_POOL[(h + k) % SUPPORT_POOL.length];
    return { interventionUid: hid, interventionHid: hid, ...p };
  });
}

// A payout is a batch of money paid out to the RO. Matching only happens once the
// payout is actually 'paid' to the RO -- you can't match money you have not received.
export type PayoutStatus = 'paid' | 'pending';
export interface MockPayout { label: string; status: PayoutStatus; }

export const MOCK_PAYOUTS: MockPayout[] = [
  { label: '2023 payout', status: 'paid' },
  { label: 'Feb 2024 payout', status: 'paid' },
  { label: 'Mar 2024 payout', status: 'paid' },
  { label: 'May 2024 payout', status: 'pending' }, // not yet paid out to the RO
  { label: 'Jun 2024 payout', status: 'pending' },
  { label: 'Legacy', status: 'paid' },
];

export const payoutStatusOf = (label: string): PayoutStatus =>
  MOCK_PAYOUTS.find(p => p.label === label)?.status ?? 'paid';
export const isPayoutPaid = (label: string) => payoutStatusOf(label) === 'paid';

export const COUNTRIES = ['All', 'DE', 'US', 'CH', 'ES', 'MX'];

export const fmtAmount = (a: number, c: string) =>
  new Intl.NumberFormat('en', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(a);

// Trees can be fractional on the donation side (money converts to decimal tree
// units). Match treecounter-platform: round to 2 decimals, and show decimals
// only when the value actually has a fractional part. Whole numbers render with
// no decimals (20, not 20.00); fractional values show exactly 2 digits (20.50).
// The rounding also clears float artifacts (e.g. 29.4999999 -> 29.5).
export const fmtNum = (n: number) => {
  const r = Math.round((n + Number.EPSILON) * 100) / 100;
  return new Intl.NumberFormat('en', {
    minimumFractionDigits: Number.isInteger(r) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(r);
};

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });

// ROs do not see full donor identity in donation history. Only donors who published
// their profile show a name/alias; everyone else is anonymised. The donation
// reference stays the stable, always-available identifier.
const PUBLIC_DONORS = new Set(['Acme GmbH', 'Northwind Corp', 'Verdant Fund', 'Green Roots e.V.']);
export const donorLabel = (donor: string) => (PUBLIC_DONORS.has(donor) ? donor : 'Anonymous');
