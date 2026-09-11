'use client'

import { useMemo, useState } from 'react'
import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { toast } from 'react-toastify'
import { exportAllData } from '@shared-core/fetchApi/api.fetch'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SectionCard } from './primitives'
import { DateRangeControls } from './DateRangeControls'
import type { DateRange } from './DateRangeControls'
import { downloadCsv, downloadJson, downloadXlsx } from '@/utils/spreadsheet'
import type { ApiResponse } from '../lib/api'
import type { ExportedIntervention } from '../lib/exportColumns'
import {
  INTERVENTION_COLUMNS,
  INTERVENTION_HEADERS,
  TREE_COLUMNS,
  TREE_HEADERS,
  buildInterventionRows,
  buildTreeRows,
  readmeRows,
} from '../lib/exportColumns'
import { fileDate, formatNumber, safeFileName } from '../lib/format'

type Format = 'xlsx' | 'csv' | 'json'

export function ExportPanel({
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
  // The export gets its own range, so you can chart one window and export
  // another without losing your place. It starts from the page range.
  const [exportRange, setExportRange] = useState<DateRange>(range)
  const [format, setFormat] = useState<Format>('xlsx')
  const [includeTrees, setIncludeTrees] = useState(true)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)

  const fileBase = useMemo(
    () =>
      `${safeFileName(projectName)}__${fileDate(exportRange.startDate)}__${fileDate(exportRange.endDate)}`,
    [projectName, exportRange],
  )

  const handleExport = async () => {
    if (!token || !projectUid) return
    setBusy(true)
    setLastResult(null)

    try {
      const res: ApiResponse<{ interventions: ExportedIntervention[] }> = await exportAllData(
        token,
        {
          startDate: exportRange.startDate,
          endDate: exportRange.endDate,
          includeDeleted,
        },
        projectUid,
      )

      if (res?.statusCode !== 200 && res?.statusCode !== 201) {
        toast.error(res?.message || 'Export failed')
        return
      }

      const interventions = res.data?.interventions ?? []
      if (interventions.length === 0) {
        toast.warn(
          'No data for this range. Try a different window, or check the data for that period was recorded.',
        )
        return
      }

      // Flattening is only for the spreadsheet formats. JSON ships the payload
      // as it came back, so there is no point building rows for it.
      const interventionRows = format === 'json' ? [] : buildInterventionRows(interventions)
      const treeRows = format === 'json' || !includeTrees ? [] : buildTreeRows(interventions)

      if (format === 'json') {
        // JSON keeps the API payload's nesting (species arrays, tree records,
        // GeoJSON geometry) instead of flattening it into rows, which is the
        // only reason to choose it over a spreadsheet.
        downloadJson(
          {
            project: projectName,
            startDate: exportRange.startDate,
            endDate: exportRange.endDate,
            exportedAt: new Date().toISOString(),
            includeDeleted,
            totalInterventions: interventions.length,
            interventions: includeTrees
              ? interventions
              : interventions.map((item) => {
                  const withoutTrees = { ...item }
                  delete withoutTrees.trees
                  return withoutTrees
                }),
          },
          fileBase,
        )
      } else if (format === 'xlsx') {
        const sheets = [
          { name: 'Intervention Data', rows: interventionRows, headers: INTERVENTION_HEADERS },
          ...(includeTrees && treeRows.length > 0
            ? [{ name: 'Sample Trees', rows: treeRows, headers: TREE_HEADERS }]
            : []),
          {
            name: 'READ ME',
            rows: [
              ...readmeRows(INTERVENTION_COLUMNS),
              ...(includeTrees && treeRows.length > 0 ? readmeRows(TREE_COLUMNS) : []),
            ],
            headers: ['column_title', 'description'],
          },
        ]
        await downloadXlsx(sheets, fileBase)
      } else {
        downloadCsv(interventionRows, `${fileBase}__interventions`, INTERVENTION_HEADERS)
        if (includeTrees && treeRows.length > 0) {
          downloadCsv(treeRows, `${fileBase}__sample-trees`, TREE_HEADERS)
        }
      }

      setLastResult(
        format === 'json'
          ? `${formatNumber(interventions.length)} interventions as JSON`
          : `${formatNumber(interventions.length)} interventions, ${formatNumber(interventionRows.length)} rows` +
            (treeRows.length > 0 ? `, ${formatNumber(treeRows.length)} sample trees` : ''),
      )
      toast.success('Export ready')
    } catch {
      toast.error('Export failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Export Data"
        description="One row per intervention per species, the same shape the platform Data Explorer produced."
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value="interventions" onValueChange={() => undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interventions">Interventions</SelectItem>
                  <SelectItem value="monitoring-plots" disabled>
                    Monitoring plots (soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Format</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as Format)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel workbook with READ ME sheet</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON, keeps nested species and trees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date range</Label>
            <div>
              <DateRangeControls range={exportRange} onChange={setExportRange} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={includeTrees}
                onCheckedChange={(value) => setIncludeTrees(value === true)}
              />
              Include sample tree records
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={includeDeleted}
                onCheckedChange={(value) => setIncludeDeleted(value === true)}
              />
              Include deleted records
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleExport} disabled={busy} className="gap-2">
              {format === 'xlsx' ? (
                <FileSpreadsheet className="h-4 w-4" />
              ) : format === 'json' ? (
                <FileJson className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {busy ? 'Preparing...' : 'Export'}
            </Button>
            {lastResult ? (
              <span className="text-xs text-muted-foreground">Last export: {lastResult}</span>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="What is in the file"
        description="Columns in the CSV and Excel formats. The workbook ships this same list as a READ ME sheet, so whoever opens it can read the columns without asking. JSON keeps the original nested shape instead."
        contentClassName="px-0"
      >
        <div className="max-h-[420px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Column</TableHead>
                <TableHead className="px-6">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INTERVENTION_COLUMNS.map((column) => (
                <TableRow key={column.key}>
                  <TableCell className="px-6 font-mono text-xs">{column.key}</TableCell>
                  <TableCell className="px-6 text-muted-foreground">{column.description}</TableCell>
                </TableRow>
              ))}
              {includeTrees
                ? TREE_COLUMNS.map((column) => (
                    <TableRow key={`tree-${column.key}`}>
                      <TableCell className="px-6 font-mono text-xs">
                        {column.key}
                        <span className="ml-2 text-[10px] text-muted-foreground">sample trees</span>
                      </TableCell>
                      <TableCell className="px-6 text-muted-foreground">{column.description}</TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  )
}
