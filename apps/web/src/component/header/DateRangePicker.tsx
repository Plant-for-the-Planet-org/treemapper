'use client'

import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@shared-core/store/useAnalyticsStore'

const PRESETS = [
  { label: 'All Time',   get: () => null },
  { label: 'Today',      get: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'This Week',  get: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }) },
  { label: 'This Month', get: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'This Year',  get: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
] as const

export default function DateRangePicker() {
  const { startDate, endDate, setGlobalStartDate, setGlobalEndDate } = useAnalyticsStore()
  const [open, setOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<string>('All Time')

  const range: DateRange | undefined = activePreset === 'All Time' ? undefined : {
    from: parseISO(endDate),
    to: parseISO(startDate),
  }

  const handlePreset = (preset: typeof PRESETS[number]) => {
    setActivePreset(preset.label)
    const dates = preset.get()
    if (dates) {
      setGlobalEndDate(dates.from.toISOString())
      setGlobalStartDate(dates.to.toISOString())
    }
    if (preset.label === 'All Time') setOpen(false)
  }

  const handleSelect = (selected: DateRange | undefined) => {
    if (!selected) return
    setActivePreset('')
    if (selected.from) setGlobalEndDate(selected.from.toISOString())
    if (selected.to) {
      setGlobalStartDate(selected.to.toISOString())
      setOpen(false)
    }
  }

  const label = activePreset
    ? activePreset
    : range?.from && range?.to
      ? `${format(range.from, 'MMM d, yyyy')} – ${format(range.to, 'MMM d, yyyy')}`
      : 'Select range'

  // TODO: enable once API supports date filtering on getProjectKPIs endpoint
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled className="h-8 gap-1.5 text-xs font-normal">
          <CalendarIcon size={14} />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Presets */}
          <div className="flex flex-col gap-0.5 p-2 border-r border-gray-100 min-w-[120px]">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                className={cn(
                  'text-left px-2.5 py-1.5 rounded-md text-xs transition-colors',
                  activePreset === preset.label
                    ? 'bg-[#007A49] text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {/* Calendar */}
          <div className={cn(activePreset === 'All Time' && 'opacity-40 pointer-events-none')}>
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleSelect}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
