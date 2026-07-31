'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import {
  Link2, Download, Search, List, Map as MapIcon,
  CheckCircle2, Sprout, Play, Info, ArrowLeftRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToken } from '@/context/useTokenContext';
import {
  getTreematchInterventions, getTreematchContributions, postTreematchMatches,
  patchTreematchContributionIgnore, getUserProjectSites,
} from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useTopBarActions } from '@/component/header/TopBarActions';

import { PlantingDateFilter } from './component/PlantingDateFilter';
import { InterventionMatchCard } from './component/InterventionMatchCard';
import { TreeMatchMap } from './component/TreeMatchMap';
import { DonationCard } from './component/DonationCard';
import { ExportDialog } from './component/ExportDialog';
import { MatchConfirmDialog, PreviewAllocation } from './component/MatchConfirmDialog';
import {
  TreeMatchIntervention, Contribution, TreeMatchPagination, MatchPair,
  MAX_MATCH_PAIRS, COUNTRY_OPTIONS,
  fmtNum, fmtTrees, contribMatchState, contribAvailable, availableTrees,
} from './component/types';

// Auto-match and its rules were removed from the backend and will come back as
// separate work. `./component/RulesDialog` is kept on disk, unimported, with no
// entry point in the UI. Restoring it means bringing back the three fetchers
// commented out in shared-core/fetchApi/api.fetch.ts.

const PAGE_SIZE = 20;
const EMPTY_PAGINATION: TreeMatchPagination = { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 };

const Stat = ({
  icon: Icon, label, value, iconClass, valueClass, description,
}: {
  icon: React.ElementType; label: string; value: string;
  iconClass: string; valueClass?: string; description: string;
}) => (
  <div className="flex items-center gap-3 px-4 py-3.5 min-w-0">
    <div className={cn('h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0', iconClass)}>
      <Icon size={17} />
    </div>
    <div className="min-w-0">
      <div className={cn('text-2xl font-bold tracking-tight leading-none', valueClass ?? 'text-foreground')}>{value}</div>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info size={11} className="text-muted-foreground/70 cursor-help flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="bottom">{description}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </div>
);

interface Site { id: number | string; uid: string; name: string; }

