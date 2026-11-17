/**
 * Web-side mirror of the server contract in
 * `apps/server/src/public-page/public-page.types.ts`.
 *
 * Kept as a separate declaration rather than imported, because `apps/web` does
 * not depend on `apps/server`. If you change one, change the other.
 */

export const PUBLIC_PAGE_THEMES = ['report', 'story', 'full', 'academy'] as const
export type PublicPageTheme = (typeof PUBLIC_PAGE_THEMES)[number]

export type PublicPageGeoDetail = 'site' | 'fuzzed' | 'exact'

/**
 * Every block a page can be built from, in the order the editor offers them.
 *
 * This list is the contract, so it lives here rather than in `themes.ts`:
 * the server validates a saved arrangement against the same names.
 */
export const PUBLIC_PAGE_BLOCK_IDS = [
  'hero',
  'anchorNav',
  'numbers',
  'verification',
  'narrative',
  'map',
  'photos',
  'species',
  'monitoring',
  'work',
  'timeline',
  'people',
  'badges',
  'text',
  'image',
  'detailSeam',
  'data',
  'share',
  'footer',
] as const
export type PublicPageBlockId = (typeof PUBLIC_PAGE_BLOCK_IDS)[number]

export type PublicPageSurface = 'base' | 'detail'

export const PUBLIC_PAGE_MAX_BLOCKS = 40
export const PUBLIC_PAGE_TEXT_HEADING_MAX = 120
export const PUBLIC_PAGE_TEXT_BODY_MAX = 2000
export const PUBLIC_PAGE_IMAGE_CAPTION_MAX = 200
export const PUBLIC_PAGE_IMAGE_ALT_MAX = 200

/**
 * The only image value a public page stores: a bare filename exactly as the
 * presign upload returns it, in the `project` folder. Never a URL, because
 * `cdnUrl` passes URLs through unchanged. The server enforces the same rule;
 * this copy lets the client refuse early and render defensively.
 */
export const PUBLIC_PAGE_IMAGE_FILENAME = /^\d{10,16}-[a-z0-9]{1,12}\.(jpg|jpeg|png|gif|webp)$/

export function isPublicPageImage(value: unknown): value is string {
  return typeof value === 'string' && PUBLIC_PAGE_IMAGE_FILENAME.test(value)
}

/** Most photos a project can choose for the "From the field" block. */
export const PUBLIC_PAGE_PHOTO_PICKS_MAX = 12

/** Where a photo lives in storage. `project` is an upload made for the page. */
export const PUBLIC_PAGE_PHOTO_FOLDERS = ['tree', 'intervention', 'site', 'project'] as const
export type PublicPagePhotoFolder = (typeof PUBLIC_PAGE_PHOTO_FOLDERS)[number]

/** A field photo's stored filename: a bare name, never a URL or a path. */
export const PUBLIC_PAGE_FIELD_PHOTO_FILENAME =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,200}\.(jpg|jpeg|png|gif|webp)$/i

/** One photo chosen for the photos block. `caption` replaces the automatic one. */
export interface PublicPagePhotoPick {
  folder: PublicPagePhotoFolder
  image: string
  caption?: string
}

export function isPublicPagePhotoPick(value: unknown): value is PublicPagePhotoPick {
  if (!value || typeof value !== 'object') return false
  const pick = value as Partial<PublicPagePhotoPick>
  if (!PUBLIC_PAGE_PHOTO_FOLDERS.includes(pick.folder as PublicPagePhotoFolder)) return false
  return pick.folder === 'project'
    ? isPublicPageImage(pick.image)
    : typeof pick.image === 'string' && PUBLIC_PAGE_FIELD_PHOTO_FILENAME.test(pick.image)
}

/** Lookup key for a pick in `PublicProjectPage.photoPicks`. Same shape as the server's. */
export function photoPickKey(pick: { folder: string; image: string }): string {
  return `${pick.folder}/${pick.image}`
}

