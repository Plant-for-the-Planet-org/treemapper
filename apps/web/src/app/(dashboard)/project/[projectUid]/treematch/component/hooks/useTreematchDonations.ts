'use client'

import { useEffect, useRef, useState } from 'react';
import {
  getTreematchContributions, patchTreematchContributionIgnore,
} from '@shared-core/fetchApi/api.fetch';
import { Contribution, EMPTY_PAGINATION, PAGE_SIZE, TreeMatchPagination } from '../types';
import type { Feedback } from './useFeedback';

export type DonationSort = 'oldest' | 'newest';
export type DonorType = 'all' | 'individual' | 'company';
export type MatchStateFilter = 'all' | 'none' | 'partial' | 'complete';

/**
 * The donation backend only knows a project once a Platform Admin has approved
 * it and synced it across, and answers 404 "PlantProject not found." until then.
 * That is a state of the project, not a failed request, so it is kept apart from
 * `error`: there is nothing here to retry.
 *
 * The message is tested as well as the status because our own server answers 404
 * "Project not found" for a project that is missing or deleted here, which is a
 * different thing to tell the user. An upstream reword falls back to the plain
 * error, which is the safe way round.
 */
const isNotOnPlatform = (status: number, message?: string) =>
  status === 404 && /plantproject not found/i.test(message ?? '');

/**
 * The donations pane. Every read here is a proxied TTC call, which TTC serves
 * one at a time at roughly 700ms, so the whole shape of this hook is about not
 * making calls: requests in flight are deduplicated, the ignored view is loaded
 * only when its tab is first opened, and a list the user is not looking at is
 * marked stale rather than refetched.
 *
 * Sort, donor type and country are server-side. The reference search and the
 * match-state filter are not, because TTC's endpoint offers neither; those are
 * applied where the list is rendered, over the loaded pages only.
 */
