'use client'

import { useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subQuarters, subYears } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useInterventionFilterStore } from '@shared-core/store/useInterventionFilterStore'

const PRESETS = [
  { label: 'All Time',   get: () => null },
  { label: 'Today',      get: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'This Week',  get: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }) },
  { label: 'This Month', get: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'This Year',  get: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
  { label: 'Last Quarter', get: () => ({ from: startOfQuarter(subQuarters(new Date(), 1)), to: endOfQuarter(subQuarters(new Date(), 1)) }) },
  { label: 'Last Year',  get: () => ({ from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) }) },
] as const

const toKey = (d: Date) => format(d, 'yyyy-MM-dd')

export default function InterventionDateRangePicker() {
  const { startDate, endDate, setDateRange, resetDateRange } = useInterventionFilterStore()
  const [open, setOpen] = useState(false)

  // The committed range from the store drives the actual list filter.
  const committed: DateRange | undefined = startDate
    ? { from: parseISO(startDate), to: endDate ? parseISO(endDate) : undefined }
    : undefined

  // While the popover is open we hold the in-progress pick locally so the
  // filter is not applied until the user has chosen a full range.
  const [draft, setDraft] = useState<DateRange | undefined>(committed)
  const range = open ? draft : committed

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(committed)
    setOpen(next)
  }

  const handlePreset = (preset: typeof PRESETS[number]) => {
    const dates = preset.get()
    if (dates) {
      setDraft({ from: dates.from, to: dates.to })
      setDateRange(toKey(dates.from), toKey(dates.to))
    } else {
      setDraft(undefined)
      resetDateRange()
      setOpen(false)
    }
  }

  // First click sets the start date; second click sets the end date. The filter
  // is committed only once a full range (a distinct end date) is chosen.
  const handleSelect = (selected: DateRange | undefined) => {
    if (!selected?.from) {
      setDraft(undefined)
      return
    }
    setDraft(selected)
    const start = toKey(selected.from)
    const end = selected.to ? toKey(selected.to) : ''
    if (end && end !== start) {
      setDateRange(start, end)
      setOpen(false)
    }
  }

  // The trigger reflects the committed (applied) filter, not the in-progress pick.
  const label = committed?.from
    ? committed.to && toKey(committed.from) !== toKey(committed.to)
      ? `${format(committed.from, 'MMM d, yyyy')} - ${format(committed.to, 'MMM d, yyyy')}`
      : format(committed.from, 'MMM d, yyyy')
    : 'All Time'

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
          <CalendarIcon size={14} />
          {label}
          {committed?.from && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setDraft(undefined); resetDateRange() }}
              className="ml-0.5 rounded-sm hover:bg-muted"
            >
              <X size={12} />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="flex flex-col gap-0.5 p-2 border-r border-border min-w-[120px]">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                className={cn(
                  'text-left px-2.5 py-1.5 rounded-md text-xs transition-colors',
                  (preset.label === 'All Time' && !range)
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted'
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
            disabled={{ after: new Date() }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
