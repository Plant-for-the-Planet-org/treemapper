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
 * Every block a page can be built from.
 *
 * The server never renders one. It keeps this list so a stored layout can be
 * validated on the way in and cleaned on the way out, which is what stops a
 * hand-edited jsonb value from breaking a published page.
 *
 * **Mirrored** in `apps/web/src/components/public-page/types.ts`. Change one,
 * change the other.
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
] as const;
export type PublicPageBlockId = (typeof PUBLIC_PAGE_BLOCK_IDS)[number];

export const PUBLIC_PAGE_SURFACES = ['base', 'detail'] as const;
export type PublicPageSurface = (typeof PUBLIC_PAGE_SURFACES)[number];

/** Enough for every block twice over, far below anything that would hurt a page. */
export const PUBLIC_PAGE_MAX_BLOCKS = 40;
export const PUBLIC_PAGE_TEXT_HEADING_MAX = 120;
export const PUBLIC_PAGE_TEXT_BODY_MAX = 2000;
export const PUBLIC_PAGE_BLOCK_KEY_MAX = 64;
export const PUBLIC_PAGE_BLOCK_VARIANT_MAX = 32;

/**
 * One block in a saved arrangement.
 *
 * `key` identifies the instance, not the kind, because a theme may place the
 * same block twice and the editor needs a stable handle for each copy.
 *
 * `content` is the only place on a public page where a person types the words.
 * It is plain text and is rendered as text nodes, never as markup.
 */
export interface PublicPageBlock {
  id: PublicPageBlockId;
  key: string;
  variant?: string;
  surface?: PublicPageSurface;
  content?: { heading?: string; body?: string };
}

/**
 * Saved arrangements, one per theme.
 *
 * Per theme rather than shared, because a block's variant is a theme decision
 * (`numbers` is 'display' in Story and 'rules' in Report) and the Full theme
 * splits its blocks across two background surfaces. A theme with no entry here
 * renders its own default list, so this stays an override and never a
 * requirement.
 */
export type PublicPageLayouts = Partial<Record<PublicPageTheme, PublicPageBlock[]>>;

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
  /**
   * Per-theme block arrangements. Empty means every theme renders its own
   * default list, which is the state every project starts in.
   */
  layouts: PublicPageLayouts;
}

export const DEFAULT_PUBLIC_PAGE_SETTINGS: PublicPageSettings = {
  enabled: false,
  theme: 'full',
  geoDetail: 'site',
  showContributorNames: false,
  layouts: {},
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
  /**
   * The arrangement this project saved for the theme being rendered, or null
   * to use the theme's own default list. The web app owns what each block
   * looks like; the server only carries the order.
   */
  layout: PublicPageBlock[] | null;
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
    layouts: sanitizePublicPageLayouts(stored.layouts),
  };
}

/**
 * Cleans a stored arrangement rather than trusting it.
 *
 * Everything here is defensive and nothing throws. A layout is jsonb that an
 * older client wrote, so it can name a block this build no longer has, repeat
 * a key, or carry text that has since grown past its limit. A public page must
 * render in all of those cases, so unknown blocks are dropped, repeated keys
 * are made unique, and text is trimmed to length. A layout left with no
 * blocks at all is discarded, which falls the theme back to its default list:
 * a blank page is never the right answer to bad data.
 */
export function sanitizePublicPageBlocks(value: unknown): PublicPageBlock[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const blocks: PublicPageBlock[] = [];

  for (const raw of value) {
    if (blocks.length >= PUBLIC_PAGE_MAX_BLOCKS) break;
    if (!raw || typeof raw !== 'object') continue;

    const entry = raw as Partial<PublicPageBlock>;
    if (!PUBLIC_PAGE_BLOCK_IDS.includes(entry.id as PublicPageBlockId)) continue;

    const id = entry.id as PublicPageBlockId;
    let key = typeof entry.key === 'string' ? entry.key.slice(0, PUBLIC_PAGE_BLOCK_KEY_MAX) : '';
    if (!key || seen.has(key)) key = `${id}-${blocks.length}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const block: PublicPageBlock = { id, key };

    if (typeof entry.variant === 'string' && entry.variant) {
      block.variant = entry.variant.slice(0, PUBLIC_PAGE_BLOCK_VARIANT_MAX);
    }
    if (PUBLIC_PAGE_SURFACES.includes(entry.surface as PublicPageSurface)) {
      block.surface = entry.surface as PublicPageSurface;
    }

    const content = entry.content;
    if (content && typeof content === 'object') {
      const heading =
        typeof content.heading === 'string'
          ? content.heading.trim().slice(0, PUBLIC_PAGE_TEXT_HEADING_MAX)
          : '';
      const body =
        typeof content.body === 'string'
          ? content.body.trim().slice(0, PUBLIC_PAGE_TEXT_BODY_MAX)
          : '';
      if (heading || body) {
        block.content = {
          ...(heading ? { heading } : {}),
          ...(body ? { body } : {}),
        };
      }
    }

    blocks.push(block);
  }

  return blocks;
}

export function sanitizePublicPageLayouts(value: unknown): PublicPageLayouts {
  if (!value || typeof value !== 'object') return {};

  const layouts: PublicPageLayouts = {};
  for (const theme of PUBLIC_PAGE_THEMES) {
    const blocks = sanitizePublicPageBlocks((value as Record<string, unknown>)[theme]);
    if (blocks.length) layouts[theme] = blocks;
  }
  return layouts;
}
