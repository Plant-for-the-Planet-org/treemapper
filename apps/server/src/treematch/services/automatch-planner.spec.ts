import {
  DEFAULT_RULE,
  PlannerContribution,
  PlannerIntervention,
  PlannerRule,
  filterSignatureOf,
  paramsForSignature,
  planAutomatch,
} from './automatch-planner';

// Builders keep the tables readable: units are centi-units (100 = 1 tree).

const iv = (
  id: number,
  overrides: Partial<PlannerIntervention> = {},
): PlannerIntervention => ({
  id,
  uid: `inv_${id}`,
  siteId: null,
  interventionStartDate: new Date(2024, 0, id),
  availableCenti: 1000,
  ...overrides,
});

const contrib = (
  ttcId: number,
  overrides: Partial<PlannerContribution> = {},
): PlannerContribution => ({
  ttcId,
  paymentDate: new Date(2024, 0, ttcId),
  allocationPriority: 'automatic',
  availableCenti: 500,
  donationRef: `PL-${ttcId}`,
  ignored: false,
  ...overrides,
});

const rule = (overrides: Partial<PlannerRule> = {}): PlannerRule => ({
  uid: 'tmr_test',
  label: 'test rule',
  whenType: 'all',
  whenValue: null,
  preferType: 'oldest',
  preferSiteId: null,
  orderBy: 'oldest',
  ...overrides,
});

const bySignature = (ids: number[], extra: Record<string, number[]> = {}) =>
  new Map<string, number[]>([['', ids], ...Object.entries(extra)]);

const byId = (contributions: PlannerContribution[]) =>
  new Map(contributions.map((c) => [c.ttcId, c]));

describe('filterSignatureOf / paramsForSignature', () => {
  it('maps rule types to TTC filter signatures and back', () => {
    expect(filterSignatureOf({ whenType: 'all', whenValue: null })).toBe('');
    expect(filterSignatureOf({ whenType: 'donor', whenValue: 'PL-1' })).toBe('');
    expect(filterSignatureOf({ whenType: 'company', whenValue: null })).toBe('profileType=company');
    expect(filterSignatureOf({ whenType: 'individual', whenValue: null })).toBe('profileType=individual');
    expect(filterSignatureOf({ whenType: 'country', whenValue: 'de' })).toBe('country=DE');

    expect(paramsForSignature('')).toEqual({});
    expect(paramsForSignature('profileType=company')).toEqual({ profileType: 'company' });
    expect(paramsForSignature('country=DE')).toEqual({ country: 'DE' });
  });
});

