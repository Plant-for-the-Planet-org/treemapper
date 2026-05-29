'use client'

import React from 'react';
import {
  Trees,
  Leaf,
  Shield,
  Sprout,
  Calendar,
  MapPin,
  Activity,
  Target,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FlagTooltip } from './FlagTooltip';
import { LucideIcon } from 'lucide-react';

export const interventionTypeIcons: Record<string, LucideIcon> = {
  'enrichment-planting': Trees,
  'direct-seeding': Sprout,
  'removal-invasive-species': Shield,
  'maintenance': Activity,
  'fencing': Shield,
  'fire-patrol': Shield,
  'soil-improvement': Leaf,
  'grass-suppression': Leaf,
  'single-tree-registration': Trees,
  'multi-tree-registration': Trees,
  'other-intervention': Target,
};

interface Species {
  count: number;
  [key: string]: unknown;
}

interface FlagReason {
  title: string;
  level: string;
  message: string;
  createdAt: string;
}

interface Intervention {
  id: string | number;
  uid: string;
  hid: string;
  type: string;
  captureStatus: string;
  registrationDate: string;
  flag?: boolean;
  flagReason?: FlagReason[];
  hasRecords?: boolean;
  site?: { name: string; status?: string };
  treeCount: number;
  species?: Species[];
}

interface InterventionCardProps {
  intervention: Intervention;
  isSelected: boolean;
  onClick: () => void;
  isMultiSelectMode?: boolean;
  isChecked?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  isDisabled?: boolean;
  disabledTooltip?: string;
}

const CAPTURE_STATUS: Record<string, string> = {
  complete: 'bg-primary/10 text-primary border-primary/20',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  incomplete: 'bg-destructive/10 text-destructive border-destructive/20',
};

const formatDate = (d: string) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const InterventionCard = ({
  intervention, isSelected, onClick, isMultiSelectMode, isChecked, onToggleSelect, isDisabled, disabledTooltip,
}: InterventionCardProps) => {
  const IconComponent = interventionTypeIcons[intervention.type] || Target;
  const selected = (isSelected && !isMultiSelectMode) || isChecked;

  return (
    <Card
      className={cn(
        'py-0 gap-0 transition-colors',
        isDisabled && isMultiSelectMode
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:bg-muted/50',
        selected ? 'bg-primary/10 border-primary/30' : 'border-border'
      )}
      title={isDisabled && isMultiSelectMode ? disabledTooltip : undefined}
      onClick={isMultiSelectMode ? (isDisabled ? undefined : onToggleSelect) : onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {isMultiSelectMode && (
            <div
              className="flex-shrink-0 mt-1"
              onClick={(e) => { e.stopPropagation(); if (!isDisabled) onToggleSelect?.(e); }}
            >
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                isChecked ? 'bg-primary border-primary' : 'border-border bg-background',
                isDisabled && 'opacity-50'
              )}>
                {isChecked && <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
            </div>
          )}
          <div className={cn(
            'relative p-2.5 rounded-lg flex-shrink-0',
            selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            <IconComponent className="h-4 w-4" />
            {intervention.flag && (
              <FlagTooltip flagReasons={intervention.flagReason}>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-2 h-2 text-white" />
                </div>
              </FlagTooltip>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2 gap-2">
              <h3 className="font-medium text-foreground text-sm leading-snug break-words">
                {intervention.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <Badge
                variant="outline"
                className={cn('text-xs flex-shrink-0', CAPTURE_STATUS[intervention.captureStatus])}
              >
                {intervention.captureStatus}
              </Badge>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-muted-foreground/60" />
                <span>{formatDate(intervention.registrationDate)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground/80">
                  {intervention.hid}
                </span>
                {intervention.hasRecords && (
                  <FileText className="h-3 w-3 text-primary" aria-label="Has Records" />
                )}
              </div>

              {intervention.site && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground/60" />
                  <span className="truncate">{intervention.site.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Trees className="h-3 w-3" />
                  <span className="font-medium text-foreground/80">{intervention.treeCount}</span>
                  <span>trees</span>
                </span>
                {intervention.species && intervention.species.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    <span className="font-medium text-foreground/80">{intervention.species.length}</span>
                    <span>species</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
