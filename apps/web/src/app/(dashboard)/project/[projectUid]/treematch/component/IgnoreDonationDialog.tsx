'use client'

// Confirm step for setting a donation aside, and the only place the ignore
// reason is written. The reason lives in TTC next to the flag and is cleared
// when the donation is restored, so it is asked for here and nowhere else.
//
// Unlike MatchConfirmDialog this owns its own submitting and error state rather
// than taking them from the page: the write is one call about one row, it
// starts and ends inside this dialog, and nothing outside needs to know it is
// in flight.

import { useEffect, useState } from 'react';
import { AlertCircle, Ban, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Contribution, IGNORE_REASON_MAX, contribAvailable, fmtAmount, fmtDate,
  fmtTrees, toMajorAmount, unitLabel,
} from './types';

interface Props {
  open: boolean;
  /** the donation being set aside; null between openings */
  contribution: Contribution | null;
  onOpenChange: (v: boolean) => void;
  /** resolves to null when it landed, or to the message to show when it did not */
  onConfirm: (id: number, reason?: string) => Promise<string | null>;
}

export function IgnoreDonationDialog({ open, contribution, onOpenChange, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The parent drops its target as the dialog closes, so reading `contribution`
  // straight would blank the card mid-fade. Hold the last one instead.
  const [shown, setShown] = useState<Contribution | null>(contribution);
  useEffect(() => { if (contribution) setShown(contribution); }, [contribution]);

  // A note typed for one donation is never the right note for the next, and a
  // stale error would read as a failure of this one.
  useEffect(() => {
    if (open) { setReason(''); setError(null); }
  }, [open, contribution?.id]);

  const handleConfirm = async () => {
    if (!shown) return;
    setSubmitting(true);
    setError(null);
    // Blank counts as no reason, the same way TTC treats it.
    const message = await onConfirm(shown.id, reason.trim() || undefined);
    setSubmitting(false);
    if (message) setError(message);
    else onOpenChange(false);
  };

  const available = shown ? contribAvailable(shown) : 0;

  return (
    <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban size={16} className="text-rose-600" /> Ignore this donation
          </DialogTitle>
          <DialogDescription>
            It moves to the Ignored tab and auto-match will skip it. Nothing
            already matched changes, and you can restore it at any time.
          </DialogDescription>
        </DialogHeader>

        {shown && (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground truncate">
                {shown.donation.uid}
              </span>
              <span className="ml-auto text-sm font-semibold text-foreground whitespace-nowrap">
                {fmtTrees(available)} {unitLabel(shown)} open
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Paid {fmtDate(shown.donation.paymentDate)}
              <span className="text-muted-foreground/40"> · </span>
              {fmtAmount(toMajorAmount(shown.donation.amount), shown.donation.currency)}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="ignore-reason" className="text-xs">
            Reason <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="ignore-reason"
            value={reason}
            disabled={submitting}
            maxLength={IGNORE_REASON_MAX}
            onChange={e => setReason(e.target.value)}
            placeholder="Why is this donation being set aside?"
            className="min-h-20 text-sm"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              Shown on the donation while it is ignored. Cleared when you restore it.
            </p>
            <span className="text-[11px] tabular-nums text-muted-foreground whitespace-nowrap">
              {reason.length}/{IGNORE_REASON_MAX}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={submitting || !shown} onClick={() => { void handleConfirm(); }}>
            {submitting
              ? <><Loader2 size={14} className="animate-spin" /> Ignoring…</>
              : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