export default function TreeMatchPage() {
  const { projectUid } = useParams<{ projectUid: string }>();
  const { accessToken } = useToken();

  // Plant locations can come from any project where the user is owner or admin.
  // The server authorizes every source project on the write, so a match can
  // span projects; TTC does not care which project holds the trees. Donations
  // always belong to the current project.
  const myProjects = useProjectStore(s => s.projects);
  const [ivProjectUid, setIvProjectUid] = useState<string>(projectUid);
  useEffect(() => { setIvProjectUid(projectUid); }, [projectUid]);
  const matchProjects = useMemo(() => {
    const list = myProjects.filter(p => p.userRole === 'owner' || p.userRole === 'admin');
    if (!list.some(p => p.uid === projectUid)) {
      const current = myProjects.find(p => p.uid === projectUid);
      if (current) list.unshift(current);
    }
    return list;
  }, [myProjects, projectUid]);
  const ivProjectName = myProjects.find(p => p.uid === ivProjectUid)?.name;
  const crossProject = ivProjectUid !== projectUid;

  // Server data: plant locations (left) and donations (right), page-appended.
  const [interventions, setInterventions] = useState<TreeMatchIntervention[]>([]);
  const [ivPagination, setIvPagination] = useState<TreeMatchPagination>(EMPTY_PAGINATION);
  const [ivLoading, setIvLoading] = useState(false);
  const [ivLoadingMore, setIvLoadingMore] = useState(false);
  const [ivError, setIvError] = useState<string | null>(null);
  const [notReadyCount, setNotReadyCount] = useState(0);
  const [serverStats, setServerStats] = useState({ plantedTrees: 0, matchedTrees: 0 });
  const [sites, setSites] = useState<Site[]>([]);

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [donPagination, setDonPagination] = useState<TreeMatchPagination>(EMPTY_PAGINATION);
  const [donLoading, setDonLoading] = useState(false);
  const [donLoadingMore, setDonLoadingMore] = useState(false);
  const [donError, setDonError] = useState<string | null>(null);

  // Ignored donations are a separate view on the server (`ignored=true`), never
  // mixed into the default one, so they get their own list and pagination.
  const [ignoredList, setIgnoredList] = useState<Contribution[]>([]);
  const [ignoredPagination, setIgnoredPagination] = useState<TreeMatchPagination>(EMPTY_PAGINATION);
  const [ignoredLoading, setIgnoredLoading] = useState(false);
  const [ignoredLoadingMore, setIgnoredLoadingMore] = useState(false);
  const [ignoredError, setIgnoredError] = useState<string | null>(null);

  const [selInterv, setSelInterv] = useState<Set<string>>(new Set());
  const [selContrib, setSelContrib] = useState<Set<number>>(new Set());

  // Left-pane filters (all applied server-side)
  const [leftView, setLeftView] = useState<'list' | 'map'>('list');
  // Location whose detail card is open on the map (marker click or "View on map").
  const [mapFocus, setMapFocus] = useState<string | null>(null);
  const [ivType, setIvType] = useState('all');
  const [ivSite, setIvSite] = useState('all'); // 'all' | 'none' | site id
  const [ivDates, setIvDates] = useState<DateRange | undefined>(undefined);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [ivSearch, setIvSearch] = useState('');
  const [debouncedIvSearch, setDebouncedIvSearch] = useState('');

  // Right-pane filters. Sort, donor type and country are applied server-side
  // (they map to the TTC contributions filters); match state and the reference
  // search work on the loaded items.
  const [rightTab, setRightTab] = useState('toMatch');
  const [sort, setSort] = useState<'oldest' | 'newest'>('oldest');
  const [profileType, setProfileType] = useState<'all' | 'individual' | 'company'>('all');
  const [country, setCountry] = useState('all');
  const [matchState, setMatchState] = useState<'all' | 'none' | 'partial' | 'complete'>('all');
  const [donSearch, setDonSearch] = useState('');

  // Dialogs + feedback
  const [exportOpen, setExportOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [matchSubmitting, setMatchSubmitting] = useState(false);
  // The match error belongs in the confirm dialog, where the retry happens.
  const [matchError, setMatchError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Trees matched since the last interventions fetch; added to the server
  // total for an optimistic ribbon, and reset whenever fresh server stats
  // (which include these matches) arrive.
  const [sessionMatchedTrees, setSessionMatchedTrees] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedIvSearch(ivSearch), 400);
    return () => clearTimeout(t);
  }, [ivSearch]);

  const fetchInterventions = async (page: number, append: boolean) => {
    if (!ivProjectUid || !accessToken) return;
    if (append) setIvLoadingMore(true); else setIvLoading(true);
    setIvError(null);
    try {
      const response = await getTreematchInterventions(accessToken, ivProjectUid, {
        page,
        limit: PAGE_SIZE,
        type: ivType !== 'all' ? ivType : undefined,
        siteId: ivSite !== 'all' && ivSite !== 'none' ? ivSite : undefined,
        noSite: ivSite === 'none' ? true : undefined,
        interventionStartDate: ivDates?.from ? format(ivDates.from, 'yyyy-MM-dd') : undefined,
        interventionStartDateTo: ivDates?.to ? format(ivDates.to, 'yyyy-MM-dd') : undefined,
        search: debouncedIvSearch || undefined,
        onlyAvailable: onlyAvailable ? true : undefined,
      });
      if (response?.statusCode === 200 && response.data) {
        // The endpoint has no notion of the page's project, so the source
        // project name is stamped here when browsing another owned project.
        const sourceName = crossProject ? (ivProjectName ?? 'Other project') : undefined;
        const raw: TreeMatchIntervention[] = response.data.items || [];
        const items = sourceName ? raw.map(i => ({ ...i, crossProjectName: sourceName })) : raw;
        setInterventions(prev => (append ? [...prev, ...items] : items));
        setIvPagination(response.data.pagination || EMPTY_PAGINATION);
        setNotReadyCount(response.data.notReadyCount || 0);
        setServerStats(response.data.stats || { plantedTrees: 0, matchedTrees: 0 });
        // Fresh stats are summed from the allocation table and already include
        // everything matched this session.
        setSessionMatchedTrees(0);
        if (!append) setSelInterv(new Set());
      } else {
        throw new Error(response?.message || 'Failed to load plant locations');
      }
    } catch (err) {
      console.error('Error fetching TreeMatch interventions:', err);
      setIvError(err instanceof Error ? err.message : 'Failed to load plant locations');
      if (!append) { setInterventions([]); setIvPagination(EMPTY_PAGINATION); }
    } finally {
      setIvLoading(false);
      setIvLoadingMore(false);
    }
  };

  const fetchContributions = async (page: number, append: boolean) => {
    if (!projectUid || !accessToken) return;
    if (append) setDonLoadingMore(true); else setDonLoading(true);
    setDonError(null);
    try {
      const response = await getTreematchContributions(accessToken, projectUid, {
        page,
        limit: PAGE_SIZE,
        sort,
        profileType: profileType !== 'all' ? profileType : undefined,
        country: country !== 'all' ? country : undefined,
      });
      if (response?.statusCode === 200 && response.data) {
        const items: Contribution[] = response.data.items || [];
        setContributions(prev => (append ? [...prev, ...items] : items));
        setDonPagination(response.data.pagination || EMPTY_PAGINATION);
        if (!append) setSelContrib(new Set());
      } else {
        throw new Error(response?.message || 'Failed to load donations');
      }
    } catch (err) {
      console.error('Error fetching TreeMatch contributions:', err);
      setDonError(err instanceof Error ? err.message : 'Failed to load donations');
      if (!append) { setContributions([]); setDonPagination(EMPTY_PAGINATION); }
    } finally {
      setDonLoading(false);
      setDonLoadingMore(false);
    }
  };

  // The ignored view takes no donor or country filter: the server skips them
  // in this mode.
  const fetchIgnored = async (page: number, append: boolean) => {
    if (!projectUid || !accessToken) return;
    if (append) setIgnoredLoadingMore(true); else setIgnoredLoading(true);
    setIgnoredError(null);
    try {
      const response = await getTreematchContributions(accessToken, projectUid, {
        page,
        limit: PAGE_SIZE,
        ignored: true,
      });
      if (response?.statusCode === 200 && response.data) {
        const items: Contribution[] = response.data.items || [];
        setIgnoredList(prev => (append ? [...prev, ...items] : items));
        setIgnoredPagination(response.data.pagination || EMPTY_PAGINATION);
      } else {
        throw new Error(response?.message || 'Failed to load ignored donations');
      }
    } catch (err) {
      console.error('Error fetching ignored TreeMatch contributions:', err);
      setIgnoredError(err instanceof Error ? err.message : 'Failed to load ignored donations');
      if (!append) { setIgnoredList([]); setIgnoredPagination(EMPTY_PAGINATION); }
    } finally {
      setIgnoredLoading(false);
      setIgnoredLoadingMore(false);
    }
  };

  // Refetch page 1 whenever a server-side filter changes.
  useEffect(() => {
    fetchInterventions(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, ivProjectUid, ivType, ivSite, ivDates, onlyAvailable, debouncedIvSearch]);

  useEffect(() => {
    fetchContributions(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, projectUid, sort, profileType, country]);

  // Loaded up front so the tab count is the real server total, not a count of
  // whatever happened to be on a loaded page.
  useEffect(() => {
    fetchIgnored(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, projectUid]);

  // The site filter lists the sites of whichever project is selected in the
  // plant-locations pane.
  useEffect(() => {
    if (!ivProjectUid || !accessToken) return;
    getUserProjectSites(accessToken, ivProjectUid)
      .then(response => {
        if (response?.statusCode === 200) setSites(response.data || []);
      })
      .catch(err => console.error('Error fetching sites:', err));
  }, [ivProjectUid, accessToken]);

  // Switching the source project invalidates the site filter and map focus.
  const changeIvProject = (uid: string) => {
    if (uid === ivProjectUid) return;
    setIvProjectUid(uid);
    setIvSite('all');
    setMapFocus(null);
  };

  const changeRightTab = (tab: string) => {
    setRightTab(tab);
    if (tab === 'ignored') fetchIgnored(1, false);
  };

  // The default server view never contains ignored donations, so only the
  // client-side filters apply here.
  const shownContributions = useMemo(() => {
    let list = contributions;
    if (matchState !== 'all') list = list.filter(c => contribMatchState(c) === matchState);
    if (donSearch) {
      const q = donSearch.toLowerCase();
      list = list.filter(c => c.donation.uid.toLowerCase().includes(q));
    }
    return list;
  }, [contributions, matchState, donSearch]);

  // Project-level stats. Planted and matched come from the server (project-wide,
  // independent of filters); matched adds this session's matches until the next
  // fetch. Open donation trees can only be summed over the loaded pages.
  const stats = useMemo(() => {
    const planted = serverStats.plantedTrees;
    const matched = serverStats.matchedTrees + sessionMatchedTrees;
    const openDon = contributions.reduce((s, c) => s + contribAvailable(c), 0);
    return { planted, matched, unmatched: Math.max(0, planted - matched), openDon };
  }, [serverStats, sessionMatchedTrees, contributions]);

  const toggleInterv = (uid: string) =>
    setSelInterv(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });
  const toggleContrib = (id: number) =>
    setSelContrib(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // The ignore flag lives in TTC, and the two list views are separate, so
  // ignoring moves a donation from one to the other. The row is dropped from the
  // view it leaves right away, and the view it joins is refetched behind that.
  const setIgnoreFlag = async (id: number, ignoreValue: boolean) => {
    if (!projectUid || !accessToken) return;
    setActionError(null);

    if (ignoreValue) {
      setContributions(prev => prev.filter(c => c.id !== id));
      setDonPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setSelContrib(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      setIgnoredList(prev => prev.filter(c => c.id !== id));
      setIgnoredPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    }

    try {
      const response = await patchTreematchContributionIgnore(accessToken, projectUid, id, ignoreValue);
      if (response?.statusCode && response.statusCode !== 200) {
        throw new Error(response?.message || 'The server rejected the change');
      }
      if (ignoreValue) fetchIgnored(1, false); else fetchContributions(1, false);
    } catch (err) {
      console.error('TreeMatch ignore update failed:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to update the donation');
      // The optimistic drop was wrong, so reload the list it was dropped from.
      if (ignoreValue) fetchContributions(1, false); else fetchIgnored(1, false);
    }
  };
  const ignore = (id: number) => setIgnoreFlag(id, true);
  const restore = (id: number) => setIgnoreFlag(id, false);

  const selIntervList = interventions.filter(i => selInterv.has(i.uid));
  const selContribList = contributions.filter(c => selContrib.has(c.id));
  const canMatch = selIntervList.length > 0 && selContribList.length > 0;
  // Coverage: do the selected plant locations hold enough trees for the selected donations?
  const selSupply = selIntervList.reduce((s, i) => s + availableTrees(i), 0);
  const selDemand = selContribList.reduce((s, c) => s + contribAvailable(c), 0);
  const matchable = Math.min(selSupply, selDemand);

  // Record the match. The request carries (donation, location) pairs only: the
  // server derives each donation's new absolute total by summing its own rows,
  // so this client can never send a stale total. It writes those totals to the
  // donation backend inside the same transaction, so either everything landed
  // or nothing did.
  const applyMatch = async (allocs: PreviewAllocation[]) => {
    if (!projectUid || !accessToken || allocs.length === 0) return;

    const byPair = new Map<string, MatchPair>();
    const byUid: Record<string, number> = {};
    allocs.forEach(a => {
      const key = `${a.contributionId}:${a.interventionUid}`;
      const existing = byPair.get(key);
      if (existing) existing.trees += a.trees;
      else byPair.set(key, { contributionId: a.contributionId, interventionUid: a.interventionUid, trees: a.trees });
      byUid[a.interventionUid] = (byUid[a.interventionUid] || 0) + a.trees;
    });
    const matches = [...byPair.values()];

    // The dialog blocks this too; this is the backstop.
    if (matches.length > MAX_MATCH_PAIRS) {
      setMatchError(`One match can carry ${fmtNum(MAX_MATCH_PAIRS)} donation-to-location links. Select fewer and record it in more than one go.`);
      return;
    }

    setMatchSubmitting(true);
    setMatchError(null);
    setActionError(null);
    try {
      const response = await postTreematchMatches(accessToken, projectUid, matches);
      const status = Number(response?.statusCode ?? 0);
      if (status !== 200 || !response?.data) {
        setMatchError(response?.message || 'Failed to record the match');
        // Nothing was written either way. A 409 means a plant location no longer
        // has that many trees free, so the left pane is what moved; anything
        // else came from the donation backend.
        if (status === 409) fetchInterventions(1, false); else fetchContributions(1, false);
        return;
      }

      // No per-location numbers come back, so the left pane is bumped locally
      // and corrected by the next fetch.
      setInterventions(prev => prev.map(i => byUid[i.uid]
        ? { ...i, matchedTrees: Math.min(i.totalTreeCount, i.matchedTrees + byUid[i.uid]) }
        : i));

      // The right pane takes the donation backend's accepted absolute totals,
      // so there is nothing to guess at.
      const applied: Record<string, number> = response.data.applied || {};
      setContributions(prev => prev.map(c => {
        const total = applied[String(c.id)];
        if (total === undefined) return c;
        return { ...c, unitsAllocated: total, available: Math.max(0, c.units - total) };
      }));

      const trees = allocs.reduce((s, a) => s + a.trees, 0);
      setSessionMatchedTrees(prev => prev + trees);
      setSelInterv(new Set());
      setSelContrib(new Set());
      setConfirmOpen(false);
      setLastAction(`Matched ${fmtTrees(trees)} trees across ${fmtNum(matches.length)} plant location link(s).`);
    } catch (err) {
      console.error('TreeMatch match failed:', err);
      setMatchError(err instanceof Error ? err.message : 'Failed to record the match');
    } finally {
      setMatchSubmitting(false);
    }
  };

  // Page actions live in the shared dashboard top bar, not a second header band.
  useTopBarActions(
    [{ label: 'Export', icon: Download, variant: 'primary' as const, onClick: () => setExportOpen(true) }],
    [],
  );

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden bg-muted/30">
      {/* Stats ribbon. The title + actions live in the shared dashboard top bar. */}
      <div className="flex-shrink-0 px-4 pt-3">
        <div className="rounded-xl border border-border bg-background grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-border overflow-hidden">
          <Stat
            icon={Sprout} label="Trees planted" value={fmtTrees(stats.planted)}
            iconClass="bg-primary/10 text-primary"
            description={crossProject
              ? `Total trees recorded across all plant locations in ${ivProjectName ?? 'the selected project'}, matched and unmatched combined.`
              : 'Total trees recorded across all plant locations in this project, matched and unmatched combined.'}
          />
          <Stat
            icon={CheckCircle2} label="Matched" value={fmtTrees(stats.matched)}
            iconClass="bg-primary/10 text-primary" valueClass="text-primary"
            description="Planted trees already claimed by a donation, across every plant location shown in this pane."
          />
          <Stat
            icon={Sprout} label="Unmatched trees" value={fmtTrees(stats.unmatched)}
            iconClass="bg-amber-500/10 text-amber-600"
            description="Planted trees not yet linked to a donation. Trees planted minus matched."
          />
          <Stat
            icon={Link2} label="Open donation trees" value={fmtTrees(stats.openDon)}
            iconClass="bg-primary/10 text-primary"
            description="Trees paid for by donors that have not yet been linked to a planted location. Sums the donations loaded so far."
          />
        </div>
      </div>

      {lastAction && (
        <div className="flex-shrink-0 px-4 pt-2">
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5">
            {lastAction}
          </div>
        </div>
      )}
      {actionError && (
        <div className="flex-shrink-0 px-4 pt-2">
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-1.5">
            {actionError}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex overflow-hidden px-4 py-3">
        {/* LEFT: plant locations */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 rounded-xl border border-border bg-background overflow-hidden">
          <div className="flex-shrink-0 px-4 pt-3.5 pb-3 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-foreground">Plant locations</h2>
                  <Badge variant="secondary" className="rounded-full px-2 text-[11px]">{fmtNum(ivPagination.total)}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Single &amp; multi-tree · synced &amp; complete</p>
              </div>
              <div className="flex items-center rounded-lg bg-muted p-0.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setLeftView('list')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    leftView === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <List size={13} /> List
                </button>
                <button
                  type="button"
                  onClick={() => setLeftView('map')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    leftView === 'map' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <MapIcon size={13} /> Map
                </button>
              </div>
            </div>
            {matchProjects.length > 1 && (
              <div className="space-y-1">
                <Select value={ivProjectUid} onValueChange={changeIvProject}>
                  <SelectTrigger className="h-9 w-full text-xs rounded-lg">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {matchProjects.map(p => (
                      <SelectItem key={p.uid} value={p.uid}>
                        {p.name}{p.uid === projectUid ? ' (this project)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {crossProject && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ArrowLeftRight size={11} className="flex-shrink-0" />
                    Cross-project: locations from {ivProjectName ?? 'another project'}, matched to this project&apos;s donations.
                  </p>
                )}
              </div>
            )}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={ivSearch} onChange={e => setIvSearch(e.target.value)} placeholder="Search HID or site" className="h-9 pl-9 text-xs rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <Select value={ivType} onValueChange={setIvType}>
                <SelectTrigger className="flex-1 h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="single">Single-tree</SelectItem>
                  <SelectItem value="multi">Multi-tree</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ivSite} onValueChange={setIvSite}>
                <SelectTrigger className="flex-1 h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sites</SelectItem>
                  {sites.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  <SelectItem value="none">Not linked to site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <PlantingDateFilter value={ivDates} onChange={setIvDates} />
            <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
              <label className="flex items-center gap-1.5"><Checkbox checked={onlyAvailable} onCheckedChange={v => setOnlyAvailable(!!v)} /> Only with available</label>
            </div>
          </div>
          {leftView === 'map' ? (
            <TreeMatchMap
              className="flex-1 min-h-0 m-3 mt-0"
              interventions={interventions}
              selected={selInterv}
              focusUid={mapFocus}
              onFocusChange={setMapFocus}
              onToggle={toggleInterv}
            />
          ) : (
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
              {notReadyCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                  <Info size={13} className="flex-shrink-0" />
                  {notReadyCount} plant location(s) not shown (still syncing or capture incomplete).
                </div>
              )}
              {ivError && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 space-y-1.5">
                  <p>{ivError}</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => fetchInterventions(1, false)}>Retry</Button>
                </div>
              )}
              {ivLoading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 size={15} className="animate-spin" /> Loading plant locations…
                </div>
              )}
              {!ivLoading && interventions.map(i => (
                <InterventionMatchCard
                  key={i.uid}
                  intervention={i}
                  checked={selInterv.has(i.uid)}
                  onToggle={toggleInterv}
                  onViewMap={(uid) => { setMapFocus(uid); setLeftView('map'); }}
                />
              ))}
              {!ivLoading && !ivError && interventions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10">No plant locations match these filters.</p>
              )}
              {!ivLoading && ivPagination.page < ivPagination.totalPages && (
                <Button
                  variant="outline" size="sm" className="w-full"
                  disabled={ivLoadingMore}
                  onClick={() => fetchInterventions(ivPagination.page + 1, true)}
                >
                  {ivLoadingMore
                    ? <><Loader2 size={13} className="animate-spin" /> Loading…</>
                    : `Load more (${fmtNum(interventions.length)} of ${fmtNum(ivPagination.total)})`}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* MIDDLE: dashed connector with live match preview */}
        <div className="relative w-9 flex-shrink-0 self-stretch">
          <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 border-l border-dashed border-border" />
          {canMatch && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1.5">
              <div key={matchable} className="relative animate-in fade-in zoom-in-75 duration-300">
                <span aria-hidden className="absolute -inset-1.5 rounded-full border-2 border-emerald-500/40 animate-pulse" />
                <span aria-hidden className="absolute -inset-3 rounded-full border border-emerald-500/20 animate-pulse [animation-delay:400ms]" />
                <div className="relative flex h-16 min-w-16 px-2 flex-col items-center justify-center rounded-full bg-emerald-950 text-white shadow-lg ring-4 ring-background">
                  <span className="text-sm font-bold leading-none tabular-nums whitespace-nowrap">{fmtTrees(matchable)}</span>
                  <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-300">trees</span>
                </div>
              </div>
              <span className={cn(
                'rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap shadow-sm ring-1 ring-border',
                selSupply >= selDemand ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
              )}>
                {selSupply === selDemand ? 'exact match' : selSupply > selDemand ? 'fits available' : `short by ${fmtTrees(selDemand - selSupply)}`}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT: donations */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 rounded-xl border border-border bg-background overflow-hidden">
          <div className="flex-shrink-0 px-4 pt-3.5 pb-3 space-y-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-foreground">Donations</h2>
                <Badge variant="secondary" className="rounded-full px-2 text-[11px]">
                  {fmtNum(rightTab === 'ignored' ? ignoredPagination.total : donPagination.total)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Paid project contributions</p>
            </div>
            <Tabs value={rightTab} onValueChange={changeRightTab}>
              <TabsList className="w-full h-9">
                <TabsTrigger value="toMatch" className="flex-1 text-xs">To match</TabsTrigger>
                <TabsTrigger value="ignored" className="flex-1 text-xs">Ignored ({fmtNum(ignoredPagination.total)})</TabsTrigger>
              </TabsList>
            </Tabs>
            {rightTab !== 'ignored' && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[130px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={donSearch} onChange={e => setDonSearch(e.target.value)} placeholder="Search donation ref" className="h-9 pl-9 text-xs rounded-lg" />
                </div>
                <Select value={sort} onValueChange={v => setSort(v as typeof sort)}>
                  <SelectTrigger className="h-9 text-xs rounded-lg w-[104px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={profileType} onValueChange={v => setProfileType(v as typeof profileType)}>
                  <SelectTrigger className="h-9 text-xs rounded-lg w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All donors</SelectItem>
                    <SelectItem value="individual">Individuals</SelectItem>
                    <SelectItem value="company">Companies</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-9 text-xs rounded-lg w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {COUNTRY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={matchState} onValueChange={v => setMatchState(v as typeof matchState)}>
                  <SelectTrigger className="h-9 text-xs rounded-lg w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All matches</SelectItem>
                    <SelectItem value="none">No trees matched</SelectItem>
                    <SelectItem value="partial">Partly matched</SelectItem>
                    <SelectItem value="complete">Fully matched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
            {rightTab === 'ignored' ? (
              <>
                {ignoredError && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 space-y-1.5">
                    <p>{ignoredError}</p>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => fetchIgnored(1, false)}>Retry</Button>
                  </div>
                )}
                {ignoredLoading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                    <Loader2 size={15} className="animate-spin" /> Loading ignored donations…
                  </div>
                )}
                {!ignoredLoading && ignoredList.map(c => (
                  <DonationCard
                    key={c.id}
                    contribution={c}
                    checked={false}
                    onToggle={toggleContrib}
                    onRestore={restore}
                  />
                ))}
                {!ignoredLoading && !ignoredError && ignoredList.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">No ignored donations.</p>
                )}
                {!ignoredLoading && ignoredPagination.page < ignoredPagination.totalPages && (
                  <Button
                    variant="outline" size="sm" className="w-full"
                    disabled={ignoredLoadingMore}
                    onClick={() => fetchIgnored(ignoredPagination.page + 1, true)}
                  >
                    {ignoredLoadingMore
                      ? <><Loader2 size={13} className="animate-spin" /> Loading…</>
                      : `Load more (${fmtNum(ignoredList.length)} of ${fmtNum(ignoredPagination.total)})`}
                  </Button>
                )}
              </>
            ) : (
              <>
                {donError && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 space-y-1.5">
                    <p>{donError}</p>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => fetchContributions(1, false)}>Retry</Button>
                  </div>
                )}
                {donLoading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                    <Loader2 size={15} className="animate-spin" /> Loading donations…
                  </div>
                )}
                {!donLoading && shownContributions.map(c => (
                  <DonationCard
                    key={c.id}
                    contribution={c}
                    checked={selContrib.has(c.id)}
                    onToggle={toggleContrib}
                    onIgnore={ignore}
                  />
                ))}
                {!donLoading && !donError && shownContributions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">Nothing here.</p>
                )}
                {!donLoading && donPagination.page < donPagination.totalPages && (
                  <Button
                    variant="outline" size="sm" className="w-full"
                    disabled={donLoadingMore}
                    onClick={() => fetchContributions(donPagination.page + 1, true)}
                  >
                    {donLoadingMore
                      ? <><Loader2 size={13} className="animate-spin" /> Loading…</>
                      : `Load more (${fmtNum(contributions.length)} of ${fmtNum(donPagination.total)})`}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-semibold text-foreground">{selIntervList.length}</span>
            plant location{selIntervList.length === 1 ? '' : 's'}
            <ArrowLeftRight size={13} className="text-muted-foreground/70" />
            <span className="font-semibold text-foreground">{selContribList.length}</span>
            donation{selContribList.length === 1 ? '' : 's'}
          </div>

          <div className="flex-1" />

          <Button size="lg" className="rounded-lg px-5" disabled={!canMatch} onClick={() => { setMatchError(null); setConfirmOpen(true); }}>
            <Play size={14} /> {canMatch ? `Match ${fmtTrees(matchable)} trees` : 'Match trees'}
          </Button>
        </div>
      </div>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} interventions={interventions} contributions={contributions} />
      <MatchConfirmDialog
        open={confirmOpen}
        onOpenChange={(v) => { if (!matchSubmitting) { setConfirmOpen(v); if (!v) setMatchError(null); } }}
        interventions={selIntervList}
        contributions={selContribList}
        submitting={matchSubmitting}
        error={matchError}
        onConfirm={applyMatch}
      />
    </div>
  );
}
