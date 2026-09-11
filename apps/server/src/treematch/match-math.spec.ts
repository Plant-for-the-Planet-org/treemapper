import {
  CENTI,
  aggregateMatches,
  exceedsCapacity,
  toCentiUnits,
  toTrees,
} from './match-math';

describe('unit conversion', () => {
  it('treats 100 centi-units as one tree', () => {
    expect(toTrees(100)).toBe(1);
    expect(toCentiUnits(1)).toBe(100);
  });

  it('keeps partial trees', () => {
    expect(toTrees(240)).toBe(2.4);
    expect(toCentiUnits(2.4)).toBe(240);
  });

  it('rounds to whole centi-units, since the column is an integer', () => {
    expect(toCentiUnits(0.005)).toBe(1);
    expect(toCentiUnits(0.004)).toBe(0);
    expect(Number.isInteger(toCentiUnits(3.333))).toBe(true);
  });

  it('round-trips', () => {
    for (const trees of [1, 7, 0.5, 12.34, 320]) {
      expect(toTrees(toCentiUnits(trees))).toBeCloseTo(trees, 10);
    }
  });
});

describe('aggregateMatches', () => {
  it('converts each pair to centi-units', () => {
    const result = aggregateMatches([
      { contributionId: 12345, interventionUid: 'inv_a', trees: 320 },
    ]);

    expect(result.pairs).toEqual([
      { contributionId: 12345, interventionUid: 'inv_a', centiUnits: 32000 },
    ]);
    expect(result.contributionIds).toEqual([12345]);
    expect(result.byIntervention.get('inv_a')).toBe(32000);
  });

  it('merges a pair repeated in one request instead of applying it twice', () => {
    const result = aggregateMatches([
      { contributionId: 1, interventionUid: 'inv_a', trees: 10 },
      { contributionId: 1, interventionUid: 'inv_a', trees: 5 },
    ]);

    expect(result.pairs).toHaveLength(1);
    expect(result.pairs[0].centiUnits).toBe(1500);
    expect(result.byIntervention.get('inv_a')).toBe(1500);
  });

  it('keeps distinct contributions on the same location separate', () => {
    const result = aggregateMatches([
      { contributionId: 1, interventionUid: 'inv_a', trees: 10 },
      { contributionId: 2, interventionUid: 'inv_a', trees: 4 },
    ]);

    expect(result.pairs).toHaveLength(2);
    // The capacity check sees the combined demand on the location.
    expect(result.byIntervention.get('inv_a')).toBe(1400);
  });

  it('sums one contribution spread over several locations', () => {
    const result = aggregateMatches([
      { contributionId: 9, interventionUid: 'inv_a', trees: 300 },
      { contributionId: 9, interventionUid: 'inv_b', trees: 200 },
    ]);

    expect(result.pairs).toHaveLength(2);
    expect(result.byIntervention.get('inv_a')).toBe(30000);
    expect(result.byIntervention.get('inv_b')).toBe(20000);
    expect(result.contributionIds).toEqual([9]);
  });

  it('returns contribution ids ascending and deduplicated, for lock ordering', () => {
    const result = aggregateMatches([
      { contributionId: 30, interventionUid: 'inv_a', trees: 1 },
      { contributionId: 10, interventionUid: 'inv_b', trees: 1 },
      { contributionId: 20, interventionUid: 'inv_c', trees: 1 },
      { contributionId: 10, interventionUid: 'inv_d', trees: 1 },
    ]);

    expect(result.contributionIds).toEqual([10, 20, 30]);
  });

  it('reports a pair that rounds to zero, so the caller can reject it', () => {
    const result = aggregateMatches([
      { contributionId: 1, interventionUid: 'inv_a', trees: 0.001 },
    ]);

    expect(result.pairs[0].centiUnits).toBe(0);
  });
});

describe('exceedsCapacity', () => {
  it('allows filling a location exactly', () => {
    expect(exceedsCapacity(0, 500 * CENTI, 500)).toBe(false);
    expect(exceedsCapacity(320 * CENTI, 180 * CENTI, 500)).toBe(false);
  });

  it('allows partial allocation', () => {
    expect(exceedsCapacity(0, 320 * CENTI, 500)).toBe(false);
  });

  it('rejects going past the planted count', () => {
    expect(exceedsCapacity(0, 501 * CENTI, 500)).toBe(true);
    expect(exceedsCapacity(500 * CENTI, 1, 500)).toBe(true);
  });

  it('treats a null tree count as no capacity', () => {
    expect(exceedsCapacity(0, 1, null)).toBe(true);
    expect(exceedsCapacity(0, 0, null)).toBe(false);
  });
});
