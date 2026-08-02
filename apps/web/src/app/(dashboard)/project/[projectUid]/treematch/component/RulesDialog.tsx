'use client'

import { useRef, useState } from 'react';
import {
  Plus, ChevronUp, ChevronDown, Pencil, Trash2, Wand2, Save, Loader2, X, AlertCircle,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  AutomatchProgress, DraftRule, RuleFilter, RuleFilterField, RuleFilterOp,
  RuleOrderBy, RulePreferType, RuleSweep, MAX_RULES, fmtNum,
} from './types';
import { AutomatchProgressPanel } from './AutomatchProgressPanel';

// The editor writes at most one condition per rule, which covers every rule in
// docs/treematch-automatch-rules.md. The API accepts up to ten, so a deeper
// editor can be added later without touching the server.

const SWEEP_OPTIONS: { v: RuleSweep; label: string; costly?: boolean }[] = [
  { v: 'any', label: 'Any donation' },
  { v: 'company', label: 'Company donations', costly: true },
  { v: 'individual', label: 'Individual donations', costly: true },
  { v: 'country', label: 'Donations from country', costly: true },
];

const PREFER_OPTIONS: { v: RulePreferType; label: string }[] = [
  { v: 'oldest', label: 'Oldest planting first' },
  { v: 'newest', label: 'Newest planting first' },
  { v: 'site', label: 'A specific site' },
  { v: 'capacityHigh', label: 'Most free trees first' },
  { v: 'capacityLow', label: 'Least free trees first' },
];

const ORDER_OPTIONS: { v: RuleOrderBy; label: string }[] = [
  { v: 'oldest', label: 'Oldest paid first' },
  { v: 'newest', label: 'Newest paid first' },
  { v: 'largest', label: 'Largest open amount first' },
  { v: 'smallest', label: 'Smallest open amount first' },
];

const FIELD_OPTIONS: { v: RuleFilterField; label: string; kind: 'number' | 'choice' | 'text' }[] = [
  { v: 'openTrees', label: 'Trees still open', kind: 'number' },
  { v: 'totalTrees', label: 'Trees paid for', kind: 'number' },
  { v: 'olderThanDays', label: 'Days since payment', kind: 'number' },
  { v: 'matchState', label: 'Match state', kind: 'choice' },
  { v: 'unitType', label: 'Unit type', kind: 'choice' },
  { v: 'allocationPriority', label: 'Allocation priority', kind: 'choice' },
  { v: 'currency', label: 'Currency', kind: 'text' },
  { v: 'paymentDate', label: 'Payment date', kind: 'text' },
  { v: 'donationRef', label: 'Donation reference', kind: 'text' },
];

const NUMBER_OPS: { v: RuleFilterOp; label: string }[] = [
  { v: 'gte', label: 'at least' },
  { v: 'gt', label: 'more than' },
  { v: 'lte', label: 'at most' },
  { v: 'lt', label: 'less than' },
  { v: 'eq', label: 'is' },
];
const TEXT_OPS: { v: RuleFilterOp; label: string }[] = [
  { v: 'eq', label: 'is' },
  { v: 'ne', label: 'is not' },
];
const CHOICES: Record<string, { v: string; label: string }[]> = {
  matchState: [
    { v: 'none', label: 'not matched' },
    { v: 'partial', label: 'partly matched' },
  ],
  unitType: [
    { v: 'tree', label: 'trees' },
    { v: 'm2', label: 'square metres' },
  ],
  // The donation backend's own field. Auto-match no longer gates on it, so this
  // is how a project keeps hold of one kind: "priority is automatic".
  allocationPriority: [
    { v: 'automatic', label: 'automatic' },
    { v: 'first', label: 'first' },
    { v: 'manual', label: 'manual' },
  ],
};

const fieldKind = (f: RuleFilterField) => FIELD_OPTIONS.find(o => o.v === f)?.kind ?? 'text';
const opsFor = (f: RuleFilterField) => (fieldKind(f) === 'number' ? NUMBER_OPS : TEXT_OPS);

const DEFAULT_FILTER: RuleFilter = { field: 'openTrees', op: 'gte', value: 100 };

// One-line summary shown on the collapsed row.
const sweepText = (r: DraftRule) => {
  switch (r.when.sweep) {
    case 'company': return 'Company donations';
    case 'individual': return 'Individual donations';
    case 'country': return `Donations from ${r.when.country || '…'}`;
    default: return 'Any donation';
  }
};

