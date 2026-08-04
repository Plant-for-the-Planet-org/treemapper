// Unit arithmetic for TreeMatch. TTC works in centi-units (100 = 1 tree, so
// partial trees are representable); the web works in whole trees. Everything
// stored in treematch_allocation is centi-units, and conversion happens only
// here, at the API boundary.
//
// Kept pure and dependency-free so the arithmetic is unit-testable without a
// database or the Nest container.

export const CENTI = 100;

export const toTrees = (centiUnits: number): number => centiUnits / CENTI;

export const toCentiUnits = (trees: number): number => Math.round(trees * CENTI);

export interface MatchPairInput {
  contributionId: number;
  interventionUid: string;
  trees: number;
}

export interface AggregatedPair {
  contributionId: number;
  interventionUid: string;
  centiUnits: number;
}

export interface AggregatedMatches {
  // Deduplicated pairs; a pair repeated in one request is summed, not applied
  // twice.
  pairs: AggregatedPair[];
  // Centi-units this request adds per plant location, for the capacity check.
  byIntervention: Map<string, number>;
  // Contribution ids touched, ascending. Ascending order matters: locks are
  // taken in this order so concurrent requests cannot deadlock.
  contributionIds: number[];
}

export function aggregateMatches(matches: MatchPairInput[]): AggregatedMatches {
  const merged = new Map<string, AggregatedPair>();
  const byIntervention = new Map<string, number>();
  const contributionIds = new Set<number>();

  for (const match of matches) {
    const centiUnits = toCentiUnits(match.trees);
    const key = `${match.contributionId}:${match.interventionUid}`;
    const existing = merged.get(key);
    if (existing) {
      existing.centiUnits += centiUnits;
    } else {
      merged.set(key, {
        contributionId: match.contributionId,
        interventionUid: match.interventionUid,
        centiUnits,
      });
    }
    byIntervention.set(
      match.interventionUid,
      (byIntervention.get(match.interventionUid) || 0) + centiUnits,
    );
    contributionIds.add(match.contributionId);
  }

  return {
    pairs: [...merged.values()],
    byIntervention,
    contributionIds: [...contributionIds].sort((a, b) => a - b),
  };
}

// A plant location can never hold more claimed trees than it has planted.
// Partial allocation is fine; overshooting is not.
export function exceedsCapacity(
  currentCentiUnits: number,
  addedCentiUnits: number,
  totalTreeCount: number | null,
): boolean {
  return currentCentiUnits + addedCentiUnits > (totalTreeCount || 0) * CENTI;
}
