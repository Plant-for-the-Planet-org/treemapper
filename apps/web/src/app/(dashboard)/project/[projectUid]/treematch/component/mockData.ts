// Mock data for the parts of TreeMatch that have no backend yet.
//
// The live lists, the auto-match rules, and the ignore flag are all real now
// (see types.ts for the shapes). What remains here feeds the one still-dummy
// feature: the overview map's "supporting donors" popover, which needs a
// per-intervention read of the match ledger that has no endpoint yet.
// Drop this file when that lands.

// ---------------------------------------------------------------------------
// Overview map: supporting donors (dummy: no per-intervention ledger read yet)
// ---------------------------------------------------------------------------

// A slice of the match ledger: which donations are matched to which plant
// location. In the real build this is a read of treematch_match.
export interface MockMatchedDonation {
  interventionUid: string;
  interventionHid: string;
  /** the donation reference (donation.uid) -- there is no donor name to show */
  donationRef: string;
  contributionId: number;
  trees: number;
}

// Dummy: which donors support a given intervention, keyed by its HID. Real
// interventions on the map have their own HIDs, so we derive a stable
// pseudo-link from the HID for the prototype -- roughly a third of
// interventions get no donors, the rest get one or two. The real build reads
// the match ledger by intervention. Throwaway.
const SUPPORT_POOL: Omit<MockMatchedDonation, 'interventionUid' | 'interventionHid'>[] = [
  { donationRef: 'PL-9F3K2', contributionId: 12345, trees: 1200 },
  { donationRef: 'PL-7X2Q9', contributionId: 12347, trees: 900 },
  { donationRef: 'PL-5N3R8', contributionId: 12350, trees: 3000 },
  { donationRef: 'PL-4M8T1', contributionId: 12346, trees: 500 },
  { donationRef: 'PL-8K1W5', contributionId: 12351, trees: 250 },
  { donationRef: 'PL-3J7Y2', contributionId: 12352, trees: 800 },
];

const hashHid = (hid: string) => {
  let h = 0;
  for (let i = 0; i < hid.length; i++) h = (h * 31 + hid.charCodeAt(i)) >>> 0;
  return h;
};

export function mockSupportingDonors(hid: string): MockMatchedDonation[] {
  if (!hid) return [];
  const h = hashHid(hid);
  if (h % 3 === 0) return []; // ~1/3 have no supporting donors
  const count = (h % 2) + 1; // 1 or 2 donors
  return Array.from({ length: count }, (_, k) => {
    const p = SUPPORT_POOL[(h + k) % SUPPORT_POOL.length];
    return { interventionUid: hid, interventionHid: hid, ...p };
  });
}
