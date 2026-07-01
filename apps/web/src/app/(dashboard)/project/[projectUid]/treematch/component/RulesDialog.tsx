'use client'

import { useRef, useState, useMemo } from 'react';
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, Ban, Wand2 } from 'lucide-react';
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
  MockRule, RuleWhen, RulePrefer, RuleOrder, MockContribution,
  MOCK_INTERVENTIONS, MOCK_CONTRIBUTIONS, MOCK_PAYOUTS, fmtNum, donorLabel,
} from './mockData';

const WHEN_OPTIONS: { v: RuleWhen; label: string }[] = [
  { v: 'all', label: 'Any donation' },
  { v: 'company', label: 'Company donations' },
  { v: 'individual', label: 'Individual donations' },
  { v: 'country', label: 'Donations from country' },
  { v: 'donor', label: 'Specific contribution' },
  { v: 'payout', label: 'Payout' },
];
const PREFER_OPTIONS: { v: RulePrefer; label: string }[] = [
  { v: 'oldest', label: 'Oldest available locations' },
  { v: 'site', label: 'Specific site' },
  { v: 'capacity', label: 'Locations with most capacity' },
];
const ORDER_OPTIONS: { v: RuleOrder; label: string }[] = [
  { v: 'oldest', label: 'Oldest donations first' },
  { v: 'largest', label: 'Largest donations first' },
];
const needsWhenValue = (w: RuleWhen) => ['country', 'donor', 'payout'].includes(w);

const whenText = (r: MockRule) => {
  switch (r.when) {
    case 'company': return 'Company donations';
    case 'individual': return 'Individual donations';
    case 'country': return `Donations from ${r.whenValue || '…'}`;
    case 'donor': return `Contribution ${r.whenValue || '…'}`;
    case 'payout': return `Payout "${r.whenValue || '…'}"`;
    default: return 'Any donation';
  }
};
const preferText = (r: MockRule) =>
  r.prefer === 'site' ? `Site ${r.preferValue || '…'}`
    : r.prefer === 'capacity' ? 'locations with most capacity'
      : 'oldest available locations';
const orderText = (r: MockRule) => (r.order === 'oldest' ? 'oldest first' : 'largest first');

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rules: MockRule[];
  onRulesChange: (rules: MockRule[]) => void;
  ignored: MockContribution[];
  onRestore: (uid: string) => void;
  onRunAuto: () => void;
}

export function RulesDialog({ open, onOpenChange, rules, onRulesChange, ignored, onRestore, onRunAuto }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const idc = useRef(0);

  const sites = useMemo(() => Array.from(new Set(MOCK_INTERVENTIONS.map(i => i.siteName).filter(Boolean))), []);
  const countries = useMemo(() => Array.from(new Set(MOCK_CONTRIBUTIONS.map(c => c.country))), []);
  const contributionRefs = useMemo(() => MOCK_CONTRIBUTIONS.map(c => c.uid), []);
  const payouts = useMemo(() => MOCK_PAYOUTS.filter(p => p.status === 'paid').map(p => p.label), []);
  const whenValueOptions = (w: RuleWhen): string[] =>
    w === 'country' ? countries : w === 'donor' ? contributionRefs : w === 'payout' ? payouts : [];

  const update = (id: string, patch: Partial<MockRule>) =>
    onRulesChange(rules.map(r => (r.id === id ? { ...r, ...patch } : r)));
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= rules.length) return;
    const next = [...rules];
    [next[idx], next[j]] = [next[j], next[idx]];
    onRulesChange(next);
  };
  const remove = (id: string) => {
    onRulesChange(rules.filter(r => r.id !== id));
    if (editingId === id) setEditingId(null);
  };
  const add = () => {
    const id = `r_new_${++idc.current}`;
    onRulesChange([...rules, { id, enabled: true, when: 'all', prefer: 'oldest', order: 'oldest' }]);
    setEditingId(id);
  };
  const changeWhen = (r: MockRule, v: RuleWhen) =>
    update(r.id, { when: v, whenValue: needsWhenValue(v) ? whenValueOptions(v)[0] : undefined });
  const changePrefer = (r: MockRule, v: RulePrefer) =>
    update(r.id, { prefer: v, preferValue: v === 'site' ? sites[0] : undefined });

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
              <div key={r.id} className="rounded-lg border border-border bg-card p-3">
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

                    {editingId === r.id && (
                      <div className="mt-3 rounded-md bg-muted/40 p-3 grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">When</Label>
                          <Select value={r.when} onValueChange={v => changeWhen(r, v as RuleWhen)}>
                            <SelectTrigger size="sm" className="text-xs w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>{WHEN_OPTIONS.map(o => <SelectItem key={o.v} value={o.v} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
                          </Select>
                          {needsWhenValue(r.when) && (
                            <Select value={r.whenValue || ''} onValueChange={v => update(r.id, { whenValue: v })}>
                              <SelectTrigger size="sm" className="text-xs w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
                              <SelectContent>{whenValueOptions(r.when).map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Prefer</Label>
                          <Select value={r.prefer} onValueChange={v => changePrefer(r, v as RulePrefer)}>
                            <SelectTrigger size="sm" className="text-xs w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>{PREFER_OPTIONS.map(o => <SelectItem key={o.v} value={o.v} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
                          </Select>
                          {r.prefer === 'site' && (
                            <Select value={r.preferValue || ''} onValueChange={v => update(r.id, { preferValue: v })}>
                              <SelectTrigger size="sm" className="text-xs w-full"><SelectValue placeholder="Select site…" /></SelectTrigger>
                              <SelectContent>{sites.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Order donations</Label>
                          <Select value={r.order} onValueChange={v => update(r.id, { order: v as RuleOrder })}>
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

                  <Switch checked={r.enabled} onCheckedChange={v => update(r.id, { enabled: v })} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(editingId === r.id ? null : r.id)}>
                    <Pencil size={13} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => remove(r.id)}>
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
              <div key={c.uid} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <Ban size={15} className="text-rose-500" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">{donorLabel(c.donor)}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmtNum(c.units)} trees · {c.ignoreReason || 'No reason given'}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onRestore(c.uid)}>Restore</Button>
              </div>
            ))}
            <Separator className="my-1" />
            <p className="text-[11px] text-muted-foreground">
              Ignored donations are excluded from auto-matching and the To-match list. Priority <b>never</b> donations are ignored automatically.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <p className="text-[11px] text-muted-foreground mr-auto self-center">{enabledCount} of {rules.length} rules enabled · default always applies last</p>
          <Button onClick={onRunAuto}><Wand2 size={14} /> Run auto-match</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
