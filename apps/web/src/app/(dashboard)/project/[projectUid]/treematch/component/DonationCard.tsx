'use client'

import { Calendar, EyeOff, Ban as BanIcon, Sparkles, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Contribution, AllocationPriority, fmtNum, fmtDate, fmtAmount,
  contribAvailable, unitLabel,
} from './types';

const PRIORITY_META: Record<AllocationPriority, { label: string; icon?: React.ElementType; cls: string }> = {
  automatic: { label: 'Automatic', icon: Sparkles, cls: 'bg-primary/10 text-primary' },
  first: { label: 'First', cls: 'bg-indigo-50 text-indigo-700' },
  manual: { label: 'Manual', cls: 'bg-muted text-muted-foreground' },
  never: { label: 'Never', icon: BanIcon, cls: 'bg-rose-50 text-rose-700' },
};

// Dashed "empty" track, like the mock: short green dashes on a transparent base.
const DASHED_TRACK = 'repeating-linear-gradient(90deg, rgb(16 185 129 / 0.3) 0px, rgb(16 185 129 / 0.3) 7px, transparent 7px, transparent 12px)';

interface Props {
  contribution: Contribution;
  checked: boolean;
  onToggle: (id: number) => void;
  onIgnore?: (id: number) => void;
  onRestore?: (id: number) => void;
}

export function DonationCard({ contribution: c, checked, onToggle, onIgnore, onRestore }: Props) {
  const available = contribAvailable(c);
  const pct = c.units > 0 ? Math.round((c.unitsAllocated / c.units) * 100) : 0;
  const fullyMatched = available === 0;
  const selectable = !c.ignore && !fullyMatched && c.allocationPriority !== 'never';
  const priority = PRIORITY_META[c.allocationPriority];
  const PriorityIcon = priority.icon;
  const units = unitLabel(c);

  return (
    <div
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : -1}
      onClick={() => { if (selectable) onToggle(c.id); }}
      onKeyDown={(e) => { if (selectable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onToggle(c.id); } }}
      className={cn(
        'rounded-xl border bg-card px-4 py-3.5 transition-colors',
        checked ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : 'border-border',
        selectable && 'cursor-pointer hover:border-primary/40',
        (!selectable && !c.ignore) && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-2.5">
        {!c.ignore && (
          <Checkbox checked={checked} disabled={!selectable} className="pointer-events-none" />
        )}
        {/* The donation reference is the identity: ROs never see who donated. */}
        <span className="font-mono text-[15px] font-bold text-foreground truncate">{c.donation.uid}</span>
        {c.status === 'private' && (
          <Badge variant="outline" className="text-[10px] gap-1 rounded-full text-purple-700 border-purple-200 bg-purple-50 flex-shrink-0">
            <EyeOff size={10} /> private
          </Badge>
        )}
        <span className="ml-auto text-[15px] font-bold text-foreground whitespace-nowrap">{fmtNum(c.units)} {units}</span>
      </div>

      <div className={cn('mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap', !c.ignore && 'pl-[26px]')}>
        <Calendar size={12} />
        <span className="whitespace-nowrap">Paid {fmtDate(c.donation.paymentDate)}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="whitespace-nowrap">{fmtAmount(c.donation.amount, c.donation.currency)}</span>
      </div>

      {/* units bar */}
      <div className={cn('mt-3', !c.ignore && 'pl-[26px]')}>
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">
            <span className="text-lg font-bold text-foreground leading-none">{fmtNum(available)}</span> {units} to match
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{fmtNum(c.unitsAllocated)}</span> matched
          </span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundImage: DASHED_TRACK }}>
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', priority.cls)}>
              {PriorityIcon && <PriorityIcon size={11} />}
              {priority.label}
            </span>
            {fullyMatched && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <Check size={11} /> fully matched
              </span>
            )}
            {c.ignore && (
              <Badge variant="outline" className="text-[10px] gap-1 rounded-full text-rose-700 border-rose-200 bg-rose-50">
                <BanIcon size={10} /> ignored
              </Badge>
            )}
          </div>
          {c.ignore ? (
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={(e) => { e.stopPropagation(); onRestore?.(c.id); }}>
              Restore
            </Button>
          ) : (
            onIgnore && !fullyMatched && (
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-muted-foreground" onClick={(e) => { e.stopPropagation(); onIgnore(c.id); }}>
                Ignore
              </Button>
            )
          )}
        </div>

        {c.ignore && c.ignoreReason && (
          <p className="mt-1.5 text-[11px] text-muted-foreground italic">{c.ignoreReason}</p>
        )}
      </div>
    </div>
  );
}
