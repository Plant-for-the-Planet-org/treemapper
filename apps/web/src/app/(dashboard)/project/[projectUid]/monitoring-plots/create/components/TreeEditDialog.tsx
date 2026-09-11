'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DraftMeasurement, DraftTree, ORIGIN_LABELS, TREE_ORIGINS, TreeOrigin,
} from '../types';
import { carriedWarnings, recomputeTree } from '../utils/validate';
import SpeciesPicker from './SpeciesPicker';

/**
 * Edit one tree before saving: its own attributes plus its measurement timeline.
 * Every change is re-validated through the same rules the CSV parser used, so a
 * row cannot be edited into a state the import would have rejected.
 */

const parseNum = (v: string): number | null => {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toDateInput = (iso: string) => (iso ? iso.slice(0, 10) : '');
const fromDateInput = (v: string) => (v ? new Date(`${v}T00:00:00.000Z`).toISOString() : '');

let seq = 0;

const TreeEditDialog = ({
  open,
  tree,
  token,
  boundary,
  title,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  tree: DraftTree | null;
  token: string;
  boundary: GeoJSON.Polygon | null;
  /** Defaults to "Edit tree {tag}". */
  title?: string;
  /** Disables Save and swaps its label while an async onSave is in flight. */
  saving?: boolean;
  onClose: () => void;
  /** Returning `false` keeps the dialog open, e.g. after a failed API call. */
  onSave: (tree: DraftTree) => void | Promise<boolean | void>;
}) => {
  const [draft, setDraft] = useState<DraftTree | null>(tree);

  useEffect(() => {
    setDraft(tree);
  }, [tree]);

  if (!draft) return null;

  const today = new Date().toISOString().slice(0, 10);
  const patch = (p: Partial<DraftTree>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const patchMeasurement = (id: string, p: Partial<DraftMeasurement>) => {
    setDraft((d) => (d
      ? { ...d, measurements: d.measurements.map((m) => (m.id === id ? { ...m, ...p } : m)) }
      : d));
  };

  const addMeasurement = () => {
    setDraft((d) => (d
      ? {
        ...d,
        measurements: [...d.measurements, {
          id: `m_new_${(seq += 1)}`,
          date: new Date().toISOString(),
          height: null,
          width: null,
          errors: [],
        }],
      }
      : d));
  };

  const removeMeasurement = (id: string) => {
    setDraft((d) => (d ? { ...d, measurements: d.measurements.filter((m) => m.id !== id) } : d));
  };

  const handleSave = async () => {
    const result = await onSave(recomputeTree(draft, boundary, carriedWarnings(draft)));
    if (result !== false) onClose();
  };

  // Live view of what saving would produce, so problems show before committing.
  const checked = recomputeTree(draft, boundary, carriedWarnings(draft));
  const blocking = [
    ...checked.errors,
    ...checked.measurements.flatMap((m) => m.errors),
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title ?? `Edit tree ${draft.tag || '(no tag)'}`}</DialogTitle>
          <DialogDescription>
            {draft.rows.length > 0
              ? `From CSV row${draft.rows.length === 1 ? '' : 's'} ${draft.rows.join(', ')}.`
              : 'Added by hand.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tree-tag">Tag</Label>
              <Input
                id="tree-tag"
                value={draft.tag}
                onChange={(e) => patch({ tag: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Planted or recruit</Label>
              <Select
                value={draft.origin}
                onValueChange={(v) => patch({ origin: v as TreeOrigin })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TREE_ORIGINS.map((o) => (
                    <SelectItem key={o} value={o}>{ORIGIN_LABELS[o]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10.5px] text-muted-foreground">
                A recruit grew in the plot on its own.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Species</Label>
            <SpeciesPicker
              token={token}
              value={draft.scientificSpeciesUid}
              displayName={draft.speciesName}
              className="w-full"
              onSelect={(hit) => patch({
                scientificSpeciesUid: hit.uid,
                speciesName: hit.scientificName,
                speciesMatch: 'matched',
              })}
              onClear={() => patch({ scientificSpeciesUid: null, speciesMatch: 'unmatched' })}
            />
            {!draft.scientificSpeciesUid && (
              <p className="text-[10.5px] text-muted-foreground">
                Saves as an unknown species, keeping the name you entered.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tree-lat">Latitude</Label>
              <Input
                id="tree-lat"
                type="number"
                step="any"
                value={draft.latitude ?? ''}
                onChange={(e) => patch({ latitude: parseNum(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tree-lng">Longitude</Label>
              <Input
                id="tree-lng"
                type="number"
                step="any"
                value={draft.longitude ?? ''}
                onChange={(e) => patch({ longitude: parseNum(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tree-planted">Planting date</Label>
              <Input
                id="tree-planted"
                type="date"
                max={today}
                value={toDateInput(draft.plantingDate ?? '')}
                onChange={(e) => patch({ plantingDate: fromDateInput(e.target.value) || null })}
              />
            </div>
          </div>
          <p className="text-[10.5px] text-muted-foreground -mt-2">
            Leave latitude and longitude blank if the plant&apos;s exact position wasn&apos;t recorded.
          </p>

          {/* Measurements */}
          <div className="border rounded-[3px]">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
              <span className="text-[12px] font-semibold">
                Measurements ({draft.measurements.length})
              </span>
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={addMeasurement}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>

            {draft.measurements.length === 0 ? (
              <p className="px-3 py-4 text-[12px] text-muted-foreground text-center">
                No measurements. The tree still saves, with no growth history.
              </p>
            ) : (
              <div className="divide-y">
                {draft.measurements.map((m) => (
                  <div key={m.id} className="p-3 space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5 space-y-1">
                        <Label className="text-[10.5px]">Date</Label>
                        <Input
                          type="date"
                          max={today}
                          className="h-8 text-[12px]"
                          value={toDateInput(m.date)}
                          onChange={(e) => patchMeasurement(m.id, { date: fromDateInput(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[10.5px]">Height (m)</Label>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          className="h-8 text-[12px]"
                          value={m.height ?? ''}
                          onChange={(e) => patchMeasurement(m.id, { height: parseNum(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[10.5px]">Ø (cm)</Label>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          className="h-8 text-[12px]"
                          value={m.width ?? ''}
                          onChange={(e) => patchMeasurement(m.id, { width: parseNum(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeMeasurement(m.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {m.errors.map((e) => (
                      <p key={e} className="text-[11px] text-destructive">{e}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {blocking.length > 0 && (
            <div className="space-y-1">
              {[...new Set(blocking)].map((e) => (
                <p key={e} className="text-[12px] text-destructive inline-flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-px flex-none" /> {e}
                </p>
              ))}
            </div>
          )}
          {checked.warnings.length > 0 && (
            <div className="space-y-1">
              {checked.warnings.map((w) => (
                <p key={w} className="text-[12px] text-amber-600">{w}</p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save tree'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TreeEditDialog;
