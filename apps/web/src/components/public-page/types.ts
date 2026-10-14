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

/** One block in a saved arrangement. `key` identifies the instance, not the kind. */
export interface PublicPageBlock {
  id: PublicPageBlockId
  key: string
  variant?: string
  surface?: PublicPageSurface
  /** Plain text, rendered as text nodes. Only the `text` block uses it. */
  content?: { heading?: string; body?: string }
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
  folder: 'tree' | 'intervention' | 'site'
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
  people: { count: number; members: PublicPagePerson[] }
}
