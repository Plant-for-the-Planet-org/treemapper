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

export interface PublicPageTotals {
  trees: number
  hectares: number
  sites: number
  species: number
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
