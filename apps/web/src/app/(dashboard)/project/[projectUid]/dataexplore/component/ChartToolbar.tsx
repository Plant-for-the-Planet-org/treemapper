'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { downloadChartPng, downloadChartSvg } from '../lib/chartImage'
import { downloadCsv } from '@/utils/spreadsheet'
import type { CsvRow } from '@/utils/spreadsheet'

/**
 * Restores the per-chart download menu the old ApexCharts toolbar gave us:
 * the plotted series as CSV, and the chart itself as PNG or SVG.
 */
export function ChartToolbar({
  containerRef,
  filename,
  rows,
  headers,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  filename: string
  rows: CsvRow[]
  headers?: string[]
}) {
  const [busy, setBusy] = useState(false)

  const withContainer = async (fn: (el: HTMLElement) => void | Promise<void>) => {
    const el = containerRef.current
    if (!el) return
    setBusy(true)
    try {
      await fn(el)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={busy}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => downloadCsv(rows, filename, headers)}
          disabled={rows.length === 0}
        >
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => withContainer((el) => downloadChartPng(el, filename))}>
          PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => withContainer((el) => downloadChartSvg(el, filename))}>
          SVG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
