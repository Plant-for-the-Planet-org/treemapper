'use client'

import { useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
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
] as const

const toKey = (d: Date) => format(d, 'yyyy-MM-dd')

export default function InterventionDateRangePicker() {
  const { startDate, endDate, setDateRange, resetDateRange } = useInterventionFilterStore()
  const [open, setOpen] = useState(false)

  const range: DateRange | undefined = startDate
    ? { from: parseISO(startDate), to: endDate ? parseISO(endDate) : parseISO(startDate) }
    : undefined

  const handlePreset = (preset: typeof PRESETS[number]) => {
    const dates = preset.get()
    if (dates) {
      setDateRange(toKey(dates.from), toKey(dates.to))
    } else {
      resetDateRange()
      setOpen(false)
    }
  }

  const handleSelect = (selected: DateRange | undefined) => {
    if (!selected?.from) return
    setDateRange(toKey(selected.from), selected.to ? toKey(selected.to) : toKey(selected.from))
    if (selected.to) setOpen(false)
  }

  const label = range?.from
    ? range.to && toKey(range.from) !== toKey(range.to)
      ? `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`
      : format(range.from, 'MMM d, yyyy')
    : 'All Time'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
          <CalendarIcon size={14} />
          {label}
          {range?.from && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); resetDateRange() }}
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
