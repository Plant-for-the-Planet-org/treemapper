'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getTreematchInterventions, getUserProjectSites } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore';
import {
  EMPTY_PAGINATION, PAGE_SIZE, Site, TreeMatchIntervention, TreeMatchPagination,
} from '../types';

/**
 * The plant-locations pane: the list, its filters, the project it reads from,
 * and the project-wide totals that go in the stats ribbon.
 *
 * Every filter here is applied server-side, so each one costs a fetch of page 1.
 * That is affordable because this endpoint reads local Postgres (20-60ms), unlike
 * the donations side.
 */
export function useTreematchLocations(pageProjectUid: string, accessToken: string) {
  // Plant locations can come from any other project the user owns. The server
  // authorizes every source project on the write, so a match can span projects;
  // TTC does not care which project holds the trees. Donations always belong to
  // the current project.
  const myProjects = useProjectStore(s => s.projects);
  const [projectUid, setProjectUid] = useState<string>(pageProjectUid);
  useEffect(() => { setProjectUid(pageProjectUid); }, [pageProjectUid]);
  const projects = useMemo(
    () => myProjects.filter(p => p.userRole === 'owner'),
    [myProjects],
  );
  const projectName = myProjects.find(p => p.uid === projectUid)?.name;
  const crossProject = projectUid !== pageProjectUid;

  const [items, setItems] = useState<TreeMatchIntervention[]>([]);
  const [pagination, setPagination] = useState<TreeMatchPagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notReadyCount, setNotReadyCount] = useState(0);
  const [serverStats, setServerStats] = useState({ plantedTrees: 0, matchedTrees: 0 });
  const [sites, setSites] = useState<Site[]>([]);
  // Trees matched since the last fetch; added to the server total for an
  // optimistic ribbon, and reset whenever fresh server stats (which already
  // include them) arrive.
  const [sessionMatchedTrees, setSessionMatchedTrees] = useState(0);

  // Bumped whenever the list is replaced rather than appended to. The map refits
  // its bounds on a change and ignores growth, and the selection clears itself
  // on the same signal.
  const [generation, setGeneration] = useState(0);

  const [view, setView] = useState<'list' | 'map'>('list');
  // Location whose detail card is open on the map (marker click or "View on map").
  const [mapFocus, setMapFocus] = useState<string | null>(null);

  const [type, setType] = useState('all');
  const [site, setSite] = useState('all'); // 'all' | 'none' | site id
  const [dates, setDates] = useState<DateRange | undefined>(undefined);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // React StrictMode invokes every mount effect twice in development. Identical
  // requests already in flight are collapsed into one; `force` opts out, so a
  // reload that follows a write is never swallowed.
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetch = async (page: number, append: boolean, force = false) => {
    if (!projectUid || !accessToken) return;
    const key = `iv:${projectUid}:${page}:${append}:${type}:${site}:${onlyAvailable}:${debouncedSearch}`
      + `:${dates?.from?.toISOString() ?? ''}:${dates?.to?.toISOString() ?? ''}`;
    if (!force && inFlight.current.has(key)) return;
    inFlight.current.add(key);
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const response = await getTreematchInterventions(accessToken, projectUid, {
        page,
        limit: PAGE_SIZE,
        type: type !== 'all' ? type : undefined,
        siteId: site !== 'all' && site !== 'none' ? site : undefined,
        noSite: site === 'none' ? true : undefined,
        interventionStartDate: dates?.from ? format(dates.from, 'yyyy-MM-dd') : undefined,
        interventionStartDateTo: dates?.to ? format(dates.to, 'yyyy-MM-dd') : undefined,
        search: debouncedSearch || undefined,
        onlyAvailable: onlyAvailable ? true : undefined,
      });
      if (response?.statusCode === 200 && response.data) {
        // The endpoint has no notion of the page's project, so the source
        // project name is stamped here when browsing another owned project.
        const sourceName = crossProject ? (projectName ?? 'Other project') : undefined;
        const raw: TreeMatchIntervention[] = response.data.items || [];
        const next = sourceName ? raw.map(i => ({ ...i, crossProjectName: sourceName })) : raw;
        setItems(prev => (append ? [...prev, ...next] : next));
        setPagination(response.data.pagination || EMPTY_PAGINATION);
        setNotReadyCount(response.data.notReadyCount || 0);
        setServerStats(response.data.stats || { plantedTrees: 0, matchedTrees: 0 });
        // Fresh stats are summed from the allocation table and already include
        // everything matched this session.
        setSessionMatchedTrees(0);
        // A replaced result set is a new answer. An appended page is the same
        // answer with more of it, and treating it as new would throw away the
        // map zoom and the selection the user just made.
        if (!append) setGeneration(g => g + 1);
      } else {
        throw new Error(response?.message || 'Failed to load plant locations');
      }
    } catch (err) {
      console.error('Error fetching TreeMatch interventions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plant locations');
      if (!append) { setItems([]); setPagination(EMPTY_PAGINATION); }
    } finally {
      inFlight.current.delete(key);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Refetch page 1 whenever a server-side filter changes.
  useEffect(() => {
    fetch(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, projectUid, type, site, dates, onlyAvailable, debouncedSearch]);

  // The site filter lists the sites of whichever project this pane is showing.
  useEffect(() => {
    if (!projectUid || !accessToken) return;
    getUserProjectSites(accessToken, projectUid)
      .then(response => {
        if (response?.statusCode === 200) setSites(response.data || []);
      })
      .catch(err => console.error('Error fetching sites:', err));
  }, [projectUid, accessToken]);

  // Switching the source project invalidates the site filter and the map focus.
  const changeProject = (uid: string) => {
    if (uid === projectUid) return;
    setProjectUid(uid);
    setSite('all');
    setMapFocus(null);
  };

  const reload = () => { void fetch(1, false, true); };
  const loadMore = () => { void fetch(pagination.page + 1, true); };

  /**
   * Record a write locally. No per-location numbers come back from the match
   * endpoint, so the pane is bumped optimistically and corrected by the next
   * fetch; the ribbon adds the trees until then.
   */
  const noteMatched = (byUid: Record<string, number>, trees: number) => {
    setItems(prev => prev.map(i => byUid[i.uid]
      ? { ...i, matchedTrees: Math.min(i.totalTreeCount, i.matchedTrees + byUid[i.uid]) }
      : i));
    setSessionMatchedTrees(prev => prev + trees);
  };

  return {
    // where the locations come from
    projectUid, projects, projectName, crossProject, changeProject,
    // data
    items, pagination, loading, loadingMore, error, notReadyCount, sites, generation,
    plantedTrees: serverStats.plantedTrees,
    matchedTrees: serverStats.matchedTrees + sessionMatchedTrees,
    // view state
    view, setView, mapFocus, setMapFocus,
    // filters
    filters: {
      type, setType, site, setSite, dates, setDates,
      onlyAvailable, setOnlyAvailable, search, setSearch,
    },
    // actions
    reload, loadMore, noteMatched,
  };
}

export type LocationsPaneState = ReturnType<typeof useTreematchLocations>;
