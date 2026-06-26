import { formatDistanceToNowStrict } from 'date-fns'
import type { Platform, NetworkType } from './mockData'

export function platformLabel(os: Platform | string | null): string {
  if (!os) return 'Unknown'
  const lower = os.toLowerCase()
  if (lower === 'ios') return 'iOS'
  if (lower === 'android') return 'Android'
  return os
}

export function initials(name: string): string {
  if (!name) return 'U'
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function relativeTime(value: string | null): string {
  if (!value) return 'Never'
  try {
    return `${formatDistanceToNowStrict(new Date(value))} ago`
  } catch {
    return '-'
  }
}

export function timeUntil(value: string | null): string {
  if (!value) return '-'
  try {
    return `in ${formatDistanceToNowStrict(new Date(value))}`
  } catch {
    return '-'
  }
}

export function formatDate(value: string | null): string {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return '-'
  }
}

export function networkLabel(n: NetworkType): string {
  if (n === 'wifi') return 'Wi-Fi'
  if (n === 'cellular') return 'Cellular'
  return 'Offline'
}

/** Tailwind text colour for a 0-100 level where lower is worse. */
export function levelColor(pct: number, invert = false): string {
  const v = invert ? 100 - pct : pct
  if (v <= 20) return 'text-red-600'
  if (v <= 50) return 'text-amber-600'
  return 'text-green-600'
}

/** Tailwind bg colour for a progress bar where lower is worse. */
export function levelBar(pct: number, invert = false): string {
  const v = invert ? 100 - pct : pct
  if (v <= 20) return 'bg-red-500'
  if (v <= 50) return 'bg-amber-500'
  return 'bg-green-500'
}

export const deliveryRate = (delivered: number, recipients: number) =>
  recipients > 0 ? Math.round((delivered / recipients) * 100) : 0

export const openRate = (opened: number, delivered: number) =>
  delivered > 0 ? Math.round((opened / delivered) * 100) : 0
