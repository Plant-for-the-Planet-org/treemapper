'use client'

import { TreePine, TreeDeciduous, MapPin, Lock, Ban, ArrowLeftRight } from 'lucide-react';
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
  const Icon = isSingle ? TreeDeciduous : TreePine;
  const inactive = disabled || available === 0 || i.blocked;

  return (
    <div
      role="button"
      tabIndex={inactive ? -1 : 0}
      aria-disabled={inactive}
      onClick={() => { if (!inactive) onToggle(i.uid); }}
      onKeyDown={(e) => { if (!inactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onToggle(i.uid); } }}
      className={cn(
        'w-full text-left rounded-lg border bg-card p-3 transition-colors',
        inactive ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer hover:border-primary/40',
        checked ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : 'border-border',
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={checked} disabled={inactive} className="mt-0.5 pointer-events-none" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon size={15} className="text-primary flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate">{i.hid}</span>
            <Badge variant="secondary" className="text-[10px] font-normal">
              {isSingle ? 'single' : 'multi'}
            </Badge>
          </div>

          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} />
            <span className="truncate">{i.siteName || 'No site'}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{fmtDate(i.plantingDate)}</span>
          </div>

          {/* allocated / available bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{fmtNum(available)}</span> available
              </span>
              <span className="text-muted-foreground">{fmtNum(i.matchedTrees)} / {fmtNum(i.totalTrees)} matched</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {(i.blocked || i.crossProjectName || i.legacy) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {i.blocked && (
                <Badge variant="outline" className="text-[10px] gap-1 text-amber-700 border-amber-300 bg-amber-50">
                  <Ban size={10} /> blocked from matching
                </Badge>
              )}
              {i.crossProjectName && (
                <Badge variant="outline" className="text-[10px] gap-1 text-blue-700 border-blue-300 bg-blue-50">
                  <ArrowLeftRight size={10} /> {i.crossProjectName}
                </Badge>
              )}
              {i.legacy && (
                <Badge variant="outline" className="text-[10px] gap-1 text-purple-700 border-purple-300 bg-purple-50">
                  <Lock size={10} /> legacy holding
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
