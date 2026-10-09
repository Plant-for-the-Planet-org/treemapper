/**
 * Contract for the public, unauthenticated project page (`GET /api/public-page/:slug`).
 *
 * One aggregate shape feeds every theme. A theme decides which parts of this
 * object it renders and in what order; it never asks for anything extra. Keep
 * it that way: adding a fifth theme should be a web-only change.
 */

export const PUBLIC_PAGE_THEMES = ['report', 'story', 'full', 'academy'] as const;
export type PublicPageTheme = (typeof PUBLIC_PAGE_THEMES)[number];

export const PUBLIC_PAGE_GEO_DETAIL = ['site', 'fuzzed', 'exact'] as const;
export type PublicPageGeoDetail = (typeof PUBLIC_PAGE_GEO_DETAIL)[number];

/**
 * Stored under `project.metadata.publicPage`. Jsonb rather than its own column
 * while the shape is still moving; promote it once it settles.
 *
 * `enabled` defaults to **false** and must be set deliberately. It is not
 * `project.isPublic`, which defaults to true on every row and would put every
 * project on the open internet the day this ships.
 */
export interface PublicPageSettings {
  enabled: boolean;
  theme: PublicPageTheme;
  /** Only 'site' is implemented. The other two are reserved. */
  geoDetail: PublicPageGeoDetail;
  /** Opt in to naming contributors. Off means counts only. */
  showContributorNames: boolean;
}

export const DEFAULT_PUBLIC_PAGE_SETTINGS: PublicPageSettings = {
  enabled: false,
  theme: 'full',
  geoDetail: 'site',
  showContributorNames: false,
};

export interface PublicPageTotals {
  trees: number;
  hectares: number;
  sites: number;
  species: number;
  /**
   * How many species rows carry sourced biodiversity data. Zero means the
   * native and conservation figures below say nothing, and the page must not
   * print them. See `loadSpecies` for what counts as sourced.
   */
  speciesAssessed: number;
  nativeSpecies: number;
  threatenedSpecies: number;
  monitoringPlots: number;
  contributors: number;
  interventions: number;
}

/** The trust line. Shares of recorded trees that carry each kind of evidence. */
export interface PublicPageVerification {
  total: number;
  withLocation: number;
  withPhoto: number;
  capturedOnSite: number;
}

export interface PublicPageSiteMonitoring {
  uid: string;
  name: string;
  trees: number;
  remeasured: number;
  alive: number;
  lastCheckedAt: string | null;
}

export interface PublicPageMonitoring {
  remeasured: number;
  alive: number;
  lastCheckedAt: string | null;
  perSite: PublicPageSiteMonitoring[];
}

export interface PublicPageSpecies {
  uid: string | null;
  scientificName: string | null;
  commonName: string | null;
  trees: number;
  isNative: boolean | null;
  isEndangered: boolean | null;
  pollinatorFriendly: boolean | null;
  conservationStatus: string | null;
  image: string | null;
}

export interface PublicPageWorkItem {
  type: string;
  trees: number;
  records: number;
}

export interface PublicPageInterventionMix {
  /** Types that registered trees, biggest first. */
  planting: PublicPageWorkItem[];
  /** Types that planted nothing: fire patrol, fencing, invasive removal. */
  other: PublicPageWorkItem[];
}

export interface PublicPageTimelinePoint {
  /** `2025-Q1` */
  period: string;
  year: number;
  quarter: number;
  trees: number;
}

export interface PublicPagePhoto {
  /** Raw stored filename. The web app turns it into a CDN url. */
  image: string;
  folder: 'tree' | 'intervention' | 'site';
  caption: string | null;
  takenAt: string | null;
}

export interface PublicPagePerson {
  initials: string;
  /** Null unless `showContributorNames` is on. */
  name: string | null;
  image: string | null;
}

export interface PublicPageProject {
  uid: string;
  slug: string | null;
  name: string;
  description: string | null;
  purpose: string | null;
  ecosystem: string | null;
  country: string | null;
  website: string | null;
  image: string | null;
  /** Project tree target, drives the Academy theme's goal bar. */
  target: number | null;
  startedAt: string | null;
}

export interface PublicPageOrganization {
  name: string;
  image: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  website: string | null;
}

export interface PublicProjectPage {
  theme: PublicPageTheme;
  geoDetail: PublicPageGeoDetail;
  /** When this snapshot was built. Rendered on every theme's footer. */
  snapshotAt: string;
  project: PublicPageProject;
  organization: PublicPageOrganization;
  totals: PublicPageTotals;
  verification: PublicPageVerification;
  monitoring: PublicPageMonitoring;
  species: PublicPageSpecies[];
  work: PublicPageInterventionMix;
  timeline: PublicPageTimelinePoint[];
  /** Polygons only while `geoDetail` is 'site'. Never individual trees. */
  sites: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: { uid: string; name: string; hectares: number | null };
      geometry: unknown;
    }>;
  };
  photos: PublicPagePhoto[];
  people: {
    count: number;
    members: PublicPagePerson[];
  };
}

/**
 * Reads the stored settings off a project's metadata, filling anything missing
 * with the safe default. Unknown theme or geoDetail values fall back rather
 * than throwing: a bad value in jsonb must never 500 a public page.
 */
export function resolvePublicPageSettings(metadata: unknown): PublicPageSettings {
  const stored = (metadata as { publicPage?: Partial<PublicPageSettings> } | null)?.publicPage;
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_PUBLIC_PAGE_SETTINGS };
  }

  const theme = PUBLIC_PAGE_THEMES.includes(stored.theme as PublicPageTheme)
    ? (stored.theme as PublicPageTheme)
    : DEFAULT_PUBLIC_PAGE_SETTINGS.theme;

  const geoDetail = PUBLIC_PAGE_GEO_DETAIL.includes(stored.geoDetail as PublicPageGeoDetail)
    ? (stored.geoDetail as PublicPageGeoDetail)
    : DEFAULT_PUBLIC_PAGE_SETTINGS.geoDetail;

  return {
    enabled: stored.enabled === true,
    theme,
    // Only site-level geometry is implemented. Anything else is read as 'site'
    // so a stored value cannot widen what is published by accident.
    geoDetail: geoDetail === 'site' ? 'site' : 'site',
    showContributorNames: stored.showContributorNames === true,
  };
}
