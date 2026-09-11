import {
  PlannerContribution,
  PlannerIntervention,
  planAutomatch,
} from './automatch-planner';
import { PlannerRule, RuleDefinition, sweepSignatureOf, paramsForSignature } from './rule-types';

// Fixed clock, so `olderThanDays` and every date order are deterministic.
const NOW = new Date('2026-07-31T00:00:00.000Z');

const iv = (
  id: number,
  overrides: Partial<PlannerIntervention> = {},
): PlannerIntervention => ({
  id,
  uid: `iv${id}`,
  siteId: null,
  interventionStartDate: new Date(`2026-01-${String(id).padStart(2, '0')}T00:00:00.000Z`),
  approved: true,
  availableCenti: 10_000, // 100 trees
  ...overrides,
});

const contrib = (
  ttcId: number,
  overrides: Partial<PlannerContribution> = {},
): PlannerContribution => ({
  ttcId,
  paymentDate: new Date(`2026-02-${String(ttcId).padStart(2, '0')}T00:00:00.000Z`),
  allocationPriority: 'automatic',
  unitsCenti: 5_000,
  availableCenti: 5_000,
  unitType: 'tree',
  currency: 'EUR',
  donationRef: `don-${ttcId}`,
  ignored: false,
  ...overrides,
});

const definition = (overrides: Partial<RuleDefinition> = {}): RuleDefinition => ({
  when: { sweep: 'any' },
  prefer: { type: 'oldest' },
  orderBy: 'oldest',
  action: 'match',
  ...overrides,
});

const rule = (uid: string, overrides: Partial<PlannerRule> = {}): PlannerRule => ({
  uid,
  label: uid,
  definition: definition(),
  ...overrides,
});

const byId = (list: PlannerContribution[]) =>
  new Map(list.map((c) => [c.ttcId, c]));

const bySignature = (map: Record<string, number[]>) =>
  new Map(Object.entries(map));

const plan = (input: {
  rules?: PlannerRule[];
  interventions: PlannerIntervention[];
  contributions: PlannerContribution[];
  signatures?: Record<string, number[]>;
  maxPairs?: number;
  maxCenti?: number;
}) =>
  planAutomatch({
    rules: input.rules || [],
    interventions: input.interventions,
    contributionIdsBySignature: bySignature(
      input.signatures || { '': input.contributions.map((c) => c.ttcId) },
    ),
    contributionsById: byId(input.contributions),
    now: NOW,
    maxPairs: input.maxPairs ?? 200,
    maxCenti: input.maxCenti,
  });

describe('sweep signatures', () => {
  it('maps each sweep to its TTC query and back', () => {
    expect(sweepSignatureOf(definition({ when: { sweep: 'any' } }))).toBe('');
    expect(sweepSignatureOf(definition({ when: { sweep: 'company' } })))
      .toBe('profileType=company');
    expect(sweepSignatureOf(definition({ when: { sweep: 'individual' } })))
      .toBe('profileType=individual');
    expect(sweepSignatureOf(definition({ when: { sweep: 'country', country: 'de' } })))
      .toBe('country=DE');

    expect(paramsForSignature('')).toEqual({});
    expect(paramsForSignature('profileType=company')).toEqual({ profileType: 'company' });
    expect(paramsForSignature('country=DE')).toEqual({ country: 'DE' });
  });

  it('reads a filtered rule off the unfiltered list when the sweep is any', () => {
    // A rule that only uses in-memory filters costs no extra TTC sweep.
    const filtered = definition({
      when: { sweep: 'any', filters: [{ field: 'openTrees', op: 'gte', value: 10 }] },
    });
    expect(sweepSignatureOf(filtered)).toBe('');
  });
});

