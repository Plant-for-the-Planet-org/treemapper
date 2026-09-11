// Writing tabular downloads anywhere in the dashboard: CSV, XLSX and JSON.
//
// XLSX writing uses `write-excel-file`, not SheetJS (`xlsx`). The npm `xlsx`
// package is abandoned at 0.18.5 with two unpatched advisories
// (GHSA-4r6h-8v6p-xvw6 prototype pollution, GHSA-5pgg-2g8v-p4x9 ReDoS); the
// fixes only ever shipped on the vendor's own CDN, so npm has no upgrade path.
// `write-excel-file` is MIT, depends only on fflate, and is write-only, so it
// carries no spreadsheet parser to attack in the first place.

import writeXlsxFile from 'write-excel-file/browser'
import type { Row, SheetData } from 'write-excel-file/browser'

export type CellValue = string | number | boolean | Date | null | undefined
export type TableRow = Record<string, CellValue>

/** Kept as the old name so existing call sites read the same. */
export type CsvRow = TableRow

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick; Safari cancels the download if the URL dies first.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const withExtension = (filename: string, ext: string) =>
  filename.toLowerCase().endsWith(ext) ? filename : `${filename}${ext}`

// ---------------------------------------------------------------------- CSV

/** RFC 4180 quoting. Values containing quotes, commas or newlines are wrapped. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = typeof value === 'string' ? value : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(rows: TableRow[], headers?: string[]): string {
  if (!rows.length) return ''
  const cols = headers ?? Object.keys(rows[0])
  return [
    cols.map(csvCell).join(','),
    ...rows.map((row) => cols.map((col) => csvCell(row[col])).join(',')),
  ].join('\n')
}

export function downloadCsv(rows: TableRow[], filename: string, headers?: string[]) {
  // The BOM makes Excel open UTF-8 species names correctly instead of mojibake.
  const blob = new Blob(['\uFEFF' + toCsv(rows, headers)], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, withExtension(filename, '.csv'))
}

// --------------------------------------------------------------------- JSON

/**
 * Downloads any serialisable value as pretty-printed JSON.
 *
 * Unlike the CSV and XLSX writers this does not flatten anything, so callers
 * that hold nested data (geometry, species arrays, tree records) should pass
 * that structure directly rather than the flattened rows: keeping the nesting
 * is the whole reason to pick JSON over a spreadsheet.
 */
export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8;',
  })
  downloadBlob(blob, withExtension(filename, '.json'))
}

// --------------------------------------------------------------------- XLSX

export interface XlsxSheet {
  name: string
  rows: TableRow[]
  headers?: string[]
}

/** Widest a column is allowed to auto-size to, in characters. */
const MAX_COLUMN_WIDTH = 60
const MIN_COLUMN_WIDTH = 10

/**
 * Maps one value to a cell. Types are set explicitly rather than inferred, so a
 * column that is mostly numbers but has one blank does not flip Excel into
 * treating the whole column as text.
 */
function toCell(value: CellValue) {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) {
    // `write-excel-file` throws on a Date cell with no format, so never emit
    // one without it. Invalid dates would throw too, so they become blanks.
    return Number.isNaN(value.getTime()) ? null : { value, type: Date, format: 'yyyy-mm-dd' }
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { value, type: Number } : null
  }
  if (typeof value === 'boolean') return { value, type: Boolean }
  return { value: String(value), type: String }
}

/** Sizes each column to its widest cell, clamped so geometry blobs stay sane. */
function columnWidths(header: string[], rows: TableRow[]) {
  return header.map((key) => {
    const widest = rows.reduce((max, row) => {
      const cell = row[key]
      const text =
        cell === null || cell === undefined
          ? ''
          : cell instanceof Date
            ? '0000-00-00'
            : String(cell)
      return Math.max(max, text.length)
    }, key.length)
    return { width: Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, widest + 2)) }
  })
}

function toSheetData(sheet: XlsxSheet): { data: SheetData; header: string[] } {
  const header = sheet.headers ?? (sheet.rows.length ? Object.keys(sheet.rows[0]) : [])
  const headerRow: Row = header.map((key) => ({ value: key, type: String, fontWeight: 'bold' }))
  const body: Row[] = sheet.rows.map((row) => header.map((key) => toCell(row[key])))
  return { data: [headerRow, ...body], header }
}

/**
 * Writes a workbook with one sheet per entry. Sheet names are capped at the
 * 31 character limit Excel enforces.
 */
export async function downloadXlsx(sheets: XlsxSheet[], filename: string) {
  const blob = await writeXlsxFile(
    sheets.map((sheet) => {
      const { data, header } = toSheetData(sheet)
      return {
        sheet: sheet.name.slice(0, 31),
        data,
        columns: columnWidths(header, sheet.rows),
      }
    }),
  ).toBlob()

  downloadBlob(blob, withExtension(filename, '.xlsx'))
}
