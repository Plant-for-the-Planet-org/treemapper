'use client'

import React, { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Link2, Wand2, Settings2, FileSpreadsheet, Search,
  TreePine, CheckCircle2, Coins, Sprout, Play, EyeOff, Info,
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
  icon: Icon, label, value, tone, description,
}: { icon: React.ElementType; label: string; value: string; tone?: string; description: string }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border">
    <Icon size={15} className={cn('flex-shrink-0', tone ?? 'text-muted-foreground')} />
    <div className="leading-none">
      <div className="text-sm font-semibold text-foreground">{value}</div>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info size={11} className="text-muted-foreground/70 cursor-help" />
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
          ...(autoMatch ? [{ label: 'Run auto-match', icon: Wand2, variant: 'outline' as const, onClick: runAuto, hideLabelOnMobile: true }] : []),
          { label: 'Rules', icon: Settings2, variant: 'outline' as const, onClick: () => setRulesOpen(true) },
          { label: 'Export', icon: FileSpreadsheet, variant: 'outline' as const, onClick: () => setExportOpen(true) },
        ]
      : [],
    [enabled, autoMatch, rules],
  );

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden bg-muted/30">
      {/* Stats ribbon. The title + actions live in the shared dashboard top bar. */}
      {enabled && (
        <div className="flex-shrink-0 border-b border-border bg-background px-4 py-2 flex items-center gap-2 flex-wrap">
          <Stat
            icon={Sprout} label="Trees planted" value={fmtNum(stats.planted)} tone="text-primary"
            description="Total trees recorded across all plant locations in this project, matched and unmatched combined."
          />
          <Stat
            icon={CheckCircle2} label="Matched" value={fmtNum(stats.matched)} tone="text-emerald-600"
            description="Planted trees already linked to a donation."
          />
          <Stat
            icon={TreePine} label="Unmatched trees" value={fmtNum(stats.unmatched)} tone="text-amber-600"
            description="Planted trees not yet linked to a donation. Trees planted minus matched."
          />
          <Stat
            icon={Coins} label="Open donation trees" value={fmtNum(stats.openDon)} tone="text-indigo-600"
            description="Trees paid for by donors that have not yet been linked to a planted location."
          />

          <div className="flex-1" />

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={autoMatch} onCheckedChange={setAutoMatch} />
            Auto-match
          </label>
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
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* LEFT: plant locations */}
            <div className="w-1/2 flex flex-col border-r border-border min-h-0">
              <div className="flex-shrink-0 px-3 py-2 border-b border-border bg-background/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Plant locations</h2>
                    <p className="text-[11px] text-muted-foreground">Single &amp; multi-tree, synced &amp; complete</p>
                  </div>
                  <Badge variant="secondary" className="text-[11px]">{shownInterventions.length}</Badge>
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={ivSearch} onChange={e => setIvSearch(e.target.value)} placeholder="Search HID" className="h-8 pl-8 text-xs" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={ivType} onValueChange={setIvType}>
                    <SelectTrigger size="sm" className="text-xs w-[112px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="single">Single-tree</SelectItem>
                      <SelectItem value="multi">Multi-tree</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ivSite} onValueChange={setIvSite}>
                    <SelectTrigger size="sm" className="text-xs w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sites.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All sites' : s === 'none' ? 'Not linked to site' : s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                  <label className="flex items-center gap-1.5"><Checkbox checked={onlyAvailable} onCheckedChange={v => setOnlyAvailable(!!v)} /> Only with available</label>
                  <label className="flex items-center gap-1.5"><Checkbox checked={includeBlocked} onCheckedChange={v => setIncludeBlocked(!!v)} /> Show blocked</label>
                  <label className="flex items-center gap-1.5"><Checkbox checked={crossProject} onCheckedChange={v => setCrossProject(!!v)} /> Cross-project (same RO)</label>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {notReadyCount > 0 && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-md px-2.5 py-1.5">
                    {notReadyCount} plant location(s) not shown (still syncing or capture incomplete).
                  </p>
                )}
                {shownInterventions.map(i => (
                  <InterventionMatchCard key={i.uid} intervention={i} checked={selInterv.has(i.uid)} onToggle={toggleInterv} />
                ))}
                {shownInterventions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">No plant locations match these filters.</p>
                )}
              </div>
            </div>

            {/* RIGHT: donations */}
            <div className="w-1/2 flex flex-col min-h-0">
              <div className="flex-shrink-0 px-3 py-2 border-b border-border bg-background/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Donations</h2>
                    <p className="text-[11px] text-muted-foreground">Paid project contributions</p>
                  </div>
                  <Badge variant="secondary" className="text-[11px]">{shownContributions.length}</Badge>
                </div>
                <Tabs value={rightTab} onValueChange={setRightTab}>
                  <TabsList className="h-7">
                    <TabsTrigger value="toMatch" className="text-xs px-3">To match</TabsTrigger>
                    <TabsTrigger value="ignored" className="text-xs px-3">Ignored ({ignoredList.length})</TabsTrigger>
                  </TabsList>
                </Tabs>
                {rightTab !== 'ignored' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[130px]">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input value={donSearch} onChange={e => setDonSearch(e.target.value)} placeholder="Search donor or ref" className="h-8 pl-8 text-xs" />
                    </div>
                    {rightTab === 'toMatch' && (
                      <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger size="sm" className="text-xs w-[104px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oldest">Oldest</SelectItem>
                          <SelectItem value="largest">Largest</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Select value={payout} onValueChange={setPayout}>
                      <SelectTrigger size="sm" className="text-xs w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {payouts.map(p => <SelectItem key={p} value={p}>{p === 'All' ? 'All payouts' : isPayoutPaid(p) ? p : `${p} · pending`}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {rightTab === 'toMatch' && (
                  <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Checkbox checked={paidWindowOnly} onCheckedChange={v => setPaidWindowOnly(!!v)} />
                    Donations older than 90 days
                  </label>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {rightTab === 'toMatch' && payout === 'All' && hiddenByPayout > 0 && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-md px-2.5 py-1.5">
                    {hiddenByPayout} donation(s) hidden: payout not yet paid out to you.
                  </p>
                )}
                {rightTab === 'toMatch' && payout === 'All' && hiddenByWindow > 0 && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-md px-2.5 py-1.5">
                    {hiddenByWindow} donation(s) newer than 90 days hidden.
                  </p>
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
          <div className="flex-shrink-0 border-t border-border bg-background px-4 py-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-foreground">{selIntervList.length}</span> plant location(s)
                <span>↔</span>
                <span className="font-semibold text-foreground">{selContribList.length}</span> donation(s)
                {canMatch && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span className={cn('font-medium', selSupply >= selDemand ? 'text-emerald-700' : 'text-amber-700')}>
                      {fmtNum(selSupply)} available / {fmtNum(selDemand)} needed
                      {selSupply >= selDemand ? ' — enough' : ` — short by ${fmtNum(selDemand - selSupply)}`}
                    </span>
                  </>
                )}
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={matchType} onValueChange={v => setMatchType(v as typeof matchType)}>
                  <SelectTrigger size="sm" className="text-xs w-[130px]"><SelectValue /></SelectTrigger>
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
                  className="h-8 w-[140px] text-xs"
                />
              )}

              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Checkbox checked={allowPartial} onCheckedChange={v => setAllowPartial(!!v)} /> allow partial
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Switch checked={privateMatch} onCheckedChange={setPrivateMatch} />
                <span className="flex items-center gap-1"><EyeOff size={12} /> private</span>
              </label>

              <div className="flex-1" />

              <Button disabled={!canMatch} onClick={() => setConfirmOpen(true)}>
                <Play size={14} /> Match
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
