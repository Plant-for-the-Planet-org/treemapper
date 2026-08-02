'use client'

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Sparkles, AlertCircle, Info, Ban, X, Undo2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AutomatchPlanEmpty, AutomatchPlanPair, AutomatchRun, fmtNum, fmtTrees } from './types';

// What a run decided to do, before any of it is recorded. The write itself goes
// through the same path as a manual match, so this reads like MatchConfirmDialog
// on purpose.

/**
 * An empty plan is a normal outcome with causes that need completely different
 * responses from the user: wait for approvals, un-ignore some donations, loosen
 * a rule, or nothing at all because the work is already done. The run says which
 * one it was, so the dialog can name it and say what to do next instead of
 * leaving "the rules found nothing to match" as the whole answer.
 */
function explainEmpty(empty: AutomatchPlanEmpty): { headline: string; hint: string } {
  switch (empty.reason) {
    case 'noLocations':
      return {
        headline: 'This project has no plant locations that can take donations yet.',
        hint: 'Locations need an approved, complete tree capture. Plots are never matched.',
      };
    case 'noFreeTrees':
      return {
        headline: `Every plant location is full. All ${fmtNum(empty.locations)} of them are fully matched.`,
        hint: 'Nothing to do here. Add more planting records to match more donations.',
      };
    case 'noDonations':
      return {
        headline: 'The donation backend returned no donations for this project.',
        hint: 'If you expect donations here, check the project on the donation side.',
      };
    case 'allIgnored':
      return {
        headline: `All ${fmtNum(empty.donationsSeen)} donations the run read are marked ignored.`,
        hint: 'Un-ignore the ones you want auto-match to use, in the Ignored tab.',
      };
    case 'allAllocated':
      return {
        headline: `All ${fmtNum(empty.donationsSeen)} donations the run read are already fully matched.`,
        hint: 'Nothing left to allocate in the part of the list this run reached.',
      };
    case 'filteredOut': {
      // A rule filtering on priority is the easiest way to reject everything by
      // accident, and it is invisible unless the spread is named.
      const spread = Object.entries(empty.priorityCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => `${fmtNum(count)} ${name}`)
        .join(', ');
      return {
        headline: `Your rules ruled out all ${fmtNum(empty.usableDonations)} usable donations.`,
        hint:
          'Loosen a rule condition, or check whether an exclusion rule is holding them back.' +
          (spread ? ` Donation priorities read: ${spread}.` : ''),
      };
    }
    default:
      return {
        headline: `${fmtNum(empty.usableDonations)} donations were usable, but none could be placed.`,
        hint: `Only ${fmtNum(empty.locationsWithRoom)} of ${fmtNum(empty.locations)} locations had room, and the rules did not reach them.`,
      };
  }
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  run: AutomatchRun | null;
  /** true while the plan is being written */
  applying?: boolean;
  /** true while the plan is being thrown away */
  discarding?: boolean;
  error?: string | null;
  /** the links the user kept; a subset of the plan's pairs */
  onApply: (keep: AutomatchPlanPair[]) => void;
  onDiscard: () => void;
}

const pairKey = (pair: AutomatchPlanPair) =>
  `${pair.contributionId}:${pair.interventionUid}`;

