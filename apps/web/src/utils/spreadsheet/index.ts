// Shared spreadsheet handling for the dashboard.
//
// Import side: `readTable` reads CSV, TSV and XLSX uploads into the same
// string-keyed rows, so an import screen supports Excel without changing its
// validation. Export side: `downloadCsv`, `downloadXlsx` and `downloadJson`.
//
// Neither side uses SheetJS (`xlsx`), which is abandoned on npm with unpatched
// advisories. See the header of each file for the details.

export type {
  TableData,
  ReadTableOptions,
} from './readTable'
export {
  readTable,
  isSpreadsheetFile,
  isLegacyExcelFile,
  SPREADSHEET_ACCEPT,
  SPREADSHEET_EXTENSIONS,
} from './readTable'

export type { CellValue, TableRow, CsvRow, XlsxSheet } from './writeTable'
export {
  downloadBlob,
  toCsv,
  downloadCsv,
  downloadJson,
  downloadXlsx,
} from './writeTable'
