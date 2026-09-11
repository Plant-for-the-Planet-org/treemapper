'use client'

import { Loader2, OctagonX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutomatchProgress, fmtNum } from './types';

// Reading donations is the slow part of a run: the donation backend serves one
// page at a time at roughly 0.7s, and a run reads a separate list per rule. That
// is up to a minute or two of waiting, which an indeterminate spinner turns into
// "is this broken?". This shows a bar per list, what has been found so far, and
// a way out.

interface Props {
  progress?: AutomatchProgress | null;
  /** seconds since the run started, for the elapsed readout */
  elapsedSeconds: number;
  stopRequested?: boolean;
  onStop: () => void;
  stopping?: boolean;
}

function listLabel(signature: string): string {
  if (!signature) return 'All donations';
  const [key, value] = signature.split('=');
  if (key === 'profileType') return value === 'company' ? 'Companies' : 'Individuals';
  if (key === 'country') return `Country: ${value}`;
  return signature;
}

export function AutomatchProgressPanel({
  progress, elapsedSeconds, stopRequested, onStop, stopping,
}: Props) {
  const lists = progress?.lists ?? [];
  const read = progress?.donationsRead ?? 0;
  const usable = progress?.usableDonations ?? 0;

  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Loader2 size={14} className="animate-spin text-muted-foreground" />
        Reading donations
      </div>

      {lists.length === 0 ? (
        <p className="text-xs text-muted-foreground">Starting the run…</p>
      ) : (
        <div className="space-y-2">
          {lists.map(list => {
            // maxPages is the backstop, not a real total: a list usually ends
            // early. The bar is "how much of the budget is spent", and a done
            // list is shown full whatever page it stopped on.
            const pct = list.done
              ? 100
              : Math.min(100, Math.round((list.page / Math.max(1, list.maxPages)) * 100));
            return (
              <div key={list.signature || 'all'} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{listLabel(list.signature)}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {list.done ? 'done' : `page ${fmtNum(list.page)} of ${fmtNum(list.maxPages)}`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      list.done ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground tabular-nums">
        {fmtNum(read)} donations read · {fmtNum(usable)} usable · {fmtNum(elapsedSeconds)}s
      </p>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          You can close this. The run keeps going and the plan opens when it is ready.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0"
          disabled={stopping || stopRequested}
          onClick={onStop}
        >
          <OctagonX size={13} />
          {stopRequested ? 'Stopping…' : 'Stop and plan with these'}
        </Button>
      </div>
    </div>
  );
}
