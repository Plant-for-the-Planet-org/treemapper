'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import {
  Link2, SlidersHorizontal, Download, Search, List, Map as MapIcon,
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
  getTreematchInterventions, getTreematchContributions, putTreematchAllocations,
  getTreematchRules, putTreematchRules, postTreematchAutomatch,
  patchTreematchContributionIgnore, getUserProjectSites,
} from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useTopBarActions } from '@/component/header/TopBarActions';
import { useTreematchStore } from '@/stores/treematchStore';

import { PlantingDateFilter } from './component/PlantingDateFilter';
import { InterventionMatchCard } from './component/InterventionMatchCard';
import { TreeMatchMap } from './component/TreeMatchMap';
import { DonationCard } from './component/DonationCard';
import { RulesDialog } from './component/RulesDialog';
import { ExportDialog } from './component/ExportDialog';
import { MatchConfirmDialog, PreviewAllocation } from './component/MatchConfirmDialog';
import {
  TreeMatchIntervention, Contribution, TreeMatchPagination,
  TreeMatchRule, TreeMatchRuleItem, AutomatchResult,
  ruleFromItem, ruleToPayload, COUNTRY_OPTIONS,
  fmtNum, contribMatchState, contribAvailable, availableTrees,
} from './component/types';

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
  const router = useRouter();
  const { projectUid } = useParams<{ projectUid: string }>();
  const { accessToken } = useToken();
  // TreeMatch on/off is managed in Settings > ForestCloud (shared store).
  const enabled = useTreematchStore(s => s.enabled);

  // Plant locations can come from any project where the user is owner or
  // admin (the treematch endpoint authorizes per project uid), so matches can
  // span projects of the same owner. Donations always belong to the current
  // project.
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

  // Auto-match rules: server-persisted per project. `savedRules` is the last
  // server truth; the dialog edits `rules` and Save/Run writes them back
  // (rules get fresh uids on every save, so the response replaces both).
  const [rules, setRules] = useState<TreeMatchRule[]>([]);
  const [savedRules, setSavedRules] = useState<TreeMatchRule[]>([]);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);

  const [selInterv, setSelInterv] = useState<Set<string>>(new Set());
  const [selContrib, setSelContrib] = useState<Set<number>>(new Set());

  // Left-pane filters (all applied server-side)
  const [leftView, setLeftView] = useState<'list' | 'map'>('list');
  // Location whose detail card is open on the map (marker click or "View on map").
  const [mapFocus, setMapFocus] = useState<string | null>(null);
  const [ivType, setIvType] = useState('all');
  const [ivSite, setIvSite] = useState('all'); // 'all' | 'none' | site id
  const [ivVisibility, setIvVisibility] = useState<'all' | 'public' | 'private'>('all');
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
  const [rulesOpen, setRulesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [matchSubmitting, setMatchSubmitting] = useState(false);
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
        visibility: ivVisibility !== 'all' ? ivVisibility : undefined,
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
        // Fresh stats come from the match ledger and already include
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

  // Refetch page 1 whenever a server-side filter changes.
  useEffect(() => {
    if (enabled) fetchInterventions(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, accessToken, ivProjectUid, ivType, ivSite, ivVisibility, ivDates, onlyAvailable, debouncedIvSearch]);

  useEffect(() => {
    if (enabled) fetchContributions(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, accessToken, projectUid, sort, profileType, country]);

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

  // Load the project's auto-match rules once per project.
  useEffect(() => {
    if (!enabled || !projectUid || !accessToken) return;
    getTreematchRules(accessToken, projectUid)
      .then(response => {
        if (response?.statusCode === 200 && response.data) {
          const items: TreeMatchRuleItem[] = response.data.items || [];
          const fresh = items.map(ruleFromItem);
          setRules(fresh);
          setSavedRules(fresh);
        }
      })
      .catch(err => console.error('Error fetching TreeMatch rules:', err));
  }, [enabled, projectUid, accessToken]);

  const rulesDirty = useMemo(
    () => JSON.stringify(rules.map(ruleToPayload)) !== JSON.stringify(savedRules.map(ruleToPayload)),
    [rules, savedRules],
  );

  // Full-list replace; the server echoes the saved list (with fresh uids),
  // which becomes the new local truth.
  const saveRules = async (): Promise<boolean> => {
    if (!projectUid || !accessToken) return false;
    setRulesSaving(true);
    setActionError(null);
    try {
      const response = await putTreematchRules(accessToken, projectUid, rules.map(ruleToPayload));
      if (response?.statusCode !== 200 || !response.data) {
        throw new Error(response?.message || 'Failed to save the rules');
      }
      const items: TreeMatchRuleItem[] = response.data.items || [];
      const fresh = items.map(ruleFromItem);
      setRules(fresh);
      setSavedRules(fresh);
      return true;
    } catch (err) {
      console.error('TreeMatch rules save failed:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to save the rules');
      return false;
    } finally {
      setRulesSaving(false);
    }
  };

  // Switching the source project invalidates the site filter and map focus.
  const changeIvProject = (uid: string) => {
    if (uid === ivProjectUid) return;
    setIvProjectUid(uid);
    setIvSite('all');
    setMapFocus(null);
  };

  const shownContributions = useMemo(() => {
    let list = contributions.filter(c => {
      if (c.ignore) return rightTab === 'ignored';
      return rightTab !== 'ignored';
    });
    if (rightTab !== 'ignored') {
      if (matchState !== 'all') list = list.filter(c => contribMatchState(c) === matchState);
      if (donSearch) { const q = donSearch.toLowerCase(); list = list.filter(c => c.donation.uid.toLowerCase().includes(q)); }
    }
    return list;
  }, [contributions, rightTab, matchState, donSearch]);

  const ignoredList = useMemo(() => contributions.filter(c => c.ignore), [contributions]);

  // Choices for the rules editor's "specific donation" dropdown (loaded pages
  // only; there is no ref search endpoint yet).
  const donationRefs = useMemo(
    () => [...new Set(contributions.map(c => c.donation.uid))],
    [contributions],
  );

  // Project-level stats. Planted comes from the server (project-wide,
  // independent of filters); matched adds this session's matches to the server
  // total. Open donation trees can only be summed over the loaded pages.
  const stats = useMemo(() => {
    const planted = serverStats.plantedTrees;
    const matched = serverStats.matchedTrees + sessionMatchedTrees;
    const openDon = contributions.filter(c => !c.ignore).reduce((s, c) => s + contribAvailable(c), 0);
    return { planted, matched, unmatched: Math.max(0, planted - matched), openDon };
  }, [serverStats, sessionMatchedTrees, contributions]);

  const toggleInterv = (uid: string) =>
    setSelInterv(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });
  const toggleContrib = (id: number) =>
    setSelContrib(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Ignore/restore persist on the server's contribution mirror; the UI flips
  // optimistically and reverts if the write fails.
  const setIgnoreFlag = (id: number, ignoreValue: boolean) => {
    const prior = contributions.find(c => c.id === id);
    setContributions(prev => prev.map(c => c.id === id
      ? (ignoreValue
          ? { ...c, ignore: true, ignoreReason: c.ignoreReason || 'Ignored by user' }
          : { ...c, ignore: false, ignoreReason: undefined })
      : c));
    if (ignoreValue) setSelContrib(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (!projectUid || !accessToken) return;
    patchTreematchContributionIgnore(accessToken, projectUid, id, ignoreValue)
      .then(response => {
        if (response?.statusCode && response.statusCode !== 200) {
          throw new Error(response?.message || 'The server rejected the change');
        }
      })
      .catch(err => {
        console.error('TreeMatch ignore update failed:', err);
        setContributions(prev => prev.map(c => c.id === id
          ? { ...c, ignore: prior?.ignore ?? false, ignoreReason: prior?.ignoreReason }
          : c));
        setActionError(err instanceof Error ? err.message : 'Failed to update the donation');
      });
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

  // Record the match: persist the per-location breakdown in the server's
  // match ledger, which then writes the new absolute allocated totals to the
  // donation backend (transactional batch), then mirror the result locally.
  const applyMatch = async (allocs: PreviewAllocation[]) => {
    if (!projectUid || !accessToken || allocs.length === 0) return;

    const byHid: Record<string, number> = {};
    const byContribution: Record<number, number> = {};
    // Per (contribution, location) deltas for the server ledger.
    const byPair: Record<string, { contributionId: number; interventionUid: string; trees: number }> = {};
    allocs.forEach(a => {
      byHid[a.interventionHid] = (byHid[a.interventionHid] || 0) + a.trees;
      byContribution[a.contributionId] = (byContribution[a.contributionId] || 0) + a.trees;
      const key = `${a.contributionId}:${a.interventionUid}`;
      byPair[key] = byPair[key]
        ? { ...byPair[key], trees: byPair[key].trees + a.trees }
        : { contributionId: a.contributionId, interventionUid: a.interventionUid, trees: a.trees };
    });
    const matches = Object.values(byPair);

    const allocations = Object.entries(byContribution).map(([id, added]) => {
      const c = contributions.find(x => x.id === Number(id));
      const current = c?.unitsAllocated ?? 0;
      const cap = c?.units ?? current + added;
      return { id: Number(id), allocatedTrees: Math.min(cap, current + added) };
    });

    setMatchSubmitting(true);
    setActionError(null);
    try {
      const response = await putTreematchAllocations(accessToken, projectUid, allocations, matches);
      if (response?.statusCode && response.statusCode !== 200) {
        throw new Error(response?.message || 'The donation backend rejected the match');
      }

      setInterventions(prev => prev.map(i => byHid[i.hid] ? { ...i, matchedTrees: Math.min(i.totalTreeCount, i.matchedTrees + byHid[i.hid]) } : i));
      setContributions(prev => prev.map(c => {
        if (!byContribution[c.id]) return c;
        // `available` mirrors units - unitsAllocated, the way the server sends it.
        const unitsAllocated = Math.min(c.units, c.unitsAllocated + byContribution[c.id]);
        return { ...c, unitsAllocated, available: c.units - unitsAllocated };
      }));
      const trees = allocs.reduce((s, a) => s + a.trees, 0);
      setSessionMatchedTrees(prev => prev + trees);
      setSelInterv(new Set());
      setSelContrib(new Set());
      setConfirmOpen(false);
      setLastAction(`Matched ${fmtNum(trees)} trees in ${allocs.length} allocation(s) and synced the totals to the donation backend.`);
    } catch (err) {
      console.error('TreeMatch allocation write-back failed:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to record the match');
      // A 409 means our totals were stale (someone else matched in between);
      // refetching brings the pane back in line so a retry can succeed.
      fetchContributions(1, false);
    } finally {
      setMatchSubmitting(false);
    }
  };

  // Run the auto-match engine: save unsaved rule edits first (the engine
  // reads rules from the server), then run and refetch both panes -- the
  // ledger and TTC totals are the truth after a run.
  const runAuto = async () => {
    if (!projectUid || !accessToken || autoRunning) return;
    setAutoRunning(true);
    setActionError(null);
    try {
      if (rulesDirty) {
        const saved = await saveRules();
        if (!saved) return;
      }
      const response = await postTreematchAutomatch(accessToken, projectUid);
      if (response?.statusCode !== 200 || !response.data) {
        throw new Error(response?.message || 'Auto-match failed');
      }
      const result: AutomatchResult = response.data;
      setRulesOpen(false);
      setLastAction(
        result.matchedTrees > 0
          ? `Auto-match: ${fmtNum(result.matchedTrees)} trees across ${fmtNum(result.contributionsMatched)} donation(s) into ${fmtNum(result.locationsFilled)} plant location(s).`
            + (result.truncated ? ' Not every donation was scanned; run again to match more.' : '')
          : 'Auto-match: nothing left to match with the current rules.',
      );
      fetchInterventions(1, false);
      fetchContributions(1, false);
    } catch (err) {
      console.error('TreeMatch auto-match failed:', err);
      setActionError(err instanceof Error ? err.message : 'Auto-match failed');
      // A 409 means another run was in flight or the data moved mid-run;
      // refetching brings the pane back in line so a re-run can succeed.
      fetchContributions(1, false);
    } finally {
      setAutoRunning(false);
    }
  };

  // Page actions live in the shared dashboard top bar, not a second header band.
  useTopBarActions(
    enabled
      ? [
          { label: 'Rules', icon: SlidersHorizontal, variant: 'outline' as const, onClick: () => setRulesOpen(true) },
          { label: 'Export', icon: Download, variant: 'primary' as const, onClick: () => setExportOpen(true) },
        ]
      : [],
    [enabled],
  );

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden bg-muted/30">
      {/* Stats ribbon. The title + actions live in the shared dashboard top bar. */}
      {enabled && (
        <div className="flex-shrink-0 px-4 pt-3">
          <div className="rounded-xl border border-border bg-background grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-border overflow-hidden">
            <Stat
              icon={Sprout} label="Trees planted" value={fmtNum(stats.planted)}
              iconClass="bg-primary/10 text-primary"
              description={crossProject
                ? `Total trees recorded across all plant locations in ${ivProjectName ?? 'the selected project'}, matched and unmatched combined.`
                : 'Total trees recorded across all plant locations in this project, matched and unmatched combined.'}
            />
            <Stat
              icon={CheckCircle2} label="Matched" value={fmtNum(stats.matched)}
              iconClass="bg-primary/10 text-primary" valueClass="text-primary"
              description="Planted trees linked to a donation in this session. The project-wide total arrives with the match ledger."
            />
            <Stat
              icon={Sprout} label="Unmatched trees" value={fmtNum(stats.unmatched)}
              iconClass="bg-amber-500/10 text-amber-600"
              description="Planted trees not yet linked to a donation. Trees planted minus matched."
            />
            <Stat
              icon={Link2} label="Open donation trees" value={fmtNum(stats.openDon)}
              iconClass="bg-primary/10 text-primary"
              description="Trees paid for by donors that have not yet been linked to a planted location. Sums the donations loaded so far."
            />
          </div>
        </div>
      )}

      {lastAction && enabled && (
        <div className="flex-shrink-0 px-4 pt-2">
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5">
            {lastAction}
          </div>
        </div>
      )}
      {actionError && enabled && (
        <div className="flex-shrink-0 px-4 pt-2">
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-1.5">
            {actionError}
          </div>
        </div>
      )}

      {!enabled ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <Link2 size={30} className="mx-auto text-muted-foreground/40" />
            <h3 className="mt-3 text-lg font-semibold text-foreground">TreeMatch is off for this project</h3>
            <p className="mt-1 text-sm text-muted-foreground">Turn it on in Settings › ForestCloud to link plant locations with donations.</p>
            <Button className="mt-4" onClick={() => router.push(`/project/${projectUid}/settings?tab=forestcloud`)}>Open ForestCloud settings</Button>
          </div>
        </div>
      ) : (
        <>
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
                  <Select value={ivVisibility} onValueChange={v => setIvVisibility(v as typeof ivVisibility)}>
                    <SelectTrigger className="flex-1 h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Public and private</SelectItem>
                      <SelectItem value="public">Public only</SelectItem>
                      <SelectItem value="private">Private only</SelectItem>
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
                      <span className="text-sm font-bold leading-none tabular-nums whitespace-nowrap">{fmtNum(matchable)}</span>
                      <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-300">trees</span>
                    </div>
                  </div>
                  <span className={cn(
                    'rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap shadow-sm ring-1 ring-border',
                    selSupply >= selDemand ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
                  )}>
                    {selSupply === selDemand ? 'exact match' : selSupply > selDemand ? 'fits available' : `short by ${fmtNum(selDemand - selSupply)}`}
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
                      {rightTab === 'ignored' ? ignoredList.length : fmtNum(donPagination.total)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Paid project contributions</p>
                </div>
                <Tabs value={rightTab} onValueChange={setRightTab}>
                  <TabsList className="w-full h-9">
                    <TabsTrigger value="toMatch" className="flex-1 text-xs">To match</TabsTrigger>
                    <TabsTrigger value="ignored" className="flex-1 text-xs">Ignored ({ignoredList.length})</TabsTrigger>
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
                    onRestore={restore}
                  />
                ))}
                {!donLoading && !donError && shownContributions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">Nothing here.</p>
                )}
                {!donLoading && rightTab === 'toMatch' && donPagination.page < donPagination.totalPages && (
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

              <Button size="lg" className="rounded-lg px-5" disabled={!canMatch} onClick={() => setConfirmOpen(true)}>
                <Play size={14} /> {canMatch ? `Match ${fmtNum(matchable)} trees` : 'Match trees'}
              </Button>
            </div>
          </div>
        </>
      )}

      <RulesDialog
        open={rulesOpen}
        onOpenChange={(v) => {
          if (rulesSaving || autoRunning) return;
          setRulesOpen(v);
          // Closing without saving reverts to the last server truth.
          if (!v && rulesDirty) setRules(savedRules);
        }}
        rules={rules}
        onRulesChange={setRules}
        sites={sites.map(s => ({ uid: s.uid, name: s.name }))}
        countries={COUNTRY_OPTIONS}
        donationRefs={donationRefs}
        ignored={ignoredList}
        onRestore={restore}
        dirty={rulesDirty}
        saving={rulesSaving}
        running={autoRunning}
        onSave={saveRules}
        onRunAuto={runAuto}
      />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} interventions={interventions} contributions={contributions} />
      <MatchConfirmDialog
        open={confirmOpen}
        onOpenChange={(v) => { if (!matchSubmitting) setConfirmOpen(v); }}
        interventions={selIntervList}
        contributions={selContribList}
        submitting={matchSubmitting}
        onConfirm={applyMatch}
      />
    </div>
  );
}
