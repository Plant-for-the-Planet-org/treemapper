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
  CloudAlert,
  CloudCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  status?: string;
  // capture completeness: 'complete' | 'partial' | 'incomplete'
  captureStatus: string;
  registrationDate: string;
  flag?: boolean;
  flagReason?: FlagReason[];
  hasRecords?: boolean;
  site?: { name: string; status?: string };
  treeCount: number;
  species?: Species[];
  // Intervention metadata blob (jsonb from the API). Holds `public` and
  // `private` sections; only `public` is surfaced on the card.
  metadata?: Record<string, unknown>;
}

interface PublicMetaField {
  label: string;
  value: string;
}

const isJsonObject = (str: string): boolean => {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
};

// Flatten the intervention's public metadata into a label/value list. Mirrors
// the parsing in the mobile InterventionMetaData component so the same answer
// shapes render consistently: plain strings, { value, label } entries, and
// JSON-encoded values that wrap their answer in `{ value }`. Private metadata
// is intentionally ignored here.
const getPublicMetadata = (metadata?: Record<string, unknown>): PublicMetaField[] => {
  const out: PublicMetaField[] = [];
  const pub = metadata?.public;
  if (!pub || typeof pub !== 'object' || Array.isArray(pub)) return out;

  Object.entries(pub as Record<string, unknown>).forEach(([key, value]) => {
    if (key === 'isEntireSite') return;

    if (typeof value === 'string') {
      if (value.trim()) out.push({ label: key, value });
      return;
    }

    if (value && typeof value === 'object') {
      const entry = value as { value?: unknown; label?: string };
      if (entry.value === undefined || entry.value === null || !entry.label) return;
      const rawValue = String(entry.value);
      const resolved = isJsonObject(rawValue)
        ? String((JSON.parse(rawValue) as { value?: unknown }).value ?? '')
        : rawValue;
      if (resolved.trim()) out.push({ label: entry.label, value: resolved });
    }
  });

  return out;
};

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


const formatDate = (d: string) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const InterventionCard = ({
  intervention, isSelected, onClick, isMultiSelectMode, isChecked, onToggleSelect, isDisabled, disabledTooltip,
}: InterventionCardProps) => {
  const IconComponent = interventionTypeIcons[intervention.type] || Target;
  const selected = (isSelected && !isMultiSelectMode) || isChecked;
  const isPlanning = intervention.status === 'planning';

  // NOTE (i18n): the number formatting ('en-US'), the "Tree" / "Trees"
  // pluralization, the title-casing of the type name and the date format are
  // all English-only. When the app adds multiple languages, move these to the
  // shared translation/locale layer (locale-aware number + plural rules).
  //
  // For tree-registration interventions the type name adds little; the tree
  // count is the meaningful headline (e.g. "1 Tree" / "240 Trees").
  const isTreeRegistration =
    intervention.type === 'single-tree-registration' ||
    intervention.type === 'multi-tree-registration';
  const title = isTreeRegistration
    ? `${intervention.treeCount.toLocaleString('en-US')} ${intervention.treeCount === 1 ? 'Tree' : 'Trees'}`
    : intervention.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Public form answers / metadata to surface on the card (all of them).
  const publicMeta = getPublicMetadata(intervention.metadata);

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
              <div className="absolute -top-1 -right-1">
                <FlagTooltip flagReasons={intervention.flagReason}>
                  <div className="w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-2 h-2 text-white" />
                  </div>
                </FlagTooltip>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header: title + HID (left) | status cloud and records (right) */}
            <div className="flex items-start justify-between mb-1.5 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-medium text-foreground text-sm leading-snug truncate">
                  {title}
                </h3>
                <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-foreground/80 flex-shrink-0">
                  {intervention.hid}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isPlanning ? (
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    Planning
                  </span>
                ) : intervention.captureStatus === 'complete' ? (
                  <CloudCheck className="h-3.5 w-3.5 text-primary" aria-label="Synced" />
                ) : (
                  <CloudAlert className="h-3.5 w-3.5 text-amber-600" aria-label="Not synced" />
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground">
              {intervention.site && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground/60" />
                  <span className="truncate">{intervention.site.name}</span>
                </div>
              )}

              {/* Combined meta line: date, trees, species */}
              <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground/60" />
                  <span>{formatDate(intervention.registrationDate)}</span>
                </span>
                {!isTreeRegistration && (
                  <span className="flex items-center gap-1">
                    <Trees className="h-3 w-3" />
                    <span className="font-medium text-foreground/80">{intervention.treeCount.toLocaleString('en-US')}</span>
                    <span>trees</span>
                  </span>
                )}
                {intervention.species && intervention.species.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    <span className="font-medium text-foreground/80">{intervention.species.length}</span>
                    <span>species</span>
                  </span>
                )}
              </div>

              {/* Public metadata: form answers and other public fields */}
              {publicMeta.length > 0 && (
                <div className="flex flex-col gap-0.5 pt-1 mt-0.5 border-t border-border/40">
                  {publicMeta.map((field) => (
                    <div key={field.label} className="flex items-start gap-1.5 min-w-0">
                      <span className="font-medium text-foreground/70 truncate max-w-[45%]">{field.label}:</span>
                      <span className="truncate">{field.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