describe('the implicit catch-all', () => {
  it('matches with no saved rules at all', () => {
    const result = plan({
      interventions: [iv(2), iv(1)],
      contributions: [contrib(1)],
    });

    // Oldest location first, whatever order it arrived in.
    expect(result.pairs).toEqual([
      { ttcContributionId: 1, interventionUid: 'iv1', centi: 5_000, ruleUid: null },
    ]);
    expect(result.totals).toEqual({
      matchedCenti: 5_000,
      contributionsMatched: 1,
      interventionsFilled: 1,
    });
    expect(result.perRule).toHaveLength(1);
    expect(result.perRule[0].ruleUid).toBeNull();
  });

  it('always appears in perRule, even when it places nothing', () => {
    const result = plan({ interventions: [], contributions: [contrib(1)] });
    expect(result.pairs).toEqual([]);
    expect(result.perRule.map((r) => r.ruleUid)).toEqual([null]);
  });

  it('splits one donation across locations until it is spent', () => {
    const result = plan({
      interventions: [iv(1, { availableCenti: 2_000 }), iv(2, { availableCenti: 4_000 })],
      contributions: [contrib(1, { availableCenti: 5_000, unitsCenti: 5_000 })],
    });

    expect(result.pairs).toEqual([
      { ttcContributionId: 1, interventionUid: 'iv1', centi: 2_000, ruleUid: null },
      { ttcContributionId: 1, interventionUid: 'iv2', centi: 3_000, ruleUid: null },
    ]);
  });

  it('plans nothing when there is no capacity', () => {
    const result = plan({
      interventions: [iv(1, { availableCenti: 0 })],
      contributions: [contrib(1)],
    });
    expect(result.pairs).toEqual([]);
    expect(result.totals.matchedCenti).toBe(0);
  });
});

describe('donation eligibility', () => {
  it('skips ignored donations', () => {
    const result = plan({
      interventions: [iv(1)],
      contributions: [contrib(1, { ignored: true }), contrib(2)],
    });

    expect(result.pairs.map((p) => p.ttcContributionId)).toEqual([2]);
  });

  // The gate this replaced was a hard allowlist of 'automatic' and 'first',
  // which excluded every contribution the backend actually serves.
  it('consumes every allocationPriority unless a rule says otherwise', () => {
    const result = plan({
      interventions: [iv(1, { availableCenti: 100_000 })],
      contributions: [
        contrib(1, { allocationPriority: 'manual' }),
        contrib(2, { allocationPriority: null }),
        contrib(3, { allocationPriority: 'somethingTtcAddedLater' }),
        contrib(4, { allocationPriority: 'automatic' }),
      ],
    });

    expect(result.pairs.map((p) => p.ttcContributionId)).toEqual([1, 2, 3, 4]);
  });

  // How a project keeps a priority out now that nothing gates on it globally:
  // an exclusion rule claims those donations so the catch-all cannot take them.
  it('holds a priority back with an exclusion rule', () => {
    const result = plan({
      rules: [
        rule('r1', {
          definition: definition({
            when: {
              sweep: 'any',
              filters: [{ field: 'allocationPriority', op: 'eq', value: 'manual' }],
            },
            action: 'skip',
          }),
        }),
      ],
      interventions: [iv(1, { availableCenti: 100_000 })],
      contributions: [
        contrib(1, { allocationPriority: 'manual' }),
        contrib(2, { allocationPriority: 'automatic' }),
      ],
    });

    expect(result.pairs.map((p) => p.ttcContributionId)).toEqual([2]);
    expect(result.perRule[0].skipped).toBe(1);
  });

  it('matches a list of priorities with op "in"', () => {
    const result = plan({
      rules: [
        rule('r1', {
          definition: definition({
            when: {
              sweep: 'any',
              filters: [
                { field: 'allocationPriority', op: 'in', value: ['automatic', 'first'] },
              ],
            },
          }),
        }),
      ],
      interventions: [iv(1, { availableCenti: 100_000 })],
      contributions: [
        contrib(1, { allocationPriority: 'manual' }),
        contrib(2, { allocationPriority: 'first' }),
        contrib(3, { allocationPriority: 'automatic' }),
      ],
    });

    // The rule claims the two it names; the catch-all still takes the manual
    // one, which is the whole difference from the old allowlist.
    expect(result.perRule[0].contributionsUsed).toBe(2);
    expect(result.pairs.map((p) => p.ttcContributionId)).toEqual([2, 3, 1]);
  });

  it('consumes first-priority donations before automatic ones', () => {
    const result = plan({
      interventions: [iv(1, { availableCenti: 5_000 })],
      contributions: [
        // Older, so oldest-first would otherwise pick it.
        contrib(1, { allocationPriority: 'automatic' }),
        contrib(2, { allocationPriority: 'first' }),
      ],
    });

    expect(result.pairs.map((p) => p.ttcContributionId)).toEqual([2]);
  });
});

