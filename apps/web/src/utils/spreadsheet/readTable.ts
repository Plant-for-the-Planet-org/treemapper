// Reading tabular uploads anywhere in the dashboard.
//
// Before this, every import surface parsed CSV itself with papaparse and
// rejected .xlsx outright, so anyone working in Excel had to remember to
// "Save as CSV" first. This reads both and hands back the same shape either
// way: a header list plus rows keyed by header, values as strings.
//
// Strings, not typed values, on purpose. Every downstream validator in the app
// already works on strings (`.trim()`, date regexes, `Number(...)` coercion),
// so keeping the contract identical to the old papaparse output means the
// import screens gain Excel support without their validation changing.
//
// Excel reading uses `read-excel-file` (MIT, no known advisories) rather than
// SheetJS, which is abandoned on npm with unpatched advisories. See
// ./writeTable.ts for the same reasoning on the writing side.

import Papa from 'papaparse'
import readXlsxFile from 'read-excel-file/browser'

export interface TableData {
  headers: string[]
  rows: Record<string, string>[]
  /** Total data rows in the file, ignoring any `preview` limit. */
  rowCount: number
  /** Name of the sheet the rows came from. Undefined for CSV and TSV. */
  sheetName?: string
  /** Every sheet in the workbook, so a caller can offer a picker. */
  sheetNames?: string[]
}

export interface ReadTableOptions {
  /** Stop after this many data rows. Used to sample headers for mapping dialogs. */
  preview?: number
  /**
   * How to render date cells that Excel hands back as `Date` objects.
   * CSV is untouched by this: its dates are already text.
   *
   * `iso` gives YYYY-MM-DD, which sorts and parses correctly and is what most
   * of the dashboard expects. `dayFirst` gives DD/MM/YYYY for the older bulk
   * upload flow, whose template and validator both use that format.
   */
  dateFormat?: 'iso' | 'dayFirst'
  /** Applied to each header before it becomes a row key. Defaults to trimming. */
  transformHeader?: (header: string) => string
  /** Applied to each cell value after it is stringified. */
  transformValue?: (value: string, header: string) => string
}

/** File extensions the dashboard accepts for tabular uploads. */
export const SPREADSHEET_EXTENSIONS = ['.csv', '.tsv', '.xlsx'] as const

/** Ready to drop into an `<input type="file" accept=...>`. */
export const SPREADSHEET_ACCEPT = SPREADSHEET_EXTENSIONS.join(',')

export function isSpreadsheetFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return SPREADSHEET_EXTENSIONS.some((ext) => name.endsWith(ext))
}

function isExcelFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.xlsx')
}

/**
 * `.xls` is the old binary format, which `read-excel-file` cannot read. Callers
 * use this to tell the user what to do instead of showing "unsupported file".
 */
export function isLegacyExcelFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.xls')
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * UTC getters, not local ones. An Excel date cell is a timezone-less calendar
 * date, and `read-excel-file` hands it back as midnight UTC on that day. Read
 * with local getters, a browser west of UTC sees the previous day, so every
 * imported date would silently shift back by one for users in the Americas.
 */
function formatDate(date: Date, format: 'iso' | 'dayFirst'): string {
  const year = date.getUTCFullYear()
  const month = pad(date.getUTCMonth() + 1)
  const day = pad(date.getUTCDate())
  return format === 'dayFirst' ? `${day}/${month}/${year}` : `${year}-${month}-${day}`
}

/**
 * Excel cells arrive typed. Numbers are stringified plainly so an ID like
 * 1234567890123 does not reach a validator as "1.234567890123e+12".
 */
function stringifyCell(value: unknown, dateFormat: 'iso' | 'dayFirst'): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return formatDate(value, dateFormat)
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function buildRows(
  headers: string[],
  dataRows: string[][],
  transformValue?: (value: string, header: string) => string,
): Record<string, string>[] {
  return dataRows.map((cells) => {
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      if (!header) return
      const raw = cells[index] ?? ''
      row[header] = transformValue ? transformValue(raw, header) : raw
    })
    return row
  })
}

/** True when every cell in the row is blank, which Excel produces liberally. */
const isBlankRow = (cells: unknown[]) =>
  cells.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')

async function readExcel(file: File, options: ReadTableOptions): Promise<TableData> {
  const dateFormat = options.dateFormat ?? 'iso'
  const transformHeader = options.transformHeader ?? ((h: string) => h.trim())

  // No schema: we want the sheet as-is and do our own coercion, so a column the
  // caller did not anticipate still comes through rather than being dropped.
  const workbook = (await readXlsxFile(file)) as unknown as {
    sheet: string
    data: unknown[][]
  }[]

  const sheetNames = workbook.map((s) => s.sheet)

  // A workbook whose first tab is a blank cover sheet is common, so take the
  // first tab that actually has rows rather than assuming index 0.
  const chosen =
    workbook.find((s) => s.data.some((cells) => !isBlankRow(cells))) ?? workbook[0]

  if (!chosen) return { headers: [], rows: [], rowCount: 0, sheetNames }

  const nonEmpty = chosen.data.filter((cells) => Array.isArray(cells) && !isBlankRow(cells))
  if (nonEmpty.length === 0) {
    return { headers: [], rows: [], rowCount: 0, sheetName: chosen.sheet, sheetNames }
  }

  const headers = (nonEmpty[0] ?? []).map((cell) =>
    transformHeader(stringifyCell(cell, dateFormat)),
  )

  const body = nonEmpty
    .slice(1)
    .map((cells) => cells.map((cell) => stringifyCell(cell, dateFormat)))

  const limited = options.preview ? body.slice(0, options.preview) : body

  return {
    headers: headers.filter(Boolean),
    rows: buildRows(headers, limited, options.transformValue),
    rowCount: body.length,
    sheetName: chosen.sheet,
    sheetNames,
  }
}

function readCsv(file: File, options: ReadTableOptions): Promise<TableData> {
  const transformHeader = options.transformHeader ?? ((h: string) => h.trim())

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      // 'greedy' also drops rows that are only separators, which trailing
      // newlines in exported sheets produce constantly.
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      transformHeader,
      transform: options.transformValue
        ? (value: string, field: string | number) =>
            options.transformValue!(value, String(field))
        : undefined,
      complete: (result) => {
        const headers = (result.meta.fields ?? []).filter(Boolean)
        const rows = result.data
        resolve({
          headers,
          rows: options.preview ? rows.slice(0, options.preview) : rows,
          rowCount: rows.length,
        })
      },
      error: reject,
    })
  })
}

/**
 * Reads a CSV, TSV or XLSX upload into headers plus string-keyed rows.
 *
 * Throws for `.xls` and anything else unsupported, with a message meant to be
 * shown to the user directly.
 */
export async function readTable(
  file: File,
  options: ReadTableOptions = {},
): Promise<TableData> {
  if (isLegacyExcelFile(file)) {
    throw new Error(
      'The old .xls format is not supported. Open the file in Excel and save it as .xlsx or .csv.',
    )
  }
  if (!isSpreadsheetFile(file)) {
    throw new Error(`Unsupported file type. Upload one of: ${SPREADSHEET_EXTENSIONS.join(', ')}.`)
  }

  return isExcelFile(file) ? readExcel(file, options) : readCsv(file, options)
}
