import { getSciencetificSpecies } from '@shared-core/fetchApi/api.fetch';
import { DraftTree } from '../types';

/**
 * Resolve the species names in a tree CSV to scientific_species uids.
 *
 * The plot upload DTO wants a uid; a CSV only ever has a name. The project
 * species list cannot help because it returns internal numeric ids, not uids, so
 * we go through /scientific-species/search, which does return uids.
 *
 * Only distinct names are looked up (a 500-tree sheet is usually under 20
 * species), results are cached for the session, and lookups run a few at a time
 * so a wide sheet does not open 50 sockets at once. A name that does not match
 * exactly is left for the user to fix in the review step; if they leave it, the
 * plot still saves with that species recorded as unknown, exactly as the mobile
 * app does for an unidentified tree.
 */

export interface SpeciesHit {
  uid: string;
  scientificName: string;
}

const CONCURRENCY = 4;

const cache = new Map<string, SpeciesHit | null>();

const key = (name: string) => name.trim().toLowerCase();

/** Search the species database and return an exact name match, if there is one. */
async function lookupOne(token: string, name: string): Promise<SpeciesHit | null> {
  const cacheKey = key(name);
  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null;

  let hit: SpeciesHit | null = null;
  try {
    const res = await getSciencetificSpecies(token, encodeURIComponent(name.trim()));
    const rows: any[] = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
    // The endpoint does a fuzzy contains match, so accept only an exact name.
    const exact = rows.find(
      (r) => (r?.scientificName ?? '').trim().toLowerCase() === cacheKey && r?.uid,
    );
    if (exact) hit = { uid: exact.uid, scientificName: exact.scientificName };
  } catch {
    // Treat a failed lookup as unmatched. The user can still fix it by hand and
    // the plot remains savable, so a flaky search never blocks the import.
  }

  cache.set(cacheKey, hit);
  return hit;
}

/** Look up many names with a small concurrency cap. */
export async function lookupSpecies(
  token: string,
  names: string[],
): Promise<Map<string, SpeciesHit | null>> {
  const distinct = [...new Set(names.map(key).filter(Boolean))];
  const results = new Map<string, SpeciesHit | null>();

  for (let i = 0; i < distinct.length; i += CONCURRENCY) {
    const batch = distinct.slice(i, i + CONCURRENCY);
    const hits = await Promise.all(batch.map((n) => lookupOne(token, n)));
    batch.forEach((n, idx) => results.set(n, hits[idx]));
  }

  return results;
}

/**
 * Stamp match results onto the draft trees. Matched trees also take the
 * database's spelling of the name, so the plot's species list stays consistent
 * with the rest of the project.
 */
export function applySpeciesMatches(
  trees: DraftTree[],
  matches: Map<string, SpeciesHit | null>,
): DraftTree[] {
  return trees.map((t) => {
    if (!t.speciesName) return { ...t, speciesMatch: 'unmatched' as const };
    // Never override a species the user picked by hand.
    if (t.speciesMatch === 'matched' && t.scientificSpeciesUid) return t;

    const hit = matches.get(key(t.speciesName));
    if (hit) {
      return {
        ...t,
        scientificSpeciesUid: hit.uid,
        speciesName: hit.scientificName,
        speciesMatch: 'matched' as const,
      };
    }
    return { ...t, scientificSpeciesUid: null, speciesMatch: 'unmatched' as const };
  });
}

/** Distinct unmatched names, with how many trees each affects. */
export function unmatchedSpeciesNames(trees: DraftTree[]): { name: string; count: number }[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const t of trees) {
    if (t.speciesMatch === 'matched' || !t.speciesName) continue;
    const k = key(t.speciesName);
    const existing = counts.get(k);
    if (existing) existing.count += 1;
    else counts.set(k, { name: t.speciesName, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

/** Search for the species picker in the review step. */
export async function searchSpecies(token: string, term: string): Promise<SpeciesHit[]> {
  if (term.trim().length < 3) return [];
  try {
    const res = await getSciencetificSpecies(token, encodeURIComponent(term.trim()));
    const rows: any[] = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
    return rows
      .filter((r) => r?.uid && r?.scientificName)
      .map((r) => ({ uid: r.uid, scientificName: r.scientificName }));
  } catch {
    return [];
  }
}
