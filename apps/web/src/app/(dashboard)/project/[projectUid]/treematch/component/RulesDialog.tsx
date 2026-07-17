'use client'

import { useRef, useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, Ban, Wand2, Save, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Contribution, TreeMatchRule, RuleWhenType, RulePreferType, RuleOrderBy,
  fmtNum, unitLabel,
} from './types';

const WHEN_OPTIONS: { v: RuleWhenType; label: string }[] = [
  { v: 'all', label: 'Any donation' },
  { v: 'company', label: 'Company donations' },
  { v: 'individual', label: 'Individual donations' },
  { v: 'country', label: 'Donations from country' },
  { v: 'donor', label: 'Specific donation' },
];
const PREFER_OPTIONS: { v: RulePreferType; label: string }[] = [
  { v: 'oldest', label: 'Oldest available locations' },
  { v: 'site', label: 'Specific site' },
  { v: 'capacity', label: 'Locations with most capacity' },
];
const ORDER_OPTIONS: { v: RuleOrderBy; label: string }[] = [
  { v: 'oldest', label: 'Oldest donations first' },
  { v: 'largest', label: 'Largest donations first' },
];
const needsWhenValue = (w: RuleWhenType) => ['country', 'donor'].includes(w);

const whenText = (r: TreeMatchRule) => {
  switch (r.whenType) {
    case 'company': return 'Company donations';
    case 'individual': return 'Individual donations';
    case 'country': return `Donations from ${r.whenValue || '…'}`;
    case 'donor': return `Donation ${r.whenValue || '…'}`;
    default: return 'Any donation';
  }
};
const preferText = (r: TreeMatchRule) =>
  r.preferType === 'site' ? `Site ${r.preferSiteName || '…'}`
    : r.preferType === 'capacity' ? 'locations with most capacity'
      : 'oldest available locations';
const orderText = (r: TreeMatchRule) => (r.orderBy === 'oldest' ? 'oldest first' : 'largest first');

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rules: TreeMatchRule[];
  onRulesChange: (rules: TreeMatchRule[]) => void;
  /** the source project's real sites, for the "specific site" preference */
  sites: { uid: string; name: string }[];
  /** fixed ISO-2 list, shared with the donations country filter */
  countries: string[];
  /** donation refs of the loaded pages (v1: no ref search endpoint) */
  donationRefs: string[];
  ignored: Contribution[];
  onRestore: (id: number) => void;
  /** unsaved edits exist; Run auto-match saves them first */
  dirty: boolean;
  saving: boolean;
  running: boolean;
  onSave: () => void;
  onRunAuto: () => void;
}

