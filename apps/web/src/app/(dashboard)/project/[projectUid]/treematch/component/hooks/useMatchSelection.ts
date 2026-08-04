'use client'

import { useEffect, useMemo, useState } from 'react';
import {
  Contribution, MatchAmounts, TreeMatchIntervention,
  availableTrees, requestedTrees,
} from '../types';

interface Params {
  interventions: TreeMatchIntervention[];
  contributions: Contribution[];
  /** changes when the locations list is replaced rather than appended to */
  locationGeneration: number;
  /** changes when the donations list is replaced rather than appended to */
  donationGeneration: number;
}

/**
 * What is picked on each side, and the arithmetic that decides whether it can be
 * matched.
 *
 * The two panes own their own data and know nothing about each other, so this is
 * where they meet: it reads both lists and hands each pane back the two things it
 * needs, which rows are ticked and which rows may not be ticked right now.
 */
export function useMatchSelection({
  interventions, contributions, locationGeneration, donationGeneration,
}: Params) {
  const [selInterv, setSelInterv] = useState<Set<string>>(new Set());
  const [selContrib, setSelContrib] = useState<Set<number>>(new Set());
  // Partial matching. Only donations the user has typed a number into appear
  // here; everything else claims its full open amount, so an untouched card
  // behaves exactly as it did before this existed.
  const [matchAmounts, setMatchAmounts] = useState<MatchAmounts>({});

  // A replaced result set is a different question, so the answer starts over.
  useEffect(() => { setSelInterv(new Set()); }, [locationGeneration]);
  useEffect(() => {
    setSelContrib(new Set());
    setMatchAmounts({});
  }, [donationGeneration]);

  // A donation can also leave the list on its own, without the list being
  // replaced: ignoring one drops its row immediately. Anything no longer on the
  // list cannot stay in the match, or the bottom bar counts a row that is not
  // there and the write carries a donation the user cannot see.
  useEffect(() => {
    const ids = new Set(contributions.map(c => c.id));
    setSelContrib(prev => {
      const next = new Set([...prev].filter(id => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
    setMatchAmounts(prev => {
      const keys = Object.keys(prev);
      const kept = keys.filter(id => ids.has(Number(id)));
      if (kept.length === keys.length) return prev;
      return Object.fromEntries(kept.map(id => [id, prev[Number(id)]]));
    });
  }, [contributions]);

  const selIntervList = useMemo(
    () => interventions.filter(i => selInterv.has(i.uid)),
    [interventions, selInterv],
  );
  const selContribList = useMemo(
    () => contributions.filter(c => selContrib.has(c.id)),
    [contributions, selContrib],
  );

  // Coverage: do the selected plant locations hold enough trees for what the
  // selected donations are asking for? Demand is the requested amount, not the
  // open amount, so a partial shrinks the number on the connector too.
  const supply = selIntervList.reduce((s, i) => s + availableTrees(i), 0);
  const demand = selContribList.reduce((s, c) => s + requestedTrees(c, matchAmounts), 0);
  const matchable = Math.min(supply, demand);
  const canMatch = selIntervList.length > 0 && selContribList.length > 0 && demand > 0;

  // Selection guards. The greedy fill walks the donations and consumes locations
  // only until each one is satisfied, so a location picked after the selection
  // already covers the demand is never reached, and a donation picked after the
  // locations are exhausted only adds shortfall. Both rules block *adding* only;
  // deselecting always works. They cannot trap the user either: whichever side
  // is short stays open, and when the two are exactly equal nothing more is
  // needed anyway.
  const supplyCoversDemand = demand > 0 && supply >= demand;
  const demandCoversSupply = supply > 0 && demand >= supply;
  const intervBlocked = (uid: string) => supplyCoversDemand && !selInterv.has(uid);
  const contribBlocked = (id: number) => demandCoversSupply && !selContrib.has(id);

  // Guarded in the handlers, not just on the cards: the map view toggles
  // locations through this same function and would otherwise walk past the rule.
  const toggleInterv = (uid: string) => {
    if (intervBlocked(uid)) return;
    setSelInterv(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });
  };

  const toggleContrib = (id: number) => {
    if (contribBlocked(id)) return;
    const turningOn = !selContrib.has(id);
    // Ticking a donation whose field was cleared means "match this one", so the
    // empty field goes back to the full open amount instead of asking for zero.
    if (turningOn && Number(matchAmounts[id] ?? NaN) <= 0) {
      setMatchAmounts(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
    setSelContrib(prev => { const n = new Set(prev); turningOn ? n.add(id) : n.delete(id); return n; });
  };

  // Typing a number is itself the selection: it picks the donation up, and
  // clearing the field puts it back down. That keeps the field and the checkbox
  // from ever disagreeing about whether the donation is in the match.
  const setAmount = (id: number, raw: string) => {
    // Typing is a selection, so it has to respect the same block the checkbox
    // does, or the field becomes a way around it.
    if (contribBlocked(id)) return;
    setMatchAmounts(prev => ({ ...prev, [id]: raw }));
    const trees = raw === '' ? 0 : Number(raw);
    setSelContrib(prev => {
      const n = new Set(prev);
      if (trees > 0) n.add(id); else n.delete(id);
      return n;
    });
  };

  // "Max": forget the partial. The card then shows the exact open amount again,
  // fraction included, which a whole-tree field could not have been typed back.
  const resetAmount = (id: number) => {
    setMatchAmounts(prev => { const n = { ...prev }; delete n[id]; return n; });
    setSelContrib(prev => new Set(prev).add(id));
  };

  const clear = () => {
    setSelInterv(new Set());
    setSelContrib(new Set());
    setMatchAmounts({});
  };

  return {
    selInterv, selContrib, matchAmounts,
    selIntervList, selContribList,
    supply, demand, matchable, canMatch,
    supplyCoversDemand, demandCoversSupply,
    intervBlocked, contribBlocked,
    toggleInterv, toggleContrib, setAmount, resetAmount, clear,
  };
}

export type MatchSelection = ReturnType<typeof useMatchSelection>;
