'use client'

import { Calendar, Ban as BanIcon, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Contribution, fmtTrees, fmtDate, fmtAmount, toMajorAmount, contribAvailable, unitLabel,
} from './types';

// Dashed "empty" track, like the mock: short green dashes on a transparent base.
const DASHED_TRACK = 'repeating-linear-gradient(90deg, rgb(16 185 129 / 0.3) 0px, rgb(16 185 129 / 0.3) 7px, transparent 7px, transparent 12px)';

interface Props {
  contribution: Contribution;
  checked: boolean;
  onToggle: (id: number) => void;
  onIgnore?: (id: number) => void;
  onRestore?: (id: number) => void;
  /** the selected plant locations are already fully claimed, so picking this
   * donation up would only add shortfall */
  blocked?: boolean;
  /** raw field value; undefined means untouched, so the donation claims all of
   * its open amount */
  amount?: string;
  /** already clamped to whole trees and to what is open */
  onAmountChange?: (id: number, raw: string) => void;
  /** drop the partial and go back to claiming everything open */
  onAmountReset?: (id: number) => void;
}

export function DonationCard({
  contribution: c, checked, onToggle, onIgnore, onRestore,
  amount, onAmountChange, onAmountReset, blocked,
}: Props) {
  const available = contribAvailable(c);
  const pct = c.units > 0 ? Math.round((c.unitsAllocated / c.units) * 100) : 0;
  const fullyMatched = available === 0;
  // `matchable` is about the donation itself and never changes as you click
  // around; `blocked` is about the current selection and comes and goes. Keeping
  // them apart is what stops the amount field appearing and vanishing mid-task.
  const matchable = !c.ignored && !fullyMatched;
  const selectable = matchable && !blocked;
  const units = unitLabel(c);

  // Partial matching: the field is on every matchable card, prefilled with the
  // full open amount, so "check it and go" still means a full match. Typing a
  // smaller number is what makes it partial; the parent selects the card off the
  // same keystroke.
  const editable = matchable && !!onAmountChange;
  // Typed values are whole trees. An untouched field shows the exact open
  // amount, which TTC can make fractional.
  const cap = Math.floor(available);
  const fieldValue = amount ?? String(available);
  const partial = amount !== undefined && (amount === '' || Number(amount) < available);

  const handleAmount = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const next = digits === '' ? '' : String(Math.min(Number.parseInt(digits, 10), cap));
    onAmountChange?.(c.id, next);
  };

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
        (!selectable && !c.ignored) && 'opacity-60',
        blocked && 'cursor-not-allowed',
      )}
    >
      <div className="flex items-center gap-2.5">
        {!c.ignored && (
          <Checkbox checked={checked} disabled={!selectable} className="pointer-events-none" />
        )}
        {/* The donation reference is the identity: ROs never see who donated. */}
        <span className="font-mono text-[15px] font-bold text-foreground truncate">{c.donation.uid}</span>
        <span className="ml-auto text-[15px] font-bold text-foreground whitespace-nowrap">{fmtTrees(c.units)} {units}</span>
      </div>

      <div className={cn('mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap', !c.ignored && 'pl-[26px]')}>
        <Calendar size={12} />
        <span className="whitespace-nowrap">Paid {fmtDate(c.donation.paymentDate)}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="whitespace-nowrap">{fmtAmount(toMajorAmount(c.donation.amount), c.donation.currency)}</span>
      </div>

      {/* units bar */}
      <div className={cn('mt-3', !c.ignored && 'pl-[26px]')}>
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">
            <span className="text-lg font-bold text-foreground leading-none">{fmtTrees(available)}</span> {units} to match
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{fmtTrees(c.unitsAllocated)}</span> matched
          </span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundImage: DASHED_TRACK }}>
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {editable && (
              // The card itself is the checkbox, so every event in here has to
              // stop short of it: a click must not toggle selection, and Space
              // inside the field must type a space, not re-toggle the card.
              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Input
                  type="text"
                  inputMode="numeric"
                  disabled={blocked}
                  aria-label={`Trees to match from donation ${c.donation.uid}`}
                  value={fieldValue}
                  onChange={(e) => handleAmount(e.target.value)}
                  className={cn(
                    'h-7 w-[72px] px-2 text-[13px] font-semibold tabular-nums',
                    partial && !blocked && 'border-primary/50',
                  )}
                />
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {partial ? `of ${fmtTrees(available)} ${units}` : units}
                </span>
                {partial && onAmountReset && (
                  <Button
                    size="sm" variant="ghost"
                    className="h-6 px-1.5 text-[11px] text-primary"
                    onClick={() => onAmountReset(c.id)}
                  >
                    Max
                  </Button>
                )}
              </div>
            )}
            {fullyMatched && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <Check size={11} /> fully matched
              </span>
            )}
            {c.ignored && (
              <Badge variant="outline" className="text-[10px] gap-1 rounded-full text-rose-700 border-rose-200 bg-rose-50">
                <BanIcon size={10} /> ignored
              </Badge>
            )}
          </div>
          {c.ignored ? (
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

        {c.ignored && c.ignoreReason && (
          <p className="mt-1.5 text-[11px] text-muted-foreground italic">{c.ignoreReason}</p>
        )}
      </div>
    </div>
  );
}