export function useTreematchDonations(
  projectUid: string,
  accessToken: string,
  feedback: Feedback,
) {
  const [items, setItems] = useState<Contribution[]>([]);
  const [pagination, setPagination] = useState<TreeMatchPagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A property of the project, so it covers both views at once rather than
  // sitting on either list.
  const [notOnPlatform, setNotOnPlatform] = useState(false);

  // Ignored donations are a separate view on the server (`ignored=true`), never
  // mixed into the default one, so they get their own list and pagination.
  // Loaded when the tab is first opened rather than on mount: an eager fetch
  // doubled the time to first paint of a pane nobody was looking at.
  const [ignoredItems, setIgnoredItems] = useState<Contribution[]>([]);
  const [ignoredPagination, setIgnoredPagination] = useState<TreeMatchPagination>(EMPTY_PAGINATION);
  const [ignoredLoading, setIgnoredLoading] = useState(false);
  const [ignoredLoadingMore, setIgnoredLoadingMore] = useState(false);
  const [ignoredError, setIgnoredError] = useState<string | null>(null);
  // Until it has been fetched once there is no real total, so the tab shows no
  // count rather than a misleading zero.
  const [ignoredLoaded, setIgnoredLoaded] = useState(false);

  // Set when an ignore/restore changes a list the user is not currently on, so
  // the refetch happens on the next visit instead of costing a call now.
  const openStale = useRef(false);
  const ignoredStale = useRef(false);

  // Same StrictMode deduplication as the locations pane; the keys are namespaced
  // per list so the two views never collapse into each other.
  const inFlight = useRef(new Set<string>());

  // Bumped whenever the open list is replaced rather than appended to. The
  // selection clears itself on this signal: a fresh page replaces the rows, so
  // the open amounts any partials were typed against are gone too.
  const [generation, setGeneration] = useState(0);

  const [tab, setTab] = useState('toMatch');
  const [sort, setSort] = useState<DonationSort>('oldest');
  const [donorType, setDonorType] = useState<DonorType>('all');
  const [country, setCountry] = useState('all');
  const [matchState, setMatchState] = useState<MatchStateFilter>('all');
  const [search, setSearch] = useState('');

  const fetch = async (page: number, append: boolean, force = false) => {
    if (!projectUid || !accessToken) return;
    const key = `don:${projectUid}:${page}:${append}:${sort}:${donorType}:${country}`;
    if (!force && inFlight.current.has(key)) return;
    inFlight.current.add(key);
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const response = await getTreematchContributions(accessToken, projectUid, {
        page,
        limit: PAGE_SIZE,
        sort,
        profileType: donorType !== 'all' ? donorType : undefined,
        country: country !== 'all' ? country : undefined,
      });
      if (response?.statusCode === 200 && response.data) {
        setNotOnPlatform(false);
        const next: Contribution[] = response.data.items || [];
        setItems(prev => (append ? [...prev, ...next] : next));
        setPagination(response.data.pagination || EMPTY_PAGINATION);
        if (!append) setGeneration(g => g + 1);
      } else if (isNotOnPlatform(Number(response?.statusCode ?? 0), response?.message)) {
        setNotOnPlatform(true);
        setItems([]);
        setPagination(EMPTY_PAGINATION);
        setGeneration(g => g + 1);
      } else {
        throw new Error(response?.message || 'Failed to load donations');
      }
    } catch (err) {
      console.error('Error fetching TreeMatch contributions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load donations');
      if (!append) { setItems([]); setPagination(EMPTY_PAGINATION); }
    } finally {
      inFlight.current.delete(key);
      openStale.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // The ignored view takes no donor or country filter: the server skips them
  // in this mode.
  const fetchIgnored = async (page: number, append: boolean, force = false) => {
    if (!projectUid || !accessToken) return;
    const key = `ign:${projectUid}:${page}:${append}`;
    if (!force && inFlight.current.has(key)) return;
    inFlight.current.add(key);
    if (append) setIgnoredLoadingMore(true); else setIgnoredLoading(true);
    setIgnoredError(null);
    try {
      const response = await getTreematchContributions(accessToken, projectUid, {
        page,
        limit: PAGE_SIZE,
        ignored: true,
      });
      if (response?.statusCode === 200 && response.data) {
        setNotOnPlatform(false);
        const next: Contribution[] = response.data.items || [];
        setIgnoredItems(prev => (append ? [...prev, ...next] : next));
        setIgnoredPagination(response.data.pagination || EMPTY_PAGINATION);
      } else if (isNotOnPlatform(Number(response?.statusCode ?? 0), response?.message)) {
        setNotOnPlatform(true);
        setIgnoredItems([]);
        setIgnoredPagination(EMPTY_PAGINATION);
      } else {
        throw new Error(response?.message || 'Failed to load ignored donations');
      }
    } catch (err) {
      console.error('Error fetching ignored TreeMatch contributions:', err);
      setIgnoredError(err instanceof Error ? err.message : 'Failed to load ignored donations');
      if (!append) { setIgnoredItems([]); setIgnoredPagination(EMPTY_PAGINATION); }
    } finally {
      inFlight.current.delete(key);
      ignoredStale.current = false;
      setIgnoredLoaded(true);
      setIgnoredLoading(false);
      setIgnoredLoadingMore(false);
    }
  };

  // Refetch page 1 whenever a server-side filter changes.
  useEffect(() => {
    fetch(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, projectUid, sort, donorType, country]);

  // Switching projects invalidates the ignored view without fetching it: the
  // next visit to the tab reloads it.
  useEffect(() => {
    setIgnoredItems([]);
    setIgnoredPagination(EMPTY_PAGINATION);
    setIgnoredLoaded(false);
    ignoredStale.current = false;
    setNotOnPlatform(false);
  }, [projectUid]);

  // Each view is fetched on the first visit, then only when a write elsewhere
  // has made it stale. Switching back and forth costs nothing.
  const changeTab = (next: string) => {
    setTab(next);
    if (next === 'ignored' && (!ignoredLoaded || ignoredStale.current)) {
      void fetchIgnored(1, false, true);
    }
    if (next === 'toMatch' && openStale.current) {
      void fetch(1, false, true);
    }
  };

  /**
   * The ignore flag lives in TTC, and the two list views are separate, so
   * ignoring moves a donation from one to the other. The row is dropped from the
   * view it leaves right away, and the view it joins is refetched behind that.
   */
  const setIgnoreFlag = async (id: number, ignoreValue: boolean) => {
    if (!projectUid || !accessToken) return;
    feedback.clearError();

    if (ignoreValue) {
      setItems(prev => prev.filter(c => c.id !== id));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } else {
      setIgnoredItems(prev => prev.filter(c => c.id !== id));
      setIgnoredPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    }

    try {
      const response = await patchTreematchContributionIgnore(accessToken, projectUid, id, ignoreValue);
      if (response?.statusCode && response.statusCode !== 200) {
        throw new Error(response?.message || 'The server rejected the change');
      }
      // The row joined the other view, which the user is not on. Reload it only
      // if it is on screen; otherwise mark it stale and let the next visit pay
      // for the round trip.
      if (ignoreValue) {
        if (tab === 'ignored') void fetchIgnored(1, false, true);
        else ignoredStale.current = true;
      } else if (tab === 'toMatch') {
        void fetch(1, false, true);
      } else {
        openStale.current = true;
      }
    } catch (err) {
      console.error('TreeMatch ignore update failed:', err);
      feedback.fail(err instanceof Error ? err.message : 'Failed to update the donation');
      // The optimistic drop was wrong, so reload the list it was dropped from.
      if (ignoreValue) void fetch(1, false, true); else void fetchIgnored(1, false, true);
    }
  };

  /**
   * Take TTC's accepted absolute totals after a write. There is nothing to guess
   * at here, unlike the locations side.
   */
  const applyTotals = (applied: Record<string, number>) => {
    setItems(prev => prev.map(c => {
      const total = applied[String(c.id)];
      if (total === undefined) return c;
      return { ...c, unitsAllocated: total, available: Math.max(0, c.units - total) };
    }));
  };

  return {
    items, pagination, loading, loadingMore, error, generation,
    /** the donation backend does not have this project yet; it is waiting on a
     * Platform Admin, so neither view has anything to show and neither has
     * anything to retry */
    notOnPlatform,
    ignored: {
      items: ignoredItems,
      pagination: ignoredPagination,
      loading: ignoredLoading,
      loadingMore: ignoredLoadingMore,
      error: ignoredError,
      loaded: ignoredLoaded,
    },
    tab, changeTab,
    filters: {
      sort, setSort, donorType, setDonorType, country, setCountry,
      matchState, setMatchState, search, setSearch,
    },
    reload: () => { void fetch(1, false, true); },
    loadMore: () => { void fetch(pagination.page + 1, true); },
    reloadIgnored: () => { void fetchIgnored(1, false, true); },
    loadMoreIgnored: () => { void fetchIgnored(ignoredPagination.page + 1, true); },
    ignore: (id: number) => { void setIgnoreFlag(id, true); },
    restore: (id: number) => { void setIgnoreFlag(id, false); },
    applyTotals,
    /** an auto-match plan can use donations no loaded page holds, so what is on
     * screen may lag; reload on the next visit rather than paying for it now */
    markStale: () => { openStale.current = true; },
  };
}

export type DonationsPaneState = ReturnType<typeof useTreematchDonations>;
