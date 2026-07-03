'use client'

import { TreePine, Sprout, MapPin, Lock, Ban, ArrowLeftRight, Map as MapIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MockIntervention, fmtNum, fmtDate } from './mockData';

interface Props {
  intervention: MockIntervention;
  checked: boolean;
  disabled?: boolean;
  onToggle: (uid: string) => void;
}

export function InterventionMatchCard({ intervention: i, checked, disabled, onToggle }: Props) {
  const available = Math.max(0, i.totalTrees - i.matchedTrees);
  const pct = i.totalTrees > 0 ? Math.round((i.matchedTrees / i.totalTrees) * 100) : 0;
  const isSingle = i.type === 'single-tree-registration';
  const Icon = isSingle ? Sprout : TreePine;
  const inactive = disabled || available === 0 || i.blocked;

  return (
    <div
      role="button"
      tabIndex={inactive ? -1 : 0}
      aria-disabled={inactive}
      onClick={() => { if (!inactive) onToggle(i.uid); }}
      onKeyDown={(e) => { if (!inactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onToggle(i.uid); } }}
      className={cn(
        'w-full text-left rounded-xl border bg-card px-4 py-3.5 transition-colors',
        inactive ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer hover:border-primary/40',
        checked ? 'border-primary/60 ring-1 ring-primary/25 bg-primary/5' : 'border-border',
      )}
    >
      <div className="flex items-center gap-2.5">
        <Checkbox checked={checked} disabled={inactive} className="pointer-events-none" />
        <Icon size={15} className={cn('flex-shrink-0', i.legacy ? 'text-amber-500' : isSingle ? 'text-primary/70' : 'text-primary')} />
        <span className="text-sm font-bold text-foreground truncate">{i.hid}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.08em] rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground flex-shrink-0">
          {isSingle ? 'single' : 'multi'}
        </span>
      </div>

      <div className="mt-1.5 pl-[26px] flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin size={12} className="flex-shrink-0" />
        <span className="truncate">{i.siteName || 'No site'}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="whitespace-nowrap">{fmtDate(i.plantingDate)}</span>
        <span className="text-muted-foreground/40">·</span>
        <MapIcon size={12} className="flex-shrink-0" />
        <span className="whitespace-nowrap">View on map</span>
      </div>

      {/* allocated / available bar */}
      <div className="mt-3 pl-[26px]">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">
            <span className="text-lg font-bold text-foreground leading-none">{fmtNum(available)}</span> available
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{fmtNum(i.matchedTrees)}</span> / {fmtNum(i.totalTrees)} matched
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-primary/15 overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>

        {(i.blocked || i.crossProjectName || i.legacy) && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {i.blocked && (
              <Badge variant="outline" className="text-[10px] gap-1 rounded-full text-amber-700 border-amber-200 bg-amber-50">
                <Ban size={10} /> blocked from matching
              </Badge>
            )}
            {i.crossProjectName && (
              <Badge variant="outline" className="text-[10px] gap-1 rounded-full text-blue-700 border-blue-200 bg-blue-50">
                <ArrowLeftRight size={10} /> {i.crossProjectName}
              </Badge>
            )}
            {i.legacy && (
              <Badge variant="outline" className="text-[10px] gap-1 rounded-full text-purple-700 border-purple-200 bg-purple-50">
                <Lock size={10} /> legacy holding
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
