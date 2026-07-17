'use client'

import { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { format, startOfYear, endOfYear, subYears, subMonths, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: 'All time', get: () => null },
  { label: 'Last 12 months', get: () => ({ from: startOfDay(subMonths(new Date(), 12)), to: endOfDay(new Date()) }) },
  { label: 'This year', get: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
  { label: 'Last year', get: () => ({ from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) }) },
] as const;

interface Props {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

/** Filters plant locations by planting date. Local to TreeMatch: the header
 *  picker is bound to the shared intervention filter store, which this POC
 *  does not use. */
export function PlantingDateFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  // Hold the in-progress pick locally so the list only re-filters once a full
  // range is chosen.
  const [draft, setDraft] = useState<DateRange | undefined>(value);
  const range = open ? draft : value;

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(value);
    setOpen(next);
  };

  const handleSelect = (selected: DateRange | undefined) => {
    setDraft(selected);
    if (selected?.from && selected.to) {
      onChange(selected);
      setOpen(false);
    }
  };

  const clear = () => { setDraft(undefined); onChange(undefined); };

  const label = value?.from
    ? `${format(value.from, 'MMM d, yyyy')} - ${value.to ? format(value.to, 'MMM d, yyyy') : '...'}`
    : 'Any planting date';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-full justify-start gap-1.5 text-xs font-normal rounded-lg">
          <CalendarIcon size={13} className="flex-shrink-0" />
          <span className="truncate">{label}</span>
          {value?.from && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear planting date filter"
              onClick={(e) => { e.stopPropagation(); clear(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); clear(); } }}
              className="ml-auto rounded-sm hover:bg-muted flex-shrink-0"
            >
              <X size={12} />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex flex-col gap-0.5 p-2 border-r border-border min-w-[130px]">
            {PRESETS.map(preset => (
              <button
                key={preset.label}
                onClick={() => {
                  const dates = preset.get();
                  if (!dates) { clear(); setOpen(false); return; }
                  setDraft(dates);
                  onChange(dates);
                  setOpen(false);
                }}
                className={cn(
                  'text-left px-2.5 py-1.5 rounded-md text-xs transition-colors',
                  preset.label === 'All time' && !range
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
            defaultMonth={value?.from}
            disabled={{ after: new Date() }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
