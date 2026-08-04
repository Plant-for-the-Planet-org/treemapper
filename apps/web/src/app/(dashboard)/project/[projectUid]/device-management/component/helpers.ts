import { formatDistanceToNowStrict } from 'date-fns'

export function platformLabel(os: string | null): string {
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

export function networkLabel(n: string | null): string {
  if (n === 'wifi') return 'Wi-Fi'
  if (n === 'cellular') return 'Cellular'
  if (n === 'offline') return 'Offline'
  return 'Unknown'
}

/** Tailwind text colour for a 0-100 level where higher is worse. */
export function levelColor(pct: number): string {
  if (pct >= 85) return 'text-red-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-green-600'
}

/** Tailwind bg colour for a progress bar where higher is worse. */
export function levelBar(pct: number): string {
  if (pct >= 85) return 'bg-red-500'
  if (pct >= 60) return 'bg-amber-500'
  return 'bg-green-500'
}

/** Pulls a readable message off an unknown thrown value. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  return fallback
}

// Roles arrive as the raw enum value ('owner', 'project_admin').
export function roleLabel(role: string): string {
  if (!role) return 'Member'
  return role
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
