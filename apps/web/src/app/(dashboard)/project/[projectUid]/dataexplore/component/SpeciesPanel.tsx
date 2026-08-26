'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import { toast } from 'react-toastify'
import { getDataExplorerSpeciesPlanted } from '@shared-core/fetchApi/api.fetch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState, SectionCard } from './primitives'
import { ChartToolbar } from './ChartToolbar'
import type { DateRange } from './DateRangeControls'
import { downloadCsv } from '@/utils/spreadsheet'
import type { ApiResponse } from '../lib/api'
import { fileDate, formatNumber, safeFileName } from '../lib/format'

interface SpeciesRow {
  scientificSpeciesUid: string | null
  scientificName: string | null
  commonName: string | null
  name: string
  isUnknown: boolean
  treeCount: number
  interventionCount: number
}

const CHART_LIMIT = 15

// Grows with the number of bars. A pixel value, not "100%" -- see the recharts
// note in CLAUDE.md.
const ROW_HEIGHT = 30
const MIN_CHART_HEIGHT = 220

export function SpeciesPanel({
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
  const [rows, setRows] = useState<SpeciesRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const chartRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!token || !projectUid) return
    let cancelled = false

    setLoading(true)
    getDataExplorerSpeciesPlanted(token, projectUid, {
      startDate: range.startDate,
      endDate: range.endDate,
      limit: 500,
    })
      .then((res: ApiResponse<{ totalTreeCount: number; data: SpeciesRow[] }>) => {
        if (cancelled) return
        if (res?.statusCode === 200) {
          setRows(res.data?.data ?? [])
          setTotal(res.data?.totalTreeCount ?? 0)
        } else {
          toast.error('Could not load species')
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load species')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, projectUid, range.startDate, range.endDate])

  const chartData = useMemo(
    () => rows.slice(0, CHART_LIMIT).map((r) => ({ name: r.name, treeCount: r.treeCount })),
    [rows],
  )

  const exportRows = useMemo(
    () =>
      rows.map((r) => ({
        species: r.name,
        scientific_name: r.scientificName ?? '',
        common_name: r.commonName ?? '',
        is_unknown_species: r.isUnknown,
        tree_count: r.treeCount,
        interventions: r.interventionCount,
        share_percent: total > 0 ? Number(((r.treeCount / total) * 100).toFixed(2)) : 0,
      })),
    [rows, total],
  )

  const chartHeight = Math.max(MIN_CHART_HEIGHT, chartData.length * ROW_HEIGHT)

  const fileBase = `${safeFileName(projectName)}__Species-Planted__${fileDate(range.startDate)}__${fileDate(range.endDate)}`

  return (
    <div className="space-y-6">
      <SectionCard
        title={`Top ${Math.min(CHART_LIMIT, rows.length) || CHART_LIMIT} Species by Trees Planted`}
        description="Counted from the species recorded on each intervention in the selected range."
        controls={<ChartToolbar containerRef={chartRef} filename={fileBase} rows={exportRows} />}
      >
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState message="No species recorded in this range" />
        ) : (
          <div ref={chartRef} className="w-full">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10, fontStyle: 'italic' }}
                  tickLine={false}
                  axisLine={false}
                  width={170}
                />
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value)), 'Trees']}
                  contentStyle={{ border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  cursor={{ fill: 'var(--muted)' }}
                />
                <Bar dataKey="treeCount" fill="var(--primary)" radius={[0, 2, 2, 0]} name="Trees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="All Species"
        description={`${formatNumber(rows.length)} species, ${formatNumber(total)} trees in range.`}
        controls={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={rows.length === 0}
            onClick={() => downloadCsv(exportRows, fileBase)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
        contentClassName="px-0"
      >
        {loading ? (
          <Skeleton className="h-52 w-full mx-6" />
        ) : rows.length === 0 ? (
          <EmptyState message="No species recorded in this range" />
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">Species</TableHead>
                  <TableHead className="px-6">Common name</TableHead>
                  <TableHead className="px-6 text-right">Trees</TableHead>
                  <TableHead className="px-6 text-right">Interventions</TableHead>
                  <TableHead className="px-6 text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.scientificSpeciesUid ?? `${row.name}-${index}`}>
                    <TableCell className="px-6">
                      <span className={row.isUnknown ? '' : 'italic'}>{row.name}</span>
                      {row.isUnknown ? (
                        <Badge variant="secondary" className="ml-2 text-xs font-normal">
                          unknown
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-6 text-muted-foreground">{row.commonName ?? '-'}</TableCell>
                    <TableCell className="px-6 text-right">{formatNumber(row.treeCount)}</TableCell>
                    <TableCell className="px-6 text-right">{formatNumber(row.interventionCount)}</TableCell>
                    <TableCell className="px-6 text-right">
                      {total > 0 ? `${((row.treeCount / total) * 100).toFixed(1)}%` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