/**
 * What a person supplies for a block: words for `text`, an uploaded image
 * with its caption and alt text for `image`. All plain text, rendered as text
 * nodes.
 */
export interface PublicPageBlockContent {
  heading?: string
  body?: string
  image?: string
  caption?: string
  alt?: string
  /** The photos block's chosen photos, in order. Absent means pick automatically. */
  photos?: PublicPagePhotoPick[]
}

/** One block in a saved arrangement. `key` identifies the instance, not the kind. */
export interface PublicPageBlock {
  id: PublicPageBlockId
  key: string
  variant?: string
  surface?: PublicPageSurface
  content?: PublicPageBlockContent
}

export type PublicPageLayouts = Partial<Record<PublicPageTheme, PublicPageBlock[]>>

export interface PublicPageTotals {
  trees: number
  hectares: number
  sites: number
  species: number
  /** Species rows with sourced biodiversity data. Zero means do not print the two below. */
  speciesAssessed: number
  nativeSpecies: number
  threatenedSpecies: number
  monitoringPlots: number
  contributors: number
  interventions: number
}

export interface PublicPageVerification {
  total: number
  withLocation: number
  withPhoto: number
  capturedOnSite: number
}

export interface PublicPageSiteMonitoring {
  uid: string
  name: string
  trees: number
  remeasured: number
  alive: number
  lastCheckedAt: string | null
}

export interface PublicPageMonitoring {
  remeasured: number
  alive: number
  lastCheckedAt: string | null
  perSite: PublicPageSiteMonitoring[]
}

export interface PublicPageSpecies {
  uid: string | null
  scientificName: string | null
  commonName: string | null
  trees: number
  isNative: boolean | null
  isEndangered: boolean | null
  pollinatorFriendly: boolean | null
  conservationStatus: string | null
  image: string | null
}

export interface PublicPageWorkItem {
  type: string
  trees: number
  records: number
}

export interface PublicPageInterventionMix {
  planting: PublicPageWorkItem[]
  other: PublicPageWorkItem[]
}

export interface PublicPageTimelinePoint {
  period: string
  year: number
  quarter: number
  trees: number
}

export interface PublicPagePhoto {
  image: string
  folder: PublicPagePhotoFolder
  caption: string | null
  takenAt: string | null
}

export interface PublicPagePerson {
  initials: string
  name: string | null
  image: string | null
}

export interface PublicPageProject {
  uid: string
  slug: string | null
  name: string
  description: string | null
  purpose: string | null
  ecosystem: string | null
  country: string | null
  website: string | null
  image: string | null
  target: number | null
  startedAt: string | null
}

export interface PublicPageOrganization {
  name: string
  image: string | null
  primaryColor: string | null
  secondaryColor: string | null
  website: string | null
}

export interface PublicPageSiteFeature {
  type: 'Feature'
  properties: { uid: string; name: string; hectares: number | null }
  geometry: unknown
}

export interface PublicProjectPage {
  theme: PublicPageTheme
  geoDetail: PublicPageGeoDetail
  /** The project's saved arrangement for this theme, or null for the theme default. */
  layout: PublicPageBlock[] | null
  snapshotAt: string
  project: PublicPageProject
  organization: PublicPageOrganization
  totals: PublicPageTotals
  verification: PublicPageVerification
  monitoring: PublicPageMonitoring
  species: PublicPageSpecies[]
  work: PublicPageInterventionMix
  timeline: PublicPageTimelinePoint[]
  sites: { type: 'FeatureCollection'; features: PublicPageSiteFeature[] }
  photos: PublicPagePhoto[]
  /**
   * The photos block's chosen photos that the server checked, keyed by
   * `photoPickKey`. A pick missing from here is not shown.
   */
  photoPicks: Record<string, PublicPagePhoto>
  people: { count: number; members: PublicPagePerson[] }
}
