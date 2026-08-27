const CDN_BASE = `${process.env.EXPO_PUBLIC_V3_CDN_BASE}/${process.env.EXPO_PUBLIC_MODE ?? 'development'}`

export function v3CdnUrl(folder: string, filename: string | null | undefined): string | null {
  if (!filename) return null
  if (/^https?:\/\//i.test(filename)) return filename
  return `${CDN_BASE}/${folder}/${filename}`
}

const LEGACY_PATHS: Record<string, string> = {
  tree: 'coordinate/large',
  species: 'species/default',
}

// Images uploaded before the v3 CDN migration still only exist on the old CDN.
// Use this as a fallback when the v3 url 404s, not as the primary source.
export function legacyCdnUrl(folder: string, filename: string | null | undefined): string | null {
  if (!filename) return null
  if (/^https?:\/\//i.test(filename)) return null
  const path = LEGACY_PATHS[folder]
  if (!path) return null
  return `${process.env.EXPO_PUBLIC_API_PROTOCOL}://cdn.plant-for-the-planet.org/media/cache/${path}/${filename}`
}