export function AutomatchPlanDialog({
  open, onOpenChange, run, applying, discarding, error, onApply, onDiscard,
}: Props) {
  const plan = run?.plan ?? null;
  const planned = plan?.pairs ?? [];
  const busy = Boolean(applying || discarding);

  // Links the user has taken out. Held by key rather than by index so it
  // survives the list being re-sorted or grouped, and reset whenever a
  // different plan is shown.
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  useEffect(() => { setRemoved(new Set()); }, [run?.uid]);

  const pairs = useMemo(
    () => planned.filter(pair => !removed.has(pairKey(pair))),
    [planned, removed],
  );

  const remove = (keys: string[]) =>
    setRemoved(prev => {
      const next = new Set(prev);
      keys.forEach(key => next.add(key));
      return next;
    });

  const totalTrees = pairs.reduce((sum, p) => sum + p.trees, 0);
  const donations = new Set(pairs.map(p => p.contributionId)).size;
  const locations = new Set(pairs.map(p => p.interventionUid)).size;
  const removedCount = planned.length - pairs.length;

  // A donation can be split across several locations, so removing "this
  // donation" has to take all of its links, not just the row clicked.
  const keysByContribution = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const pair of pairs) {
      const keys = map.get(pair.contributionId) || [];
      keys.push(pairKey(pair));
      map.set(pair.contributionId, keys);
    }
    return map;
  }, [pairs]);

  // Rules that placed nothing still matter: an exclusion rule that held
  // donations back, or one pointing at a site that has been deleted. These
  // describe what the planner did, so they are not adjusted by removals.
  const usedRules = (plan?.perRule ?? []).filter(
    r => r.matchedTrees > 0 || r.skipped || r.siteMissing,
  );

  // "Nothing was planned" and "you removed it all" are different situations and
  // the reason box only applies to the first.
  const empty = planned.length === 0;
  const allRemoved = !empty && pairs.length === 0;
  const reason = empty && plan?.empty ? explainEmpty(plan.empty) : null;

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Auto-match plan</DialogTitle>
          <DialogDescription>
            {empty
              ? 'This run found nothing to match. Nothing has been recorded.'
              : 'Nothing has been recorded yet. Review what the rules decided, then apply it.'}
          </DialogDescription>
        </DialogHeader>

        {reason && (
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
            <p className="font-medium text-foreground">{reason.headline}</p>
            <p className="mt-1 text-muted-foreground">{reason.hint}</p>
          </div>
        )}

        {removedCount > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              {fmtNum(removedCount)} link{removedCount === 1 ? '' : 's'} removed. Only what is
              left below will be recorded.
            </span>
            <Button
              variant="ghost" size="sm" disabled={busy}
              className="h-6 px-2 text-xs flex-shrink-0"
              onClick={() => setRemoved(new Set())}
            >
              <Undo2 size={12} /> Undo all
            </Button>
          </div>
        )}

        {/* The pair list is the point of this dialog; with no pairs and a reason
            above it, an empty bordered box says nothing. */}
        {!(empty && reason) && (
        <div className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {empty && (
            <p className="text-sm text-muted-foreground text-center py-6">
              The rules found nothing to match.
            </p>
          )}
          {allRemoved && (
            <p className="text-sm text-muted-foreground text-center py-6">
              You removed every link. Undo one, or discard the plan.
            </p>
          )}
          {pairs.map(p => {
            const key = pairKey(p);
            const sameDonation = keysByContribution.get(p.contributionId) || [];
            return (
              <div key={key} className="group flex items-center gap-2 p-2.5 text-sm">
                <span className="font-mono text-muted-foreground truncate flex-1">
                  {p.donationRef ?? `#${p.contributionId}`}
                </span>
                <ArrowRight size={13} className="text-muted-foreground/50 flex-shrink-0" />
                <span className="font-medium text-foreground truncate flex-1">{p.interventionHid}</span>
                <Badge variant="secondary" className="text-[11px] flex-shrink-0">
                  {fmtTrees(p.trees)} trees
                </Badge>
                {/* Two removals, because a donation split across locations makes
                    "drop this link" and "drop this donation" different asks. The
                    second only appears when it would do something more. */}
                {sameDonation.length > 1 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(sameDonation)}
                    title="Remove every link for this donation"
                    className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100 disabled:opacity-30"
                  >
                    all {sameDonation.length}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove([key])}
                  title="Remove this link"
                  aria-label={`Remove ${p.donationRef ?? p.contributionId} to ${p.interventionHid}`}
                  className="flex-shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100 disabled:opacity-30"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
        )}

        {/* A row of zeros tells the user nothing they cannot see from the reason
            above, so the totals only appear when there is something to total. */}
        {!empty && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trees to allocate</span>
            <span className="font-semibold">{fmtTrees(totalTrees)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Donations</span>
            <span>{fmtNum(donations)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plant locations</span>
            <span>{fmtNum(locations)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Links to record</span>
            <span>{fmtNum(pairs.length)}</span>
          </div>
        </div>
        )}

        {usedRules.length > 0 && (
          <div className="rounded-lg border border-border divide-y divide-border text-sm">
            <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              By rule
            </div>
            {usedRules.map((r, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2">
                <span className="truncate flex-1">
                  {r.label}
                  {r.ruleUid === null && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">default</Badge>
                  )}
                </span>
                {r.skipped ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Ban size={12} /> {fmtNum(r.skipped)} held back
                  </span>
                ) : r.siteMissing ? (
                  <span className="text-xs text-amber-700 flex-shrink-0">site is gone</span>
                ) : (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {fmtTrees(r.matchedTrees)} trees · {fmtNum(r.contributionsUsed)} donations
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {plan?.capped && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              This plan hit its limit and stopped early. Apply it, then run again to match more.
            </span>
          </div>
        )}

        {plan?.scan.truncated && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              {/* There is no cursor: a sweep always starts at page 1, oldest
                  first, so a re-run reads exactly the same donations. The old
                  copy promised it would pick up where this one stopped. */}
              The run read {fmtNum(plan.scan.donationsSeen)} donations and hit its page limit
              before the end of the list. It always starts from the oldest donations, so running
              it again reads the same ones.
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
          {/* Empty plan: "Discard" next to a dead "Apply plan" reads like a
              choice when there is only one. Closing still has to go through
              onDiscard, since a planned run holds the project's only run slot
              until it is applied, discarded, or expires. */}
          {empty ? (
            <Button disabled={busy} onClick={onDiscard}>
              {discarding ? 'Closing…' : 'Done'}
            </Button>
          ) : (
            <>
              <Button variant="outline" disabled={busy} onClick={onDiscard}>
                {discarding ? 'Discarding…' : 'Discard'}
              </Button>
              <Button onClick={() => onApply(pairs)} disabled={busy || allRemoved}>
                <Sparkles size={14} />
                {applying
                  ? 'Recording…'
                  : removedCount > 0
                    ? `Apply ${fmtNum(pairs.length)} links`
                    : 'Apply plan'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