describe('donation order', () => {
  const four = [
    contrib(1, { availableCenti: 1_000 }),
    contrib(2, { availableCenti: 4_000 }),
    contrib(3, { availableCenti: 2_000 }),
  ];

  it('largest open amount first', () => {
    const result = plan({
      rules: [rule('r1', { definition: definition({ orderBy: 'largest' }) })],
      interventions: [iv(1, { availableCenti: 100_000 })],
      contributions: four,
    });
    expect(result.pairs.map((p) => p.ttcContributionId)).toEqual([2, 3, 1]);
  });

  it('smallest open amount first', () => {
    const result = plan({
      rules: [rule('r1', { definition: definition({ orderBy: 'smallest' }) })],
      interventions: [iv(1, { availableCenti: 100_000 })],
      contributions: four,
    });
    expect(result.pairs.map((p) => p.ttcContributionId)).toEqual([1, 3, 2]);
  });

  it('newest paid first', () => {
    const result = plan({
      rules: [rule('r1', { definition: definition({ orderBy: 'newest' }) })],
      interventions: [iv(1, { availableCenti: 100_000 })],
      contributions: four,
    });
    expect(result.pairs.map((p) => p.ttcContributionId)).toEqual([3, 2, 1]);
  });

  it('puts undated donations last in both directions', () => {
    for (const orderBy of ['oldest', 'newest'] as const) {
      const result = plan({
        rules: [rule('r1', { definition: definition({ orderBy }) })],
        interventions: [iv(1, { availableCenti: 100_000 })],
        contributions: [contrib(1, { paymentDate: null }), contrib(2)],
      });
      expect(result.pairs.map((p) => p.ttcContributionId)).toEqual([2, 1]);
    }
  });
});

describe('location preference', () => {
  it('fills a specific site, then the catch-all takes the rest', () => {
    const result = plan({
      rules: [
        rule('site-rule', {
          definition: definition({ prefer: { type: 'site', siteUid: 's1' } }),
          preferSiteId: 7,
        }),
      ],
      interventions: [
        iv(1, { siteId: 7, availableCenti: 2_000 }),
        iv(2, { siteId: 9, availableCenti: 9_000 }),
      ],
      contributions: [contrib(1, { availableCenti: 5_000 })],
    });

    expect(result.pairs).toEqual([
      { ttcContributionId: 1, interventionUid: 'iv1', centi: 2_000, ruleUid: 'site-rule' },
      { ttcContributionId: 1, interventionUid: 'iv2', centi: 3_000, ruleUid: null },
    ]);
    expect(result.perRule[0].matchedCenti).toBe(2_000);
    expect(result.perRule[1].matchedCenti).toBe(3_000);
  });

  it('falls through when the preferred site is gone', () => {
    const result = plan({
      rules: [
        rule('site-rule', {
          definition: definition({ prefer: { type: 'site', siteUid: 'gone' } }),
          preferSiteId: null,
          preferSiteMissing: true,
        }),
      ],
      interventions: [iv(1)],
      contributions: [contrib(1)],
    });

    expect(result.perRule[0].siteMissing).toBe(true);
    expect(result.perRule[0].matchedCenti).toBe(0);
    // The donation is not lost, the catch-all places it.
    expect(result.pairs.map((p) => p.ruleUid)).toEqual([null]);
  });

  it('most free capacity first beats the date order', () => {
    const result = plan({
      rules: [rule('r1', { definition: definition({ prefer: { type: 'capacityHigh' } }) })],
      interventions: [
        iv(1, { availableCenti: 1_000 }),
        iv(2, { availableCenti: 8_000 }),
      ],
      contributions: [contrib(1, { availableCenti: 3_000 })],
    });
    expect(result.pairs).toEqual([
      { ttcContributionId: 1, interventionUid: 'iv2', centi: 3_000, ruleUid: 'r1' },
    ]);
  });

  it('least free capacity first closes small locations out', () => {
    const result = plan({
      rules: [rule('r1', { definition: definition({ prefer: { type: 'capacityLow' } }) })],
      interventions: [
        iv(1, { availableCenti: 8_000 }),
        iv(2, { availableCenti: 1_000 }),
        // A full location must not sort first just because 0 is the smallest.
        iv(3, { availableCenti: 0 }),
      ],
      contributions: [contrib(1, { availableCenti: 3_000 })],
    });
    expect(result.pairs).toEqual([
      { ttcContributionId: 1, interventionUid: 'iv2', centi: 1_000, ruleUid: 'r1' },
      { ttcContributionId: 1, interventionUid: 'iv1', centi: 2_000, ruleUid: 'r1' },
    ]);
  });

  it('onlyApproved skips flagged and unapproved locations', () => {
    const result = plan({
      rules: [
        rule('r1', {
          definition: definition({ prefer: { type: 'oldest', onlyApproved: true } }),
        }),
      ],
      interventions: [
        iv(1, { approved: false }),
        iv(2, { approved: true }),
      ],
      contributions: [contrib(1, { availableCenti: 1_000 })],
    });
    expect(result.pairs.map((p) => p.interventionUid)).toEqual(['iv2']);
  });

  it('newest planting first', () => {
    const result = plan({
      rules: [rule('r1', { definition: definition({ prefer: { type: 'newest' } }) })],
      interventions: [iv(1), iv(3), iv(2)],
      contributions: [contrib(1, { availableCenti: 1_000 })],
    });
    expect(result.pairs.map((p) => p.interventionUid)).toEqual(['iv3']);
  });
});

