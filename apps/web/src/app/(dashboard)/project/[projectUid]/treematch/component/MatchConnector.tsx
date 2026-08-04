'use client'

import { cn } from '@/lib/utils';
import { fmtTrees } from './types';

interface Props {
  /** trees the selected plant locations still have free */
  supply: number;
  /** trees the selected donations are asking for */
  demand: number;
  /** both sides have a usable selection, so there is something to show */
  active: boolean;
}

/**
 * The dashed rail between the two panes, with the live match preview on it.
 * It is the only place the two selections are shown as one number, so it also
 * carries whether they balance.
 */
export function MatchConnector({ supply, demand, active }: Props) {
  const matchable = Math.min(supply, demand);

  return (
    <div className="relative w-9 flex-shrink-0 self-stretch">
      <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 border-l border-dashed border-border" />
      {active && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1.5">
          <div key={matchable} className="relative animate-in fade-in zoom-in-75 duration-300">
            <span aria-hidden className="absolute -inset-1.5 rounded-full border-2 border-emerald-500/40 animate-pulse" />
            <span aria-hidden className="absolute -inset-3 rounded-full border border-emerald-500/20 animate-pulse [animation-delay:400ms]" />
            <div className="relative flex h-16 min-w-16 px-2 flex-col items-center justify-center rounded-full bg-emerald-950 text-white shadow-lg ring-4 ring-background">
              <span className="text-sm font-bold leading-none tabular-nums whitespace-nowrap">{fmtTrees(matchable)}</span>
              <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-300">trees</span>
            </div>
          </div>
          <span className={cn(
            'rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap shadow-sm ring-1 ring-border',
            supply >= demand ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
          )}>
            {supply === demand ? 'exact match' : supply > demand ? 'fits available' : `short by ${fmtTrees(demand - supply)}`}
          </span>
        </div>
      )}
    </div>
  );
}
