'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DraftObservation, UNIT_MAX_LENGTH } from '../types';
import { recomputeObservation } from '../utils/validate';

/**
 * Edit one plot observation. Type and unit are free text on purpose: the server
 * stores them as text, and field teams use readings the app's fixed list does not
 * cover. Whatever unit is typed here is what gets saved, spaces and all, capped
 * only in length. Types are normalised to lowercase with underscores so repeat
 * readings group into one series on the plot detail page.
 */

const COMMON_TYPES = ['soil_moisture', 'canopy', 'grass_cover', 'plot_description'];

const toDateInput = (iso: string) => (iso ? iso.slice(0, 10) : '');
const fromDateInput = (v: string) => (v ? new Date(`${v}T00:00:00.000Z`).toISOString() : '');

const ObservationEditDialog = ({
  open,
  observation,
<<<<<<< Updated upstream
  title,
  saving,
=======
>>>>>>> Stashed changes
  onClose,
  onSave,
}: {
  open: boolean;
  observation: DraftObservation | null;
<<<<<<< Updated upstream
  /** Defaults to "Edit observation". */
  title?: string;
  /** Disables Save and swaps its label while an async onSave is in flight. */
  saving?: boolean;
  onClose: () => void;
  /** Returning `false` keeps the dialog open, e.g. after a failed API call. */
  onSave: (observation: DraftObservation) => void | Promise<boolean | void>;
=======
  onClose: () => void;
  onSave: (observation: DraftObservation) => void;
>>>>>>> Stashed changes
}) => {
  const [draft, setDraft] = useState<DraftObservation | null>(observation);

  useEffect(() => {
    setDraft(observation);
  }, [observation]);

  if (!draft) return null;

  const today = new Date().toISOString().slice(0, 10);
  const patch = (p: Partial<DraftObservation>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const checked = recomputeObservation(draft);

<<<<<<< Updated upstream
  const handleSave = async () => {
    const result = await onSave(checked);
    if (result !== false) onClose();
  };

=======
>>>>>>> Stashed changes
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
<<<<<<< Updated upstream
          <DialogTitle>{title ?? 'Edit observation'}</DialogTitle>
          <DialogDescription>
            {draft.row > 0 ? `From CSV row ${draft.row}.` : 'Added by hand.'}
          </DialogDescription>
=======
          <DialogTitle>Edit observation</DialogTitle>
          <DialogDescription>From CSV row {draft.row}.</DialogDescription>
>>>>>>> Stashed changes
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="obs-type">Type</Label>
            <Input
              id="obs-type"
              list="obs-type-options"
              value={draft.type}
              onChange={(e) => patch({ type: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            />
            <datalist id="obs-type-options">
              {COMMON_TYPES.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs-date">Date</Label>
            <Input
              id="obs-date"
              type="date"
              max={today}
              value={toDateInput(draft.observedAt)}
              onChange={(e) => patch({ observedAt: fromDateInput(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="obs-value">Value</Label>
              <Input
                id="obs-value"
                type="number"
                step="any"
                value={draft.value ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  patch({ value: v.trim() === '' ? null : Number(v) });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="obs-unit">Unit</Label>
              <Input
                id="obs-unit"
                placeholder="%"
                maxLength={UNIT_MAX_LENGTH}
                value={draft.unit}
                onChange={(e) => patch({ unit: e.target.value })}
              />
              <p className="text-[10.5px] text-muted-foreground">
                Any unit, up to {UNIT_MAX_LENGTH} characters.
              </p>
            </div>
          </div>

          {checked.errors.length > 0 && (
            <div className="space-y-1">
              {checked.errors.map((e) => (
                <p key={e} className="text-[12px] text-destructive inline-flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-px flex-none" /> {e}
                </p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
<<<<<<< Updated upstream
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save observation'}
=======
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              onSave(checked);
              onClose();
            }}
          >
            Save observation
>>>>>>> Stashed changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ObservationEditDialog;