describe('filters', () => {
  const run = (filters: RuleDefinition['when']['filters'], contributions: PlannerContribution[]) =>
    plan({
      rules: [rule('r1', { definition: definition({ when: { sweep: 'any', filters } }) })],
      interventions: [iv(1, { availableCenti: 1_000_000 })],
      contributions,
    });

  it('compares tree counts', () => {
    const result = run(
      [{ field: 'openTrees', op: 'gte', value: 30 }],
      [contrib(1, { availableCenti: 2_000 }), contrib(2, { availableCenti: 4_000 })],
    );
    // Only contribution 2 (40 trees) passes; 1 still lands via the catch-all.
    expect(result.perRule[0].contributionsUsed).toBe(1);
    expect(result.pairs.find((p) => p.ttcContributionId === 2)?.ruleUid).toBe('r1');
    expect(result.pairs.find((p) => p.ttcContributionId === 1)?.ruleUid).toBeNull();
  });

  it('reads the match state', () => {
    const result = run(
      [{ field: 'matchState', op: 'eq', value: 'partial' }],
      [
        contrib(1, { unitsCenti: 5_000, availableCenti: 5_000 }), // none
        contrib(2, { unitsCenti: 5_000, availableCenti: 2_000 }), // partial
      ],
    );
    expect(result.perRule[0].contributionsUsed).toBe(1);
    expect(result.pairs.find((p) => p.ttcContributionId === 2)?.ruleUid).toBe('r1');
  });

  it('compares payment dates as timestamps', () => {
    const result = run(
      [{ field: 'paymentDate', op: 'lt', value: '2026-02-02T00:00:00.000Z' }],
      [contrib(1), contrib(3)],
    );
    expect(result.perRule[0].contributionsUsed).toBe(1);
    expect(result.pairs.find((p) => p.ttcContributionId === 1)?.ruleUid).toBe('r1');
  });

  it('measures age against the clock it is given', () => {
    // contrib 1 was paid 2026-02-01, which is 180 days before NOW.
    const result = run([{ field: 'olderThanDays', op: 'gte', value: 180 }], [contrib(1)]);
    expect(result.perRule[0].contributionsUsed).toBe(1);
  });

  it('supports in over a list', () => {
    const result = run(
      [{ field: 'currency', op: 'in', value: ['GBP', 'CHF'] }],
      [contrib(1, { currency: 'EUR' }), contrib(2, { currency: 'CHF' })],
    );
    expect(result.perRule[0].contributionsUsed).toBe(1);
    expect(result.pairs.find((p) => p.ttcContributionId === 2)?.ruleUid).toBe('r1');
  });

  it('AND-s several filters', () => {
    const result = run(
      [
        { field: 'unitType', op: 'eq', value: 'tree' },
        { field: 'openTrees', op: 'gt', value: 100 },
      ],
      [contrib(1, { availableCenti: 5_000 })],
    );
    expect(result.perRule[0].contributionsUsed).toBe(0);
  });

  it('matches nothing when the donation cannot answer the filter', () => {
    // A rule that cannot be evaluated must not quietly match everything.
    const result = run(
      [{ field: 'currency', op: 'ne', value: 'EUR' }],
      [contrib(1, { currency: null })],
    );
    expect(result.perRule[0].contributionsUsed).toBe(0);
  });
});

