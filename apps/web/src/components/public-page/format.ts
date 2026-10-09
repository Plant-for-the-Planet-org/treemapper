/**
 * Formatters shared by every block, so a number reads the same whichever theme
 * is rendering it.
 */

export function fmtNum(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0'
  return value.toLocaleString('en-US')
}

/** Tree counts can be fractional in places. Show decimals only when there are any. */
export function fmtTrees(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0'
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

export function fmtHectares(value: number | null | undefined): string {
  if (!value) return '0'
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

/** Returns a whole-number percentage, or null when there is nothing to divide by. */
export function pct(part: number, whole: number): number | null {
  if (!whole) return null
  return Math.round((part / whole) * 100)
}

export function fmtPercent(part: number, whole: number, fallback = 'n/a'): string {
  const value = pct(part, whole)
  return value === null ? fallback : `${value}%`
}

/** One decimal, used for survival where the difference between 89% and 89.4% matters. */
export function fmtRate(part: number, whole: number, fallback = 'n/a'): string {
  if (!whole) return fallback
  return `${((part / whole) * 100).toFixed(1)}%`
}

export function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function fmtShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function yearOf(iso: string | null | undefined): number | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date.getFullYear()
}

/**
 * Turns an intervention type enum (`assisted-natural-regeneration`) into
 * something a stranger can read. Deliberately mechanical: new types appear in
 * the schema regularly and must not need a lookup table kept in step.
 */
export function humanizeType(type: string): string {
  const cleaned = type.replace(/[-_]+/g, ' ').trim()
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

/** IUCN category codes come through in a few shapes. Render whatever arrives. */
export function humanizeStatus(status: string | null): string | null {
  if (!status) return null
  return humanizeType(status)
}

const THREATENED = new Set(['vulnerable', 'endangered', 'critically endangered', 'critically_endangered'])

export function isThreatened(status: string | null, isEndangered: boolean | null): boolean {
  if (isEndangered) return true
  if (!status) return false
  return THREATENED.has(status.toLowerCase().replace(/_/g, ' '))
}
