'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import type { DateRange as PickerRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { fmtDate, getDaysBefore, labelDate, parseDate, todayStr } from '../lib/format'

export interface DateRange {
  startDate: string
  endDate: string
}

const PRESETS = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: '5y', days: 365 * 5 },
  { label: 'All', days: 365 * 30 },
]

export function DateRangeControls({
  range,
  onChange,
}: {
  range: DateRange
  onChange: (next: DateRange) => void
}) {
  const [activePreset, setActivePreset] = useState<string>('1y')
  const [pickerRange, setPickerRange] = useState<PickerRange | undefined>({
    from: parseDate(range.startDate),
    to: parseDate(range.endDate),
  })

  const applyPreset = (label: string, days: number) => {
    const startDate = getDaysBefore(days)
    const endDate = todayStr()
    setActivePreset(label)
    setPickerRange({ from: parseDate(startDate), to: parseDate(endDate) })
    onChange({ startDate, endDate })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex">
        {PRESETS.map((preset, index) => (
          <Button
            key={preset.label}
            variant={activePreset === preset.label ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyPreset(preset.label, preset.days)}
            className={cn(
              'rounded-none',
              index === 0 && 'rounded-l-md',
              index === PRESETS.length - 1 && 'rounded-r-md',
              index !== 0 && 'border-l-0',
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            {labelDate(range.startDate)} to {labelDate(range.endDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            numberOfMonths={2}
            defaultMonth={parseDate(range.startDate)}
            selected={pickerRange}
            onSelect={(next: PickerRange | undefined) => {
              setPickerRange(next)
              setActivePreset('')
              if (next?.from && next?.to) {
                onChange({ startDate: fmtDate(next.from), endDate: fmtDate(next.to) })
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
