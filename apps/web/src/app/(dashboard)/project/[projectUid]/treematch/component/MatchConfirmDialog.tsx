'use client'

import { ArrowRight, Sparkles } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TreeMatchIntervention, Contribution, fmtNum, availableTrees, contribAvailable,
} from './types';

export interface PreviewAllocation {
  /** the donation reference (donation.uid) -- there is no donor name to show */
  donationRef: string;
  contributionId: number;
  interventionHid: string;
  /** intervention uid; the server ledger keys matches by uid, not hid */
  interventionUid: string;
  trees: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  interventions: TreeMatchIntervention[];
  contributions: Contribution[];
  /** true while the allocation write-back is in flight */
  submitting?: boolean;
  onConfirm: (allocations: PreviewAllocation[]) => void;
}

// Greedy two-pointer fill: walk contributions, consume from interventions.
function computePreview(
  interventions: TreeMatchIntervention[],
  contributions: Contribution[],
): PreviewAllocation[] {
  const supply = interventions.map((i) => ({ hid: i.hid, uid: i.uid, left: availableTrees(i) }));
  const out: PreviewAllocation[] = [];
  let s = 0;
  for (const c of contributions) {
    let need = contribAvailable(c);
    while (need > 0 && s < supply.length) {
      if (supply[s].left <= 0) { s++; continue; }
      const take = Math.min(need, supply[s].left);
      out.push({ donationRef: c.donation.uid, contributionId: c.id, interventionHid: supply[s].hid, interventionUid: supply[s].uid, trees: take });
      supply[s].left -= take;
      need -= take;
    }
  }
  return out;
}

export function MatchConfirmDialog({
  open, onOpenChange, interventions, contributions, submitting, onConfirm,
}: Props) {
  const preview = computePreview(interventions, contributions);
  const totalTrees = preview.reduce((sum, p) => sum + p.trees, 0);
  const demand = contributions.reduce((sum, c) => sum + contribAvailable(c), 0);
  const shortfall = demand - totalTrees;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm match</DialogTitle>
          <DialogDescription>
            Trees are distributed across the selected plant locations by available capacity. Review before recording.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {preview.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nothing to allocate.</p>
          )}
          {preview.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 text-sm">
              <span className="font-mono text-muted-foreground truncate flex-1">{p.donationRef}</span>
              <ArrowRight size={13} className="text-muted-foreground/50 flex-shrink-0" />
              <span className="font-medium text-foreground truncate flex-1">{p.interventionHid}</span>
              <Badge variant="secondary" className="text-[11px] flex-shrink-0">{fmtNum(p.trees)} trees</Badge>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Trees to allocate</span><span className="font-semibold">{fmtNum(totalTrees)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Donation demand</span><span>{fmtNum(demand)}</span></div>
          {shortfall > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>Unmatched (carries forward)</span><span className="font-semibold">{fmtNum(shortfall)}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onConfirm(preview)} disabled={preview.length === 0 || submitting}>
            <Sparkles size={14} /> {submitting ? 'Recording…' : 'Confirm match'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
