const CDN_BASE = `${process.env.EXPO_PUBLIC_V3_CDN_BASE}/${process.env.EXPO_PUBLIC_MODE ?? 'development'}`

export function v3CdnUrl(folder: string, filename: string | null | undefined): string | null {
  if (!filename) return null
  if (/^https?:\/\//i.test(filename)) return filename
  return `${CDN_BASE}/${folder}/${filename}`
}
