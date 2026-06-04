const CDN_BASE = process.env.NEXT_PUBLIC_CDN ?? ''

/**
 * Build a full CDN URL for a stored filename.
 * - Already-full URLs (http/https) are returned unchanged.
 * - Null / undefined / empty values return null.
 */
export function cdnUrl(folder: string, filename: string | null | undefined): string | null {
  if (!filename) return null
  if (/^https?:\/\//i.test(filename)) return filename
  return `${CDN_BASE}/${folder}/${filename}`
}
