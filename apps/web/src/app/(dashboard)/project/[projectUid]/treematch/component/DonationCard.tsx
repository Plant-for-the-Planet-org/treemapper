'use client'

import { Calendar, Wallet, EyeOff, Ban as BanIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MockContribution, fmtNum, fmtDate, donorLabel } from './mockData';

const PRIORITY_STYLE: Record<MockContribution['priority'], string> = {
  automatic: 'text-emerald-700 border-emerald-300 bg-emerald-50',
  first: 'text-indigo-700 border-indigo-300 bg-indigo-50',
  manual: 'text-slate-700 border-slate-300 bg-slate-50',
  never: 'text-rose-700 border-rose-300 bg-rose-50',
};

interface Props {
  contribution: MockContribution;
  checked: boolean;
  onToggle: (uid: string) => void;
  onIgnore?: (uid: string) => void;
  onRestore?: (uid: string) => void;
}

export function DonationCard({ contribution: c, checked, onToggle, onIgnore, onRestore }: Props) {
  const available = Math.max(0, c.units - c.allocated);
  const pct = c.units > 0 ? Math.round((c.allocated / c.units) * 100) : 0;
  const fullyMatched = available === 0;
  const partly = c.allocated > 0 && available > 0;
  const selectable = !c.ignored && !fullyMatched && c.priority !== 'never';

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 transition-colors',
        checked ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : 'border-border',
        (!selectable && !c.ignored) && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        {!c.ignored && (
          <Checkbox
            checked={checked}
            disabled={!selectable}
            onCheckedChange={() => onToggle(c.uid)}
            className="mt-0.5"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">{donorLabel(c.donor)}</span>
              {c.private && (
                <Badge variant="outline" className="text-[10px] gap-1 text-purple-700 border-purple-300 bg-purple-50">
                  <EyeOff size={10} /> private
                </Badge>
              )}
            </div>
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">{fmtNum(c.units)} trees</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <span className="font-mono text-[10px] text-muted-foreground/80">{c.uid}</span>
            <span className="text-muted-foreground/50">•</span>
            <Calendar size={12} />
            <span>Paid {fmtDate(c.date)}</span>
            <span className="text-muted-foreground/50">•</span>
            <Wallet size={12} />
            <span className="truncate">{c.payout}</span>
          </div>

          {/* units bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{fmtNum(available)}</span> trees to match
              </span>
              <span className="text-muted-foreground">
                {fmtNum(c.allocated)} matched
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              <Badge variant="outline" className={cn('text-[10px] capitalize', PRIORITY_STYLE[c.priority])}>
                {c.priority}
              </Badge>
              {fullyMatched && <Badge variant="secondary" className="text-[10px]">fully matched</Badge>}
              {partly && <Badge variant="secondary" className="text-[10px]">partial</Badge>}
              {c.ignored && (
                <Badge variant="outline" className="text-[10px] gap-1 text-rose-700 border-rose-300 bg-rose-50">
                  <BanIcon size={10} /> ignored
                </Badge>
              )}
            </div>
            {c.ignored ? (
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => onRestore?.(c.uid)}>
                Restore
              </Button>
            ) : (
              onIgnore && !fullyMatched && (
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-muted-foreground" onClick={() => onIgnore(c.uid)}>
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
    </div>
  );
}