describe('exclusion rules', () => {
  it('holds donations back from every later rule, including the catch-all', () => {
    const result = plan({
      rules: [
        rule('big', {
          definition: definition({
            when: { sweep: 'any', filters: [{ field: 'openTrees', op: 'gt', value: 30 }] },
            action: 'skip',
          }),
        }),
      ],
      interventions: [iv(1, { availableCenti: 1_000_000 })],
      contributions: [
        contrib(1, { availableCenti: 5_000 }), // 50 trees, held back
        contrib(2, { availableCenti: 1_000 }), // 10 trees, matched
      ],
    });

    expect(result.perRule[0].skipped).toBe(1);
    expect(result.perRule[0].matchedCenti).toBe(0);
    expect(result.pairs.map((p) => p.ttcContributionId)).toEqual([2]);
  });
});

describe('shared consumption state', () => {
  it('never spends a donation twice across two sweeps', () => {
    // A German company donation is in both the company list and the unfiltered
    // one; it must be placed once.
    const german = contrib(1, { availableCenti: 5_000 });
    const result = plan({
      rules: [
        rule('company', { definition: definition({ when: { sweep: 'company' } }) }),
        rule('germany', {
          definition: definition({ when: { sweep: 'country', country: 'DE' } }),
        }),
      ],
      interventions: [iv(1, { availableCenti: 1_000_000 })],
      contributions: [german],
      signatures: {
        '': [1],
        'profileType=company': [1],
        'country=DE': [1],
      },
    });

    expect(result.totals.matchedCenti).toBe(5_000);
    expect(result.pairs).toHaveLength(1);
    expect(result.perRule[0].matchedCenti).toBe(5_000);
    expect(result.perRule[1].matchedCenti).toBe(0);
  });

  it('merges two rules that hit the same pair into one amount', () => {
    const result = plan({
      rules: [
        rule('site-rule', {
          definition: definition({
            prefer: { type: 'site', siteUid: 's1' },
            when: { sweep: 'any', filters: [{ field: 'donationRef', op: 'eq', value: 'don-1' }] },
          }),
          preferSiteId: 7,
        }),
      ],
      interventions: [iv(1, { siteId: 7, availableCenti: 100_000 })],
      contributions: [contrib(1), contrib(2)],
    });

    // Both donations land on iv1: one via the site rule, one via the catch-all.
    expect(result.pairs).toHaveLength(2);
    expect(result.totals.interventionsFilled).toBe(1);
    expect(result.perRule[0].matchedCenti).toBe(5_000);
    expect(result.perRule[1].matchedCenti).toBe(5_000);
  });
});

describe('caps', () => {
  it('stops at maxPairs and says so', () => {
    const result = plan({
      interventions: [
        iv(1, { availableCenti: 1_000 }),
        iv(2, { availableCenti: 1_000 }),
        iv(3, { availableCenti: 1_000 }),
      ],
      contributions: [contrib(1, { availableCenti: 3_000 })],
      maxPairs: 2,
    });

    expect(result.pairs).toHaveLength(2);
    expect(result.capped).toBe(true);
    expect(result.totals.matchedCenti).toBe(2_000);
  });

  it('stops at maxCenti mid-donation', () => {
    const result = plan({
      interventions: [iv(1, { availableCenti: 100_000 })],
      contributions: [contrib(1, { availableCenti: 5_000 })],
      maxCenti: 1_500,
    });

    expect(result.totals.matchedCenti).toBe(1_500);
    expect(result.capped).toBe(true);
  });
});
