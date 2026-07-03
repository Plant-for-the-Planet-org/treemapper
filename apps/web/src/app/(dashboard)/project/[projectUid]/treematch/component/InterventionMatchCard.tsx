'use client'

import { TreePine, Sprout, Lock, Ban, ArrowLeftRight, Map as MapIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MockIntervention, fmtNum, fmtDate } from './mockData';

interface Props {
  intervention: MockIntervention;
  checked: boolean;
  disabled?: boolean;
  onToggle: (uid: string) => void;
  /** switch to the map view focused on this location */
  onViewMap?: (uid: string) => void;
}

export function InterventionMatchCard({ intervention: i, checked, disabled, onToggle, onViewMap }: Props) {
  const available = Math.max(0, i.totalTrees - i.matchedTrees);
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
        'group w-full text-left rounded-xl border bg-card px-4 py-3 transition-colors',
        inactive ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer hover:border-primary/40',
        checked ? 'border-primary/60 ring-1 ring-primary/25 bg-primary/5' : 'border-border',
      )}
    >
      {/* Line 1: HID · available  ···  tags + map */}
      <div className="flex items-center gap-2">
        <Checkbox checked={checked} disabled={inactive} className="pointer-events-none flex-shrink-0" />
        <Icon size={15} className={cn('flex-shrink-0', i.legacy ? 'text-amber-500' : isSingle ? 'text-primary/70' : 'text-primary')} />
        <span className="text-sm font-bold text-foreground truncate min-w-0">{i.hid}</span>
        <span className="text-muted-foreground/40 flex-shrink-0">·</span>
        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
          <span className="font-semibold text-foreground">{fmtNum(available)}</span> available
        </span>
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          {onViewMap && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onViewMap(i.uid); }}
              title="View on map"
              aria-label="View on map"
              className="flex items-center justify-center rounded-md p-1 text-muted-foreground transition-[color,background-color,opacity] hover:bg-muted hover:text-primary focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
            >
              <MapIcon size={14} />
            </button>
          )}
          {i.blocked && (
            <Badge variant="outline" className="text-[10px] gap-1 rounded-full text-amber-700 border-amber-200 bg-amber-50">
              <Ban size={10} /> blocked
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
      </div>

      {/* Line 2: site · date  ···  matched / total */}
      <div className="mt-1.5 pl-[26px] flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="truncate">{i.siteName || 'No site'}</span>
        <span className="text-muted-foreground/40 flex-shrink-0">·</span>
        <span className="whitespace-nowrap flex-shrink-0">{fmtDate(i.plantingDate)}</span>
        <span className="ml-auto whitespace-nowrap flex-shrink-0">
          <span className="font-semibold text-foreground">{fmtNum(i.matchedTrees)}</span> / {fmtNum(i.totalTrees)} matched
        </span>
      </div>
    </div>
  );
}