describe('planAutomatch', () => {
  it('applies the default catch-all with zero rules: oldest donations into oldest locations', () => {
    const interventions = [iv(2, { availableCenti: 300 }), iv(1, { availableCenti: 200 })];
    const contributions = [
      contrib(20, { paymentDate: new Date(2024, 5, 1), availableCenti: 400 }),
      contrib(10, { paymentDate: new Date(2024, 1, 1), availableCenti: 200 }),
    ];

    const plan = planAutomatch([], interventions, bySignature([20, 10]), byId(contributions));

    // Oldest donation (10) fills the oldest location (1) first.
    expect(plan.pairs).toEqual([
      { ttcContributionId: 10, interventionUid: 'inv_1', deltaCenti: 200, ruleUid: null },
      { ttcContributionId: 20, interventionUid: 'inv_2', deltaCenti: 300, ruleUid: null },
    ]);
    expect(plan.totals).toEqual({ matchedCenti: 500, contributionsMatched: 2, interventionsFilled: 2 });
    expect(plan.perRule).toHaveLength(1);
    expect(plan.perRule[0]).toMatchObject({ ruleUid: null, matchedCenti: 500, contributionsUsed: 2 });
  });

  it('splits one donation across locations until it is spent', () => {
    const interventions = [iv(1, { availableCenti: 100 }), iv(2, { availableCenti: 100 }), iv(3, { availableCenti: 100 })];
    const contributions = [contrib(1, { availableCenti: 250 })];

    const plan = planAutomatch([], interventions, bySignature([1]), byId(contributions));

    expect(plan.pairs.map((p) => [p.interventionUid, p.deltaCenti])).toEqual([
      ['inv_1', 100],
      ['inv_2', 100],
      ['inv_3', 50],
    ]);
    expect(plan.totals.matchedCenti).toBe(250);
  });

  it('runs rules in order and passes remainders down to later rules', () => {
    const interventions = [
      iv(1, { siteId: 7, availableCenti: 100 }),
      iv(2, { siteId: null, availableCenti: 1000 }),
    ];
    const contributions = [contrib(1, { availableCenti: 300 })];
    const siteRule = rule({ uid: 'tmr_site', preferType: 'site', preferSiteId: 7 });

    const plan = planAutomatch([siteRule], interventions, bySignature([1]), byId(contributions));

    // Site rule takes what fits into site 7; the default takes the remainder.
    expect(plan.pairs).toEqual([
      { ttcContributionId: 1, interventionUid: 'inv_1', deltaCenti: 100, ruleUid: 'tmr_site' },
      { ttcContributionId: 1, interventionUid: 'inv_2', deltaCenti: 200, ruleUid: null },
    ]);
    expect(plan.perRule[0]).toMatchObject({ ruleUid: 'tmr_site', matchedCenti: 100 });
    expect(plan.perRule[1]).toMatchObject({ ruleUid: null, matchedCenti: 200 });
  });

  it("consumes 'first' priority donations before 'automatic' ones", () => {
    const interventions = [iv(1, { availableCenti: 100 })];
    const contributions = [
      contrib(1, { paymentDate: new Date(2024, 0, 1), allocationPriority: 'automatic', availableCenti: 100 }),
      contrib(2, { paymentDate: new Date(2024, 6, 1), allocationPriority: 'first', availableCenti: 100 }),
    ];

    const plan = planAutomatch([], interventions, bySignature([1, 2]), byId(contributions));

    // Donation 2 is newer but has priority 'first', so it wins the capacity.
    expect(plan.pairs).toEqual([
      { ttcContributionId: 2, interventionUid: 'inv_1', deltaCenti: 100, ruleUid: null },
    ]);
  });

  it("skips 'manual', 'never', unknown priorities, and ignored donations", () => {
    const interventions = [iv(1)];
    const contributions = [
      contrib(1, { allocationPriority: 'manual' }),
      contrib(2, { allocationPriority: 'never' }),
      contrib(3, { allocationPriority: 'someday' }),
      contrib(4, { allocationPriority: null }),
      contrib(5, { ignored: true }),
    ];

    const plan = planAutomatch([], interventions, bySignature([1, 2, 3, 4, 5]), byId(contributions));

    expect(plan.pairs).toEqual([]);
    expect(plan.totals.matchedCenti).toBe(0);
  });

  it('orders donations largest-first when the rule says so', () => {
    const interventions = [iv(1, { availableCenti: 100 })];
    const contributions = [
      contrib(1, { paymentDate: new Date(2024, 0, 1), availableCenti: 50 }),
      contrib(2, { paymentDate: new Date(2024, 5, 1), availableCenti: 500 }),
    ];
    const largest = rule({ uid: 'tmr_largest', orderBy: 'largest' });

    const plan = planAutomatch([largest], interventions, bySignature([1, 2]), byId(contributions));

    expect(plan.pairs[0]).toMatchObject({ ttcContributionId: 2, deltaCenti: 100, ruleUid: 'tmr_largest' });
  });

  it('prefers locations with most capacity when the rule says so', () => {
    const interventions = [
      iv(1, { interventionStartDate: new Date(2020, 0, 1), availableCenti: 100 }),
      iv(2, { interventionStartDate: new Date(2024, 0, 1), availableCenti: 900 }),
    ];
    const contributions = [contrib(1, { availableCenti: 200 })];
    const capacity = rule({ uid: 'tmr_cap', preferType: 'capacity' });

    const plan = planAutomatch([capacity], interventions, bySignature([1]), byId(contributions));

    // inv_2 has more room, so it fills first despite being newer.
    expect(plan.pairs).toEqual([
      { ttcContributionId: 1, interventionUid: 'inv_2', deltaCenti: 200, ruleUid: 'tmr_cap' },
    ]);
  });

  it('filters by donation ref for donor rules using the unfiltered list', () => {
    const interventions = [iv(1)];
    const contributions = [
      contrib(1, { donationRef: 'PL-AAA', availableCenti: 100 }),
      contrib(2, { donationRef: 'PL-BBB', availableCenti: 100 }),
    ];
    const donor = rule({ uid: 'tmr_donor', whenType: 'donor', whenValue: 'PL-BBB' });
    // Disable the default's effect by checking rule attribution instead:
    const plan = planAutomatch([donor], interventions, bySignature([1, 2]), byId(contributions));

    const donorPairs = plan.pairs.filter((p) => p.ruleUid === 'tmr_donor');
    expect(donorPairs).toEqual([
      { ttcContributionId: 2, interventionUid: 'inv_1', deltaCenti: 100, ruleUid: 'tmr_donor' },
    ]);
    // The other donation still flows through the default afterwards.
    expect(plan.pairs.find((p) => p.ttcContributionId === 1)?.ruleUid).toBeNull();
  });

  it('reads filtered rules from their own signature list and never double-spends', () => {
    const interventions = [iv(1, { availableCenti: 1000 })];
    const shared = contrib(1, { availableCenti: 300 });
    const companyRule = rule({ uid: 'tmr_company', whenType: 'company' });

    // The same donation appears in both the company list and the unfiltered
    // list (it IS a company donation); it must be spent exactly once.
    const plan = planAutomatch(
      [companyRule],
      interventions,
      bySignature([1], { 'profileType=company': [1] }),
      byId([shared]),
    );

    expect(plan.totals.matchedCenti).toBe(300);
    expect(plan.pairs).toEqual([
      { ttcContributionId: 1, interventionUid: 'inv_1', deltaCenti: 300, ruleUid: 'tmr_company' },
    ]);
    expect(plan.perRule[0]).toMatchObject({ ruleUid: 'tmr_company', matchedCenti: 300 });
    expect(plan.perRule[1]).toMatchObject({ ruleUid: null, matchedCenti: 0 });
  });

  it('merges pair deltas when two rules hit the same (donation, location) pair', () => {
    const interventions = [iv(1, { siteId: 7, availableCenti: 1000 })];
    const contributions = [
      contrib(1, { availableCenti: 100, donationRef: 'PL-X' }),
      contrib(2, { availableCenti: 100 }),
    ];
    const donorRule = rule({
      uid: 'tmr_donor',
      whenType: 'donor',
      whenValue: 'PL-X',
      preferType: 'site',
      preferSiteId: 7,
    });

    const plan = planAutomatch([donorRule], interventions, bySignature([1, 2]), byId(contributions));

    // Donation 1 lands on inv_1 via the donor rule; donation 2 lands on the
    // same location via the default. Each pair appears once.
    const keys = plan.pairs.map((p) => `${p.ttcContributionId}:${p.interventionUid}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(plan.totals.matchedCenti).toBe(200);
  });

  it('merges into one pair when a rule and the default both feed the same donation to the same location', () => {
    // Site rule fills part of inv_1 (limited by its own capacity snapshot is
    // not a factor here; we cap the donation instead across two rules).
    const interventions = [iv(1, { siteId: 7, availableCenti: 300 })];
    const contributions = [contrib(1, { availableCenti: 500 })];
    // First rule only spends within site 7 but is orderBy-limited to the same
    // location the default would also pick: same pair, two passes.
    const siteRule = rule({ uid: 'tmr_site', preferType: 'site', preferSiteId: 7 });

    const plan = planAutomatch([siteRule], interventions, bySignature([1]), byId(contributions));

    // The site rule already drains the location; the default finds nothing
    // left, so exactly one pair exists with the site rule's attribution.
    expect(plan.pairs).toEqual([
      { ttcContributionId: 1, interventionUid: 'inv_1', deltaCenti: 300, ruleUid: 'tmr_site' },
    ]);
  });

  it('flags siteMissing and passes everything to later rules when the preferred site is gone', () => {
    const interventions = [iv(1, { siteId: null })];
    const contributions = [contrib(1, { availableCenti: 100 })];
    const deadSite = rule({ uid: 'tmr_dead', preferType: 'site', preferSiteId: 99, preferSiteDeleted: true });

    const plan = planAutomatch([deadSite], interventions, bySignature([1]), byId(contributions));

    expect(plan.perRule[0]).toMatchObject({ ruleUid: 'tmr_dead', matchedCenti: 0, siteMissing: true });
    expect(plan.pairs).toEqual([
      { ttcContributionId: 1, interventionUid: 'inv_1', deltaCenti: 100, ruleUid: null },
    ]);
  });

  it('returns an empty plan when there is no capacity', () => {
    const interventions = [iv(1, { availableCenti: 0 })];
    const contributions = [contrib(1)];

    const plan = planAutomatch([], interventions, bySignature([1]), byId(contributions));

    expect(plan.pairs).toEqual([]);
    expect(plan.totals).toEqual({ matchedCenti: 0, contributionsMatched: 0, interventionsFilled: 0 });
  });

  it('always appends the default rule to perRule, even when disabled rules were filtered out upstream', () => {
    const plan = planAutomatch([], [], new Map([['', []]]), new Map());
    expect(plan.perRule).toEqual([
      { ruleUid: null, label: DEFAULT_RULE.label, matchedCenti: 0, contributionsUsed: 0 },
    ]);
  });
});
