// Formatting helpers shared by the Data Explorer widgets.

const ONE_THOUSAND = 1_000
const ONE_MILLION = 1_000_000
const ONE_BILLION = 1_000_000_000
const ONE_TRILLION = 1_000_000_000_000

/**
 * Short form for the big counters: 1.2k, 3.4m, 1b. Matches the platform Data
 * Explorer, which used the same suffixes so screenshots stay comparable.
 */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '0'
  const abs = Math.abs(value)
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, '')

  if (abs >= ONE_TRILLION) return `${trim(value / ONE_TRILLION)}t`
  if (abs >= ONE_BILLION) return `${trim(value / ONE_BILLION)}b`
  if (abs >= ONE_MILLION) return `${trim(value / ONE_MILLION)}m`
  if (abs >= ONE_THOUSAND) return `${trim(value / ONE_THOUSAND)}k`
  return String(Math.round(value))
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return value.toLocaleString()
}

/** YYYY-MM-DD in local time. Date inputs and the API both expect this. */
export function fmtDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function todayStr(): string {
  return fmtDate(new Date())
}

export function getDaysBefore(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return fmtDate(d)
}

/** Parses YYYY-MM-DD as a local date, avoiding the UTC shift of new Date(str). */
export function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function labelDate(value: string): string {
  return parseDate(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** dd-MMM-yy, used in export filenames so they sort and read like the old ones. */
export function fileDate(value: string): string {
  const d = parseDate(value)
  const month = d.toLocaleDateString('en-GB', { month: 'short' })
  return `${String(d.getDate()).padStart(2, '0')}-${month}-${String(d.getFullYear()).slice(-2)}`
}

/** Strips characters that break filenames on Windows and macOS. */
export function safeFileName(value: string): string {
  return (value || 'project').replace(/[\\/:*?"<>|]+/g, '-').trim()
}
