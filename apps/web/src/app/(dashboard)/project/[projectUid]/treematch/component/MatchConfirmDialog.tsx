'use client'

import { ArrowRight, Sparkles, EyeOff } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MockIntervention, MockContribution, fmtNum, donorLabel } from './mockData';

export interface PreviewAllocation {
  donor: string;
  contributionUid: string;
  interventionHid: string;
  trees: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  interventions: MockIntervention[];
  contributions: MockContribution[];
  matchType: 'full' | 'partial';
  maxTreeCount: number | null;
  allowPartial: boolean;
  privateMatch: boolean;
  onConfirm: (allocations: PreviewAllocation[]) => void;
}

// Greedy two-pointer fill: walk contributions, consume from interventions.
function computePreview(
  interventions: MockIntervention[],
  contributions: MockContribution[],
  maxTreeCount: number | null,
): PreviewAllocation[] {
  const supply = interventions.map((i) => ({ hid: i.hid, left: Math.max(0, i.totalTrees - i.matchedTrees) }));
  const out: PreviewAllocation[] = [];
  let s = 0;
  for (const c of contributions) {
    let need = Math.max(0, c.units - c.allocated);
    if (maxTreeCount != null) need = Math.min(need, maxTreeCount);
    while (need > 0 && s < supply.length) {
      if (supply[s].left <= 0) { s++; continue; }
      const take = Math.min(need, supply[s].left);
      out.push({ donor: donorLabel(c.donor), contributionUid: c.uid, interventionHid: supply[s].hid, trees: take });
      supply[s].left -= take;
      need -= take;
    }
  }
  return out;
}

export function MatchConfirmDialog({
  open, onOpenChange, interventions, contributions, matchType, maxTreeCount, allowPartial, privateMatch, onConfirm,
}: Props) {
  const preview = computePreview(interventions, contributions, matchType === 'partial' ? maxTreeCount : null);
  const totalTrees = preview.reduce((sum, p) => sum + p.trees, 0);
  const demand = contributions.reduce((sum, c) => sum + Math.max(0, c.units - c.allocated), 0);
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

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Badge variant="secondary" className="capitalize">{matchType}</Badge>
          {allowPartial && <Badge variant="outline">allow partial</Badge>}
          {maxTreeCount != null && matchType === 'partial' && <Badge variant="outline">cap {fmtNum(maxTreeCount)}/donation</Badge>}
          {privateMatch && (
            <Badge variant="outline" className="gap-1 text-purple-700 border-purple-300 bg-purple-50">
              <EyeOff size={10} /> private
            </Badge>
          )}
        </div>

        <div className="mt-1 max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {preview.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nothing to allocate.</p>
          )}
          {preview.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 text-sm">
              <span className="text-muted-foreground truncate flex-1">{p.donor}</span>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onConfirm(preview)} disabled={preview.length === 0}>
            <Sparkles size={14} /> Confirm match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
