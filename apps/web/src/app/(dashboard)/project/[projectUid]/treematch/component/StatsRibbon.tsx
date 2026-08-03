'use client'

import React from 'react';
import { CheckCircle2, Info, Link2, Sprout } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { fmtTrees } from './types';

const Stat = ({
  icon: Icon, label, value, iconClass, valueClass, description,
}: {
  icon: React.ElementType; label: string; value: string;
  iconClass: string; valueClass?: string; description: string;
}) => (
  <div className="flex items-center gap-3 px-4 py-3.5 min-w-0">
    <div className={cn('h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0', iconClass)}>
      <Icon size={17} />
    </div>
    <div className="min-w-0">
      <div className={cn('text-2xl font-bold tracking-tight leading-none', valueClass ?? 'text-foreground')}>{value}</div>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info size={11} className="text-muted-foreground/70 cursor-help flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="bottom">{description}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </div>
);

interface Props {
  planted: number;
  matched: number;
  unmatched: number;
  /** summed over the donations loaded so far, not the whole project */
  openDonationTrees: number;
  /** set only when the locations pane is pointed at another project, so the
   * planted total describes that one and has to say which */
  sourceProjectName?: string;
}

export function StatsRibbon({
  planted, matched, unmatched, openDonationTrees, sourceProjectName,
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-background grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-border overflow-hidden">
      <Stat
        icon={Sprout} label="Trees planted" value={fmtTrees(planted)}
        iconClass="bg-primary/10 text-primary"
        description={sourceProjectName
          ? `Total trees recorded across all plant locations in ${sourceProjectName}, matched and unmatched combined.`
          : 'Total trees recorded across all plant locations in this project, matched and unmatched combined.'}
      />
      <Stat
        icon={CheckCircle2} label="Matched" value={fmtTrees(matched)}
        iconClass="bg-primary/10 text-primary" valueClass="text-primary"
        description="Planted trees already claimed by a donation, across every plant location shown in this pane."
      />
      <Stat
        icon={Sprout} label="Unmatched trees" value={fmtTrees(unmatched)}
        iconClass="bg-amber-500/10 text-amber-600"
        description="Planted trees not yet linked to a donation. Trees planted minus matched."
      />
      <Stat
        icon={Link2} label="Open donation trees" value={fmtTrees(openDonationTrees)}
        iconClass="bg-primary/10 text-primary"
        description="Trees paid for by donors that have not yet been linked to a planted location. Sums the donations loaded so far."
      />
    </div>
  );
}
