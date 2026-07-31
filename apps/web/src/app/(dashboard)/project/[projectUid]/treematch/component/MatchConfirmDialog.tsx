'use client'

import { ArrowRight, ArrowLeftRight, Sparkles, AlertCircle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TreeMatchIntervention, Contribution, fmtNum, fmtTrees, availableTrees,
  contribAvailable, requestedTrees, MatchAmounts, MAX_MATCH_PAIRS,
} from './types';

export interface PreviewAllocation {
  /** the donation reference (donation.uid) -- there is no donor name to show */
  donationRef: string;
  contributionId: number;
  interventionHid: string;
  /** intervention uid; the server keys matches by uid, not hid */
  interventionUid: string;
  trees: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  interventions: TreeMatchIntervention[];
  contributions: Contribution[];
  /** per-donation partials; a donation with no entry asks for everything open */
  amounts: MatchAmounts;
  /** true while the match write is in flight */
  submitting?: boolean;
  /** what the server said when the last attempt failed; shown here, since this
   * is where the retry happens */
  error?: string | null;
  onConfirm: (allocations: PreviewAllocation[]) => void;
}

// Greedy two-pointer fill: walk contributions, consume from interventions.
// What each contribution needs is what the user asked it for on the card, which
// defaults to everything it still has open.
function computePreview(
  interventions: TreeMatchIntervention[],
  contributions: Contribution[],
  amounts: MatchAmounts,
): PreviewAllocation[] {
  const supply = interventions.map((i) => ({ hid: i.hid, uid: i.uid, left: availableTrees(i) }));
  const out: PreviewAllocation[] = [];
  let s = 0;
  for (const c of contributions) {
    let need = requestedTrees(c, amounts);
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
  open, onOpenChange, interventions, contributions, amounts, submitting, error, onConfirm,
}: Props) {
  const preview = computePreview(interventions, contributions, amounts);
  const totalTrees = preview.reduce((sum, p) => sum + p.trees, 0);
  const demand = contributions.reduce((sum, c) => sum + requestedTrees(c, amounts), 0);
  const shortfall = demand - totalTrees;
  // What the partials deliberately leave on the donations, as opposed to the
  // shortfall, which is demand the selected locations could not cover.
  const heldBack = contributions.reduce((sum, c) => sum + contribAvailable(c), 0) - demand;

  // Matching across projects is allowed, but the rows above show only the HID,
  // so nothing on this screen says the trees are coming out of a different
  // project's stock. Name the projects before the write, not after.
  const usedUids = new Set(preview.map(p => p.interventionUid));
  const crossProjects = [...new Set(
    interventions.filter(i => i.crossProjectName && usedUids.has(i.uid)).map(i => i.crossProjectName!),
  )];

  // The server takes at most MAX_MATCH_PAIRS pairs in one call, and the whole
  // call is one transaction. Splitting it into several requests would give up
  // that all-or-nothing guarantee, so oversized selections are blocked instead.
  const pairCount = new Set(preview.map(p => `${p.contributionId}:${p.interventionUid}`)).size;
  const tooManyPairs = pairCount > MAX_MATCH_PAIRS;

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
              <Badge variant="secondary" className="text-[11px] flex-shrink-0">{fmtTrees(p.trees)} trees</Badge>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Trees to allocate</span><span className="font-semibold">{fmtTrees(totalTrees)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Requested by donations</span><span>{fmtTrees(demand)}</span></div>
          {heldBack > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Left open on purpose (partial)</span><span>{fmtTrees(heldBack)}</span>
            </div>
          )}
          {shortfall > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>Unmatched (carries forward)</span><span className="font-semibold">{fmtTrees(shortfall)}</span>
            </div>
          )}
        </div>

        {crossProjects.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <ArrowLeftRight size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              These trees come from {crossProjects.join(', ')}, not this project.
              They will count as claimed there.
            </span>
          </div>
        )}

        {tooManyPairs && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              This match needs {fmtNum(pairCount)} donation-to-location links, and one match can carry {fmtNum(MAX_MATCH_PAIRS)}.
              Deselect a few and record it in more than one go.
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onConfirm(preview)} disabled={preview.length === 0 || submitting || tooManyPairs}>
            <Sparkles size={14} /> {submitting ? 'Recording…' : 'Confirm match'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