export function RulesDialog({
  open, onOpenChange, rules, onRulesChange, sites, countries, donationRefs,
  ignored, onRestore, dirty, saving, running, onSave, onRunAuto,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const idc = useRef(0);
  const busy = saving || running;

  const whenValueOptions = (w: RuleWhenType): string[] =>
    w === 'country' ? countries : w === 'donor' ? donationRefs : [];

  const update = (localId: string, patch: Partial<TreeMatchRule>) =>
    onRulesChange(rules.map(r => (r.localId === localId ? { ...r, ...patch } : r)));
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= rules.length) return;
    const next = [...rules];
    [next[idx], next[j]] = [next[j], next[idx]];
    onRulesChange(next);
  };
  const remove = (localId: string) => {
    onRulesChange(rules.filter(r => r.localId !== localId));
    if (editingId === localId) setEditingId(null);
  };
  const add = () => {
    const localId = `new_${++idc.current}`;
    onRulesChange([...rules, { localId, enabled: true, whenType: 'all', preferType: 'oldest', orderBy: 'oldest' }]);
    setEditingId(localId);
  };
  const changeWhen = (r: TreeMatchRule, v: RuleWhenType) =>
    update(r.localId, { whenType: v, whenValue: needsWhenValue(v) ? whenValueOptions(v)[0] : undefined });
  const changePrefer = (r: TreeMatchRule, v: RulePreferType) =>
    update(r.localId, {
      preferType: v,
      preferSiteUid: v === 'site' ? sites[0]?.uid : undefined,
      preferSiteName: v === 'site' ? sites[0]?.name : undefined,
    });
  const changeSite = (r: TreeMatchRule, uid: string) => {
    const s = sites.find(x => x.uid === uid);
    update(r.localId, { preferSiteUid: uid, preferSiteName: s?.name });
  };

  const enabledCount = rules.filter(r => r.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Auto-match rules</DialogTitle>
          <DialogDescription>
            Rules run top to bottom. Each matches what it can, then passes the rest down.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="rules">
          <TabsList className="w-full">
            <TabsTrigger value="rules" className="flex-1">Rules</TabsTrigger>
            <TabsTrigger value="ignored" className="flex-1">Ignored ({ignored.length})</TabsTrigger>
          </TabsList>

          {/* Rules */}
          <TabsContent value="rules" className="mt-3 space-y-2 max-h-[54vh] overflow-y-auto pr-1">
            {rules.map((r, idx) => (
              <div key={r.localId} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col text-muted-foreground/60">
                    <button type="button" disabled={idx === 0} onClick={() => move(idx, -1)} className="hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronUp size={13} />
                    </button>
                    <button type="button" disabled={idx === rules.length - 1} onClick={() => move(idx, 1)} className="hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronDown size={13} />
                    </button>
                  </div>
                  <span className="mt-0.5 w-4 text-[11px] font-semibold text-muted-foreground flex-shrink-0">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm ${r.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      <span className="font-medium">{whenText(r)}</span>
                      <span className="text-muted-foreground"> {' '}→ prefer {preferText(r)} · {orderText(r)}</span>
                    </div>

                    {editingId === r.localId && (
                      <div className="mt-3 rounded-md bg-muted/40 p-3 grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">When</Label>
                          <Select value={r.whenType} onValueChange={v => changeWhen(r, v as RuleWhenType)}>
                            <SelectTrigger size="sm" className="text-xs w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>{WHEN_OPTIONS.map(o => <SelectItem key={o.v} value={o.v} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
                          </Select>
                          {needsWhenValue(r.whenType) && (
                            <Select value={r.whenValue || ''} onValueChange={v => update(r.localId, { whenValue: v })}>
                              <SelectTrigger size="sm" className="text-xs w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
                              <SelectContent>{whenValueOptions(r.whenType).map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Prefer</Label>
                          <Select value={r.preferType} onValueChange={v => changePrefer(r, v as RulePreferType)}>
                            <SelectTrigger size="sm" className="text-xs w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {PREFER_OPTIONS.map(o => (
                                <SelectItem key={o.v} value={o.v} className="text-xs" disabled={o.v === 'site' && sites.length === 0}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {r.preferType === 'site' && (
                            <Select value={r.preferSiteUid || ''} onValueChange={v => changeSite(r, v)}>
                              <SelectTrigger size="sm" className="text-xs w-full"><SelectValue placeholder="Select site…" /></SelectTrigger>
                              <SelectContent>{sites.map(s => <SelectItem key={s.uid} value={s.uid} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Order donations</Label>
                          <Select value={r.orderBy} onValueChange={v => update(r.localId, { orderBy: v as RuleOrderBy })}>
                            <SelectTrigger size="sm" className="text-xs w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>{ORDER_OPTIONS.map(o => <SelectItem key={o.v} value={o.v} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-3 flex justify-end">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingId(null)}>Done</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Switch checked={r.enabled} onCheckedChange={v => update(r.localId, { enabled: v })} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(editingId === r.localId ? null : r.localId)}>
                    <Pencil size={13} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => remove(r.localId)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}

            {/* Locked catch-all */}
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 flex items-center gap-2">
              <span className="w-4 text-center text-[11px] font-semibold text-muted-foreground flex-shrink-0">↓</span>
              <div className="text-sm text-muted-foreground min-w-0">
                <span className="font-medium text-foreground">Everything else</span> → prefer oldest available locations · oldest first
              </div>
              <Badge variant="secondary" className="ml-auto text-[10px] flex-shrink-0">default</Badge>
            </div>

            <Button variant="outline" size="sm" className="w-full mt-1" onClick={add}>
              <Plus size={14} /> Add rule
            </Button>
          </TabsContent>

          {/* Ignore list */}
          <TabsContent value="ignored" className="mt-3 space-y-2">
            {ignored.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No ignored donations.</p>
            )}
            {ignored.map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <Ban size={15} className="text-rose-500" />
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-sm font-medium text-foreground">{c.donation.uid}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmtNum(c.units)} {unitLabel(c)} · {c.ignoreReason || 'No reason given'}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onRestore(c.id)}>Restore</Button>
              </div>
            ))}
            <Separator className="my-1" />
            <p className="text-[11px] text-muted-foreground">
              Ignored donations are excluded from auto-matching and the To-match list. Priority <b>never</b> donations are ignored automatically.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <p className="text-[11px] text-muted-foreground mr-auto self-center">
            {enabledCount} of {rules.length} rules enabled · default always applies last
            {dirty ? ' · unsaved changes' : ''}
          </p>
          <Button variant="outline" disabled={!dirty || busy} onClick={onSave}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes
          </Button>
          <Button disabled={busy} onClick={onRunAuto}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {running ? 'Matching…' : 'Run auto-match'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
