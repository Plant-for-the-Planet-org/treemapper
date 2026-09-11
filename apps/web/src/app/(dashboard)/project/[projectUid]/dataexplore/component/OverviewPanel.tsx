'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'react-toastify'
import { getDataExplorerTreesPlanted } from '@shared-core/fetchApi/api.fetch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState, SectionCard } from './primitives'
import { ChartToolbar } from './ChartToolbar'
import type { DateRange } from './DateRangeControls'
import type { ApiResponse } from '../lib/api'
import { fileDate, formatNumber, safeFileName } from '../lib/format'

export type Interval = 'days' | 'weeks' | 'months' | 'years'

interface Point {
  label: string
  periodStart: string
  periodEnd: string
  treesPlanted: number
  interventions: number
}

interface TreesPlantedPayload {
  interval: Interval
  startDate: string
  endDate: string
  data: Point[]
}

// Pixel heights, not height="100%": recharts 3 starts at height -1 and only
// learns a percentage after its ResizeObserver fires, which warns on first
// render. Kept on the chart rather than a wrapper div so there is one source.
const BAR_CHART_HEIGHT = 280
const AREA_CHART_HEIGHT = 240

const INTERVAL_LABELS: Record<Interval, string> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
  years: 'Years',
}

const ONE_YEAR = 365
const TWO_YEARS = ONE_YEAR * 2
const FIVE_YEARS = ONE_YEAR * 5

/**
 * Which intervals make sense for a given span. Same ladder the platform Data
 * Explorer used: daily bars stop being readable past a year, weekly past two,
 * monthly past five.
 */
export function allowedIntervals(range: DateRange): Interval[] {
  const start = new Date(range.startDate).getTime()
  const end = new Date(range.endDate).getTime()
  const days = Math.max(1, Math.round((end - start) / 86_400_000))

  if (days <= ONE_YEAR) return ['days', 'weeks', 'months', 'years']
  if (days <= TWO_YEARS) return ['weeks', 'months', 'years']
  if (days <= FIVE_YEARS) return ['months', 'years']
  return ['years']
}

function periodLabel(point: Point | undefined): string {
  if (!point) return ''
  const start = new Date(point.periodStart)
  const end = new Date(point.periodEnd)
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return start.toDateString() === end.toDateString() ? fmt(start) : `${fmt(start)} to ${fmt(end)}`
}

interface TooltipPayloadEntry {
  payload?: Point & Record<string, number>
}

function ChartTooltip({
  active,
  payload,
  valueKey,
  valueLabel,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  valueKey: string
  valueLabel: string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-popover-foreground">{periodLabel(point)}</p>
      <p className="text-muted-foreground mt-1">
        {valueLabel}: <span className="font-semibold text-foreground">
          {formatNumber(Number(payload[0]?.payload?.[valueKey] ?? 0))}
        </span>
      </p>
      {point ? (
        <p className="text-muted-foreground">
          Interventions: <span className="font-medium text-foreground">{formatNumber(point.interventions)}</span>
        </p>
      ) : null}
    </div>
  )
}

export function OverviewPanel({
  token,
  projectUid,
  projectName,
  range,
}: {
  token: string
  projectUid: string
  projectName: string
  range: DateRange
}) {
  const [interval, setInterval] = useState<Interval>('months')
  const [points, setPoints] = useState<Point[]>([])
  const [loading, setLoading] = useState(false)

  const barRef = useRef<HTMLDivElement | null>(null)
  const areaRef = useRef<HTMLDivElement | null>(null)

  const intervals = useMemo(() => allowedIntervals(range), [range])

  // Keep the selection legal when the range shrinks or grows.
  useEffect(() => {
    if (!intervals.includes(interval)) setInterval(intervals[0])
  }, [intervals, interval])

  useEffect(() => {
    if (!token || !projectUid) return
    let cancelled = false

    setLoading(true)
    getDataExplorerTreesPlanted(token, projectUid, {
      startDate: range.startDate,
      endDate: range.endDate,
      interval,
    })
      .then((res: ApiResponse<TreesPlantedPayload>) => {
        if (cancelled) return
        if (res?.statusCode === 200) {
          setPoints(res.data?.data ?? [])
          // The server steps the interval up when a series would be too long.
          const effective = res.data?.interval
          if (effective && effective !== interval && intervals.includes(effective)) {
            setInterval(effective)
          }
        } else {
          toast.error('Could not load trees planted')
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load trees planted')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, projectUid, range.startDate, range.endDate, interval])

  const cumulative = useMemo(() => {
    let running = 0
    return points.map((p) => {
      running += p.treesPlanted
      return { ...p, cumulativeTrees: running }
    })
  }, [points])

  const hasData = points.some((p) => p.treesPlanted > 0 || p.interventions > 0)

  const csvRows = useMemo(
    () =>
      cumulative.map((p) => ({
        period: p.label,
        period_start: p.periodStart.slice(0, 10),
        period_end: p.periodEnd.slice(0, 10),
        trees_planted: p.treesPlanted,
        interventions: p.interventions,
        cumulative_trees: p.cumulativeTrees,
      })),
    [cumulative],
  )

  const fileBase = `${safeFileName(projectName)}__Trees-Planted__${fileDate(range.startDate)}__${fileDate(range.endDate)}`

  const intervalSelect = (
    <Select value={interval} onValueChange={(value) => setInterval(value as Interval)}>
      <SelectTrigger size="sm" className="w-[130px]">
        <SelectValue placeholder="Interval" />
      </SelectTrigger>
      <SelectContent>
        {(['days', 'weeks', 'months', 'years'] as Interval[]).map((value) => (
          <SelectItem key={value} value={value} disabled={!intervals.includes(value)}>
            {INTERVAL_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className="space-y-6">
      <SectionCard
        title="Trees Planted"
        description="Trees recorded on interventions that started in the selected range."
        controls={
          <>
            {intervalSelect}
            <ChartToolbar containerRef={barRef} filename={fileBase} rows={csvRows} />
          </>
        }
      >
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : !hasData ? (
          <EmptyState message="No trees recorded in this range" />
        ) : (
          <div ref={barRef} className="w-full">
            <ResponsiveContainer width="100%" height={BAR_CHART_HEIGHT}>
              <BarChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  angle={points.length > 15 ? -60 : 0}
                  textAnchor={points.length > 15 ? 'end' : 'middle'}
                  height={points.length > 15 ? 60 : 30}
                />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={<ChartTooltip valueKey="treesPlanted" valueLabel="Trees planted" />}
                  cursor={{ fill: 'var(--muted)' }}
                />
                <Bar dataKey="treesPlanted" fill="var(--primary)" radius={[2, 2, 0, 0]} name="Trees planted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Cumulative Trees Planted"
        description="Running total across the selected range."
        controls={
          <ChartToolbar
            containerRef={areaRef}
            filename={`${safeFileName(projectName)}__Cumulative-Trees__${fileDate(range.startDate)}__${fileDate(range.endDate)}`}
            rows={csvRows}
          />
        }
      >
        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : !hasData ? (
          <EmptyState message="No trees recorded in this range" />
        ) : (
          <div ref={areaRef} className="w-full">
            <ResponsiveContainer width="100%" height={AREA_CHART_HEIGHT}>
              <AreaChart data={cumulative} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="deCumulativeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={<ChartTooltip valueKey="cumulativeTrees" valueLabel="Cumulative trees" />}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeTrees"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#deCumulativeFill)"
                  name="Cumulative trees"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