const filterText = (f?: RuleFilter) => {
  if (!f) return '';
  const field = FIELD_OPTIONS.find(o => o.v === f.field)?.label ?? f.field;
  const op = [...NUMBER_OPS, ...TEXT_OPS].find(o => o.v === f.op)?.label ?? f.op;
  const choice = CHOICES[f.field]?.find(c => c.v === String(f.value))?.label;
  return ` with ${field.toLowerCase()} ${op} ${choice ?? f.value}`;
};

const preferText = (r: DraftRule) => {
  const base = r.prefer.type === 'site'
    ? `site ${r.prefer.siteName || '…'}`
    : PREFER_OPTIONS.find(o => o.v === r.prefer.type)?.label.toLowerCase() ?? '';
  return r.prefer.onlyApproved ? `${base}, approved only` : base;
};

const orderText = (r: DraftRule) =>
  ORDER_OPTIONS.find(o => o.v === r.orderBy)?.label.toLowerCase() ?? '';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rules: DraftRule[];
  onRulesChange: (rules: DraftRule[]) => void;
  /** the source project's sites, for the "a specific site" preference */
  sites: { uid: string; name: string }[];
  /** fixed ISO-2 list, shared with the donations country filter */
  countries: string[];
  /** cap this run to N trees; empty means no cap. Held as a string so the
   * field can sit empty while it is retyped. */
  maxTrees: string;
  onMaxTreesChange: (v: string) => void;
  /** unsaved edits exist; running saves them first */
  dirty: boolean;
  saving: boolean;
  running: boolean;
  /** live sweep state while running; drives the progress panel */
  progress?: AutomatchProgress | null;
  elapsedSeconds: number;
  stopRequested?: boolean;
  stopping?: boolean;
  error?: string | null;
  onSave: () => void;
  onRun: () => void;
  onStop: () => void;
}

