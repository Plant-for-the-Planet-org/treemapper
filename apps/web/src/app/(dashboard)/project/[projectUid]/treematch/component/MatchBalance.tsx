'use client'

// Whether the two selections balance: what the picked plant locations have
// free, what the picked donations are asking for, and the gap between them.
//
// This used to sit on a rail between the panes. It lives in the bottom bar now,
// next to the button it qualifies: the button already says how many trees the
// match would record, and this is the line that explains that number.

import { cn } from '@/lib/utils';
import { fmtTrees } from './types';

interface Props {
  /** trees the selected plant locations still have free */
  supply: number;
  /** trees the selected donations are asking for */
  demand: number;
}

export function MatchBalance({ supply, demand }: Props) {
  const short = demand > supply;

  return (
    <div className="flex items-center gap-2 text-xs whitespace-nowrap">
      <span className="text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{fmtTrees(supply)}</span> available
        <span className="text-muted-foreground/40"> · </span>
        <span className="font-semibold text-foreground tabular-nums">{fmtTrees(demand)}</span> asked for
      </span>
      <span className={cn(
        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
        short
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
      )}>
        {supply === demand
          ? 'exact match'
          : short
            ? `short by ${fmtTrees(demand - supply)}`
            : 'fits available'}
      </span>
    </div>
  );
}
