'use client'

import React, { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Link2, SlidersHorizontal, Download, Search, List, Map as MapIcon,
  CheckCircle2, Sprout, Play, EyeOff, Info, ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTopBarActions } from '@/component/header/TopBarActions';
import { useTreematchStore } from '@/stores/treematchStore';

import { InterventionMatchCard } from './component/InterventionMatchCard';
import { DonationCard } from './component/DonationCard';
import { RulesDialog } from './component/RulesDialog';
import { ExportDialog } from './component/ExportDialog';
import { MatchConfirmDialog, PreviewAllocation } from './component/MatchConfirmDialog';
import {
  MOCK_INTERVENTIONS, MOCK_CONTRIBUTIONS, MOCK_RULES,
  MockIntervention, MockContribution, MockRule, fmtNum, isPayoutPaid, donorLabel,
} from './component/mockData';

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

export default function TreeMatchPage() {
  const router = useRouter();
  const { projectUid } = useParams<{ projectUid: string }>();
  // TreeMatch on/off is managed in Settings > ForestCloud (shared store).
  const enabled = useTreematchStore(s => s.enabled);
  const [autoMatch, setAutoMatch] = useState(false);

  const [interventions, setInterventions] = useState<MockIntervention[]>(MOCK_INTERVENTIONS);
  const [contributions, setContributions] = useState<MockContribution[]>(MOCK_CONTRIBUTIONS);
  const [rules, setRules] = useState<MockRule[]>(MOCK_RULES);

  const [selInterv, setSelInterv] = useState<Set<string>>(new Set());
  const [selContrib, setSelContrib] = useState<Set<string>>(new Set());

  // Left-pane filters
  const [leftView, setLeftView] = useState<'list' | 'map'>('list');
  const [ivType, setIvType] = useState('all');
  const [ivSite, setIvSite] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [includeBlocked, setIncludeBlocked] = useState(false);
  const [crossProject, setCrossProject] = useState(false);
  const [ivSearch, setIvSearch] = useState('');

  // Right-pane filters
  const [rightTab, setRightTab] = useState('toMatch');
  const [sort, setSort] = useState('oldest');
  const [payout, setPayout] = useState('All');
  const [donSearch, setDonSearch] = useState('');
  const [paidWindowOnly, setPaidWindowOnly] = useState(true);

  // Match controls
  const [matchType, setMatchType] = useState<'full' | 'partial'>('full');
  const [maxTree, setMaxTree] = useState('');
  const [allowPartial, setAllowPartial] = useState(true);
  const [privateMatch, setPrivateMatch] = useState(false);

  // Dialogs + feedback
  const [rulesOpen, setRulesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const sites = useMemo(() => {
    const named = Array.from(new Set(MOCK_INTERVENTIONS.map(i => i.siteName).filter(Boolean)));
    const hasUnlinked = MOCK_INTERVENTIONS.some(i => !i.siteName);
    return ['all', ...named, ...(hasUnlinked ? ['none'] : [])];
  }, []);
  const payouts = useMemo(() => ['All', ...Array.from(new Set(MOCK_CONTRIBUTIONS.map(c => c.payout)))], []);

  const shownInterventions = useMemo(() => {
    return interventions.filter(i => {
      const avail = i.totalTrees - i.matchedTrees;
      if (i.notReady) return false; // must be fully synced + capture complete
      if (ivType === 'single' && i.type !== 'single-tree-registration') return false;
      if (ivType === 'multi' && i.type !== 'multi-tree-registration') return false;
      if (ivSite === 'none') { if (i.siteName) return false; }
      else if (ivSite !== 'all' && i.siteName !== ivSite) return false;
      if (onlyAvailable && avail <= 0) return false;
      if (i.blocked && !includeBlocked) return false;
      if (i.crossProjectName && !crossProject) return false;
      if (ivSearch && !`${i.hid} ${i.siteName}`.toLowerCase().includes(ivSearch.toLowerCase())) return false;
      return true;
    });
  }, [interventions, ivType, ivSite, onlyAvailable, includeBlocked, crossProject, ivSearch]);
  const notReadyCount = useMemo(() => interventions.filter(i => i.notReady).length, [interventions]);

  const shownContributions = useMemo(() => {
    let list = contributions.filter(c => {
      if (c.ignored) return rightTab === 'ignored';
      return rightTab !== 'ignored';
    });
    if (rightTab !== 'ignored') {
      if (payout !== 'All') list = list.filter(c => c.payout === payout);
      if (donSearch) { const q = donSearch.toLowerCase(); list = list.filter(c => `${donorLabel(c.donor)} ${c.uid}`.toLowerCase().includes(q)); }
    }
    if (rightTab === 'toMatch') {
      list = list.filter(c => isPayoutPaid(c.payout)); // only money the RO has received
    }
    if (rightTab === 'toMatch' && paidWindowOnly) {
      const cutoff = Date.now() - 90 * 864e5; // 90 days
      list = list.filter(c => new Date(c.date).getTime() <= cutoff);
    }
    if (rightTab === 'toMatch') {
      list = [...list].sort((a, b) =>
        sort === 'oldest'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : (b.units - b.allocated) - (a.units - a.allocated),
      );
    }
    return list;
  }, [contributions, rightTab, payout, donSearch, sort, paidWindowOnly]);

  const ignoredList = useMemo(() => contributions.filter(c => c.ignored), [contributions]);
  const hiddenByWindow = useMemo(() => {
    if (!paidWindowOnly) return 0;
    const cutoff = Date.now() - 90 * 864e5;
    return contributions.filter(c => !c.ignored && isPayoutPaid(c.payout) && new Date(c.date).getTime() > cutoff).length;
  }, [contributions, paidWindowOnly]);
  const hiddenByPayout = useMemo(
    () => contributions.filter(c => !c.ignored && !isPayoutPaid(c.payout)).length,
    [contributions],
  );

  // Project-level stats
  const stats = useMemo(() => {
    const planted = interventions.reduce((s, i) => s + i.totalTrees, 0);
    const matched = interventions.reduce((s, i) => s + i.matchedTrees, 0);
    const openDon = contributions.filter(c => !c.ignored).reduce((s, c) => s + Math.max(0, c.units - c.allocated), 0);
    return { planted, matched, unmatched: planted - matched, openDon };
  }, [interventions, contributions]);

  const toggleInterv = (uid: string) =>
    setSelInterv(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });
  const toggleContrib = (uid: string) =>
    setSelContrib(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });

  const ignore = (uid: string) => {
    setContributions(prev => prev.map(c => c.uid === uid ? { ...c, ignored: true, ignoreReason: c.ignoreReason || 'Ignored by user' } : c));
    setSelContrib(prev => { const n = new Set(prev); n.delete(uid); return n; });
  };
  const restore = (uid: string) =>
    setContributions(prev => prev.map(c => c.uid === uid ? { ...c, ignored: false } : c));

  const selIntervList = interventions.filter(i => selInterv.has(i.uid));
  const selContribList = contributions.filter(c => selContrib.has(c.uid));
  const canMatch = selIntervList.length > 0 && selContribList.length > 0;
  // Coverage: do the selected plant locations hold enough trees for the selected donations?
  const selSupply = selIntervList.reduce((s, i) => s + Math.max(0, i.totalTrees - i.matchedTrees), 0);
  const selDemand = selContribList.reduce((s, c) => s + Math.max(0, c.units - c.allocated), 0);
  const matchable = Math.min(selSupply, selDemand);

  const applyMatch = (allocs: PreviewAllocation[]) => {
    const byHid: Record<string, number> = {};
    const byContribution: Record<string, number> = {};
    allocs.forEach(a => {
      byHid[a.interventionHid] = (byHid[a.interventionHid] || 0) + a.trees;
      byContribution[a.contributionUid] = (byContribution[a.contributionUid] || 0) + a.trees;
    });
    setInterventions(prev => prev.map(i => byHid[i.hid] ? { ...i, matchedTrees: Math.min(i.totalTrees, i.matchedTrees + byHid[i.hid]) } : i));
    setContributions(prev => prev.map(c => byContribution[c.uid] ? { ...c, allocated: Math.min(c.units, c.allocated + byContribution[c.uid]) } : c));
    setSelInterv(new Set());
    setSelContrib(new Set());
    setConfirmOpen(false);
    const trees = allocs.reduce((s, a) => s + a.trees, 0);
    setLastAction(`Matched ${fmtNum(trees)} trees in ${allocs.length} allocation(s).`);
  };

  const runAuto = () => {
    const n = rules.filter(r => r.enabled).length;
    setLastAction(`Auto-match queued (dummy): ${n} rule(s) + the default. A background job would fill eligible plant locations, then sync matches to treecounter.`);
  };

  // Page actions live in the shared dashboard top bar, not a second header band.
  useTopBarActions(
    enabled
      ? [
          {
            label: 'Auto-match',
            onClick: () => setAutoMatch(v => !v),
            node: (
              <label className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground cursor-pointer whitespace-nowrap">
                Auto-match
                <Switch checked={autoMatch} onCheckedChange={setAutoMatch} />
              </label>
            ),
          },
          { label: 'Rules', icon: SlidersHorizontal, variant: 'outline' as const, onClick: () => setRulesOpen(true) },
          { label: 'Export', icon: Download, variant: 'primary' as const, onClick: () => setExportOpen(true) },
        ]
      : [],
    [enabled, autoMatch, rules],
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
              description="Total trees recorded across all plant locations in this project, matched and unmatched combined."
            />
            <Stat
              icon={CheckCircle2} label="Matched" value={fmtNum(stats.matched)}
              iconClass="bg-primary/10 text-primary" valueClass="text-primary"
              description="Planted trees already linked to a donation."
            />
            <Stat
              icon={Sprout} label="Unmatched trees" value={fmtNum(stats.unmatched)}
              iconClass="bg-amber-500/10 text-amber-600"
              description="Planted trees not yet linked to a donation. Trees planted minus matched."
            />
            <Stat
              icon={Link2} label="Open donation trees" value={fmtNum(stats.openDon)}
              iconClass="bg-primary/10 text-primary"
              description="Trees paid for by donors that have not yet been linked to a planted location."
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
                      <Badge variant="secondary" className="rounded-full px-2 text-[11px]">{shownInterventions.length}</Badge>
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
                      {sites.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All sites' : s === 'none' ? 'Not linked to site' : s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                  <label className="flex items-center gap-1.5"><Checkbox checked={onlyAvailable} onCheckedChange={v => setOnlyAvailable(!!v)} /> Only with available</label>
                  <label className="flex items-center gap-1.5"><Checkbox checked={includeBlocked} onCheckedChange={v => setIncludeBlocked(!!v)} /> Show blocked</label>
                  <label className="flex items-center gap-1.5"><Checkbox checked={crossProject} onCheckedChange={v => setCrossProject(!!v)} /> Cross-project (same RO)</label>
                </div>
              </div>
              {leftView === 'map' ? (
                <div className="flex-1 m-3 mt-0 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapIcon size={22} className="mx-auto opacity-50" />
                    <p className="mt-2 text-xs">Map view is not part of this prototype.</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
                  {notReadyCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                      <Info size={13} className="flex-shrink-0" />
                      {notReadyCount} plant location(s) not shown (still syncing or capture incomplete).
                    </div>
                  )}
                  {shownInterventions.map(i => (
                    <InterventionMatchCard key={i.uid} intervention={i} checked={selInterv.has(i.uid)} onToggle={toggleInterv} />
                  ))}
                  {shownInterventions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-10">No plant locations match these filters.</p>
                  )}
                </div>
              )}
            </div>

            {/* MIDDLE: dashed connector with live match preview */}
            <div className="relative w-9 flex-shrink-0 self-stretch">
              <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 border-l border-dashed border-border" />
              {canMatch && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1">
                  <div className="rounded-md bg-emerald-950 text-white text-xs font-semibold px-2.5 py-1 whitespace-nowrap shadow-md">
                    {fmtNum(matchable)} trees
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold whitespace-nowrap',
                    selSupply >= selDemand ? 'text-emerald-700' : 'text-amber-700',
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
                    <Badge variant="secondary" className="rounded-full px-2 text-[11px]">{shownContributions.length}</Badge>
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
                      <Input value={donSearch} onChange={e => setDonSearch(e.target.value)} placeholder="Search donor or ref" className="h-9 pl-9 text-xs rounded-lg" />
                    </div>
                    {rightTab === 'toMatch' && (
                      <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className="h-9 text-xs rounded-lg w-[104px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oldest">Oldest</SelectItem>
                          <SelectItem value="largest">Largest</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Select value={payout} onValueChange={setPayout}>
                      <SelectTrigger className="h-9 text-xs rounded-lg w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {payouts.map(p => <SelectItem key={p} value={p}>{p === 'All' ? 'All payouts' : isPayoutPaid(p) ? p : `${p} · pending`}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {rightTab === 'toMatch' && (
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Checkbox checked={paidWindowOnly} onCheckedChange={v => setPaidWindowOnly(!!v)} />
                    Donations older than 90 days
                  </label>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
                {rightTab === 'toMatch' && payout === 'All' && hiddenByPayout > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                    <Info size={13} className="flex-shrink-0" />
                    {hiddenByPayout} donation(s) hidden: payout not yet paid out to you.
                  </div>
                )}
                {rightTab === 'toMatch' && payout === 'All' && hiddenByWindow > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                    <Info size={13} className="flex-shrink-0" />
                    {hiddenByWindow} donation(s) newer than 90 days hidden.
                  </div>
                )}
                {shownContributions.map(c => (
                  <DonationCard
                    key={c.uid}
                    contribution={c}
                    checked={selContrib.has(c.uid)}
                    onToggle={toggleContrib}
                    onIgnore={ignore}
                    onRestore={restore}
                  />
                ))}
                {shownContributions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">Nothing here.</p>
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

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={matchType} onValueChange={v => setMatchType(v as typeof matchType)}>
                  <SelectTrigger className="h-9 text-xs rounded-lg w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full donation</SelectItem>
                    <SelectItem value="partial">Partial (cap)</SelectItem>
                  </SelectContent>
                </Select>
                {selIntervList.length > 1 && (
                  <span className="text-[11px] text-muted-foreground">· spread across {selIntervList.length} locations</span>
                )}
              </div>

              {matchType === 'partial' && (
                <Input
                  value={maxTree}
                  onChange={e => setMaxTree(e.target.value.replace(/\D/g, ''))}
                  placeholder="max trees / donation"
                  className="h-9 w-[140px] text-xs rounded-lg"
                />
              )}

              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Checkbox checked={allowPartial} onCheckedChange={v => setAllowPartial(!!v)} /> Allow partial
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={privateMatch} onCheckedChange={setPrivateMatch} />
                <span className="flex items-center gap-1"><EyeOff size={12} /> Match privately</span>
              </label>

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
        onOpenChange={setRulesOpen}
        rules={rules}
        onRulesChange={setRules}
        ignored={ignoredList}
        onRestore={restore}
        onRunAuto={() => { setRulesOpen(false); runAuto(); }}
      />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} interventions={interventions} contributions={contributions} />
      <MatchConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        interventions={selIntervList}
        contributions={selContribList}
        matchType={matchType}
        maxTreeCount={maxTree ? parseInt(maxTree, 10) : null}
        allowPartial={allowPartial}
        privateMatch={privateMatch}
        onConfirm={applyMatch}
      />
    </div>
  );
}