export function RulesDialog({
  open, onOpenChange, rules, onRulesChange, sites, countries,
  maxTrees, onMaxTreesChange, dirty, saving, running, progress, elapsedSeconds,
  stopRequested, stopping, error, onSave, onRun, onStop,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const idc = useRef(0);
  const busy = saving || running;

  const update = (localId: string, patch: Partial<DraftRule>) =>
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
    onRulesChange([...rules, {
      localId,
      enabled: true,
      label: `Rule ${rules.length + 1}`,
      when: { sweep: 'any' },
      prefer: { type: 'oldest' },
      orderBy: 'oldest',
      action: 'match',
    }]);
    setEditingId(localId);
  };

  const changeSweep = (r: DraftRule, v: RuleSweep) =>
    update(r.localId, {
      when: { ...r.when, sweep: v, country: v === 'country' ? (r.when.country || countries[0]) : undefined },
    });

  const changePrefer = (r: DraftRule, v: RulePreferType) =>
    update(r.localId, {
      prefer: {
        ...r.prefer,
        type: v,
        siteUid: v === 'site' ? (r.prefer.siteUid || sites[0]?.uid) : undefined,
        siteName: v === 'site' ? (r.prefer.siteName || sites[0]?.name) : undefined,
      },
    });

  const setFilter = (r: DraftRule, filter?: RuleFilter) =>
    update(r.localId, { when: { ...r.when, filters: filter ? [filter] : undefined } });

  const changeField = (r: DraftRule, field: RuleFilterField) => {
    const kind = fieldKind(field);
    setFilter(r, {
      field,
      // The operator list changes with the field, so reset to a valid one.
      op: kind === 'number' ? 'gte' : 'eq',
      value: kind === 'number' ? 0 : (CHOICES[field]?.[0]?.v ?? ''),
    });
  };

  const enabledCount = rules.filter(r => r.enabled).length;
  const sweepCount = new Set(
    rules.filter(r => r.enabled && r.when.sweep !== 'any')
      .map(r => (r.when.sweep === 'country' ? `c:${r.when.country}` : r.when.sweep)),
  ).size;

  return (
    // Closing during a run is allowed on purpose: planning happens server-side
    // and can take a minute on a big project. The page keeps watching the run
    // and opens the plan when it is ready, so there is no reason to trap the
    // user here. A save is quick, so that one does hold the dialog.
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Auto-match rules</DialogTitle>
          <DialogDescription>
            Rules run top to bottom. Each takes what it can, then passes the rest down.
            Running builds a plan you review before anything is recorded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
          {rules.map((r, idx) => {
            const filter = r.when.filters?.[0];
            const editing = editingId === r.localId;
            return (
              <div key={r.localId} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col text-muted-foreground/60">
                    <button
                      type="button" disabled={idx === 0} onClick={() => move(idx, -1)}
                      className="hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move rule up"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button" disabled={idx === rules.length - 1} onClick={() => move(idx, 1)}
                      className="hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move rule down"
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>
                  <span className="mt-0.5 w-4 text-[11px] font-semibold text-muted-foreground flex-shrink-0">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className={`text-sm ${r.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      <span className="font-medium">{sweepText(r)}{filterText(filter)}</span>
                      {r.action === 'skip' ? (
                        <span className="text-muted-foreground"> → never auto-match</span>
                      ) : (
                        <span className="text-muted-foreground"> → prefer {preferText(r)} · {orderText(r)}</span>
                      )}
                    </div>

                    {editing && (
                      <div className="mt-3 rounded-md bg-muted/40 p-3 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Name</Label>
                            <Input
                              value={r.label} maxLength={120}
                              onChange={e => update(r.localId, { label: e.target.value })}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Action</Label>
                            <Select
                              value={r.action}
                              onValueChange={v => update(r.localId, { action: v as DraftRule['action'] })}
                            >
                              <SelectTrigger size="sm" className="text-xs w-full"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="match" className="text-xs">Match these donations</SelectItem>
                                <SelectItem value="skip" className="text-xs">Never auto-match them</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">When</Label>
                          <div className="flex flex-wrap gap-2">
                            <Select value={r.when.sweep} onValueChange={v => changeSweep(r, v as RuleSweep)}>
                              <SelectTrigger size="sm" className="text-xs w-52"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {SWEEP_OPTIONS.map(o => (
                                  <SelectItem key={o.v} value={o.v} className="text-xs">{o.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {r.when.sweep === 'country' && (
                              <Select
                                value={r.when.country || ''}
                                onValueChange={v => update(r.localId, { when: { ...r.when, country: v } })}
                              >
                                <SelectTrigger size="sm" className="text-xs w-24"><SelectValue placeholder="…" /></SelectTrigger>
                                <SelectContent>
                                  {countries.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {filter ? (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="text-[11px] text-muted-foreground">and</span>
                              <Select value={filter.field} onValueChange={v => changeField(r, v as RuleFilterField)}>
                                <SelectTrigger size="sm" className="text-xs w-44"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {FIELD_OPTIONS.map(o => (
                                    <SelectItem key={o.v} value={o.v} className="text-xs">{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={filter.op}
                                onValueChange={v => setFilter(r, { ...filter, op: v as RuleFilterOp })}
                              >
                                <SelectTrigger size="sm" className="text-xs w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {opsFor(filter.field).map(o => (
                                    <SelectItem key={o.v} value={o.v} className="text-xs">{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {CHOICES[filter.field] ? (
                                <Select
                                  value={String(filter.value)}
                                  onValueChange={v => setFilter(r, { ...filter, value: v })}
                                >
                                  <SelectTrigger size="sm" className="text-xs w-40"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {CHOICES[filter.field].map(c => (
                                      <SelectItem key={c.v} value={c.v} className="text-xs">{c.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={String(filter.value ?? '')}
                                  type={fieldKind(filter.field) === 'number' ? 'number' : 'text'}
                                  placeholder={filter.field === 'paymentDate' ? 'YYYY-MM-DD' : ''}
                                  onChange={e => setFilter(r, {
                                    ...filter,
                                    value: fieldKind(filter.field) === 'number'
                                      ? Number(e.target.value)
                                      : e.target.value,
                                  })}
                                  className="h-8 text-xs w-40"
                                />
                              )}

                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => setFilter(r, undefined)} aria-label="Remove condition"
                              >
                                <X size={13} />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost" size="sm" className="h-7 text-xs px-2"
                              onClick={() => setFilter(r, DEFAULT_FILTER)}
                            >
                              <Plus size={13} /> Add condition
                            </Button>
                          )}
                        </div>

                        {/* An exclusion rule places nothing, so it has no target. */}
                        {r.action === 'match' && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-[11px] text-muted-foreground">Prefer</Label>
                              <Select value={r.prefer.type} onValueChange={v => changePrefer(r, v as RulePreferType)}>
                                <SelectTrigger size="sm" className="text-xs w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {PREFER_OPTIONS.map(o => (
                                    <SelectItem
                                      key={o.v} value={o.v} className="text-xs"
                                      disabled={o.v === 'site' && sites.length === 0}
                                    >
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {r.prefer.type === 'site' && (
                                <Select
                                  value={r.prefer.siteUid || ''}
                                  onValueChange={v => update(r.localId, {
                                    prefer: {
                                      ...r.prefer,
                                      siteUid: v,
                                      siteName: sites.find(s => s.uid === v)?.name,
                                    },
                                  })}
                                >
                                  <SelectTrigger size="sm" className="text-xs w-full">
                                    <SelectValue placeholder="Select site…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sites.map(s => (
                                      <SelectItem key={s.uid} value={s.uid} className="text-xs">{s.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <label className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                                <Checkbox
                                  checked={Boolean(r.prefer.onlyApproved)}
                                  onCheckedChange={v => update(r.localId, {
                                    prefer: { ...r.prefer, onlyApproved: v === true },
                                  })}
                                />
                                Only approved, unflagged locations
                              </label>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px] text-muted-foreground">Order donations</Label>
                              <Select
                                value={r.orderBy}
                                onValueChange={v => update(r.localId, { orderBy: v as RuleOrderBy })}
                              >
                                <SelectTrigger size="sm" className="text-xs w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {ORDER_OPTIONS.map(o => (
                                    <SelectItem key={o.v} value={o.v} className="text-xs">{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {(r.orderBy === 'largest' || r.orderBy === 'smallest') && (
                                <p className="text-[11px] text-muted-foreground pt-0.5">
                                  Sorts the donations a run reads, not the whole project.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                            Done
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Switch checked={r.enabled} onCheckedChange={v => update(r.localId, { enabled: v })} />
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setEditingId(editing ? null : r.localId)} aria-label="Edit rule"
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                    onClick={() => remove(r.localId)} aria-label="Delete rule"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Locked catch-all: applied last, always, even with no rules saved. */}
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 flex items-center gap-2">
            <span className="w-4 text-center text-[11px] font-semibold text-muted-foreground flex-shrink-0">↓</span>
            <div className="text-sm text-muted-foreground min-w-0">
              <span className="font-medium text-foreground">Everything else</span>
              {' '}→ prefer oldest planting first · oldest paid first
            </div>
            <Badge variant="secondary" className="ml-auto text-[10px] flex-shrink-0">default</Badge>
          </div>

          <Button
            variant="outline" size="sm" className="w-full mt-1"
            onClick={add} disabled={rules.length >= MAX_RULES}
          >
            <Plus size={14} /> Add rule
          </Button>
        </div>

        {sweepCount > 2 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              {sweepCount} rules filter donations by donor type or country. Each one is a
              separate read of the donation backend, and those reads do not overlap, so a
              run gets slower with every extra one.
            </span>
          </div>
        )}

        {running && (
          <AutomatchProgressPanel
            progress={progress}
            elapsedSeconds={elapsedSeconds}
            stopRequested={stopRequested}
            onStop={onStop}
            stopping={stopping}
          />
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <p className="text-[11px] text-muted-foreground mr-auto">
            {fmtNum(enabledCount)} of {fmtNum(rules.length)} rules on · default always applies last
            {dirty ? ' · unsaved changes' : ''}
          </p>
          <div className="flex items-center gap-1.5">
            <Label htmlFor="maxTrees" className="text-[11px] text-muted-foreground whitespace-nowrap">
              Limit run to
            </Label>
            <Input
              id="maxTrees" type="number" min={1} placeholder="all"
              value={maxTrees} onChange={e => onMaxTreesChange(e.target.value)}
              className="h-8 w-20 text-xs"
            />
            <span className="text-[11px] text-muted-foreground">trees</span>
          </div>
          <Button variant="outline" disabled={!dirty || busy} onClick={onSave}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes
          </Button>
          <Button disabled={busy} onClick={onRun}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {running ? 'Planning…' : 'Run auto-match'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
