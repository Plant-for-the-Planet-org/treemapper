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
  'image',
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
export const PUBLIC_PAGE_IMAGE_CAPTION_MAX = 200;
export const PUBLIC_PAGE_IMAGE_ALT_MAX = 200;

/**
 * The only image value a public page will store: a bare filename in the exact
 * shape `R2Service.generatePresignedUrl` produces (`<ms timestamp>-<random>.<ext>`),
 * uploaded to the `project` folder.
 *
 * This is a security boundary, not tidiness. The web's `cdnUrl` passes any
 * `http(s)://` value through unchanged, so accepting a free string here would
 * let a stored layout point a public page at any image on the internet. HEIC
 * and HEIF are left out even though uploads allow them: browsers do not render
 * them, so they could only ever show as a broken image.
 *
 * **Mirrored** in `apps/web/src/components/public-page/types.ts`.
 */
export const PUBLIC_PAGE_IMAGE_FILENAME = /^\d{10,16}-[a-z0-9]{1,12}\.(jpg|jpeg|png|gif|webp)$/;

export function isPublicPageImage(value: unknown): value is string {
  return typeof value === 'string' && PUBLIC_PAGE_IMAGE_FILENAME.test(value);
}

/** Most photos a project can choose for the "From the field" block. */
export const PUBLIC_PAGE_PHOTO_PICKS_MAX = 12;

/** Where a photo lives in storage. `project` is an upload made for the page. */
export const PUBLIC_PAGE_PHOTO_FOLDERS = ['tree', 'intervention', 'site', 'project'] as const;
export type PublicPagePhotoFolder = (typeof PUBLIC_PAGE_PHOTO_FOLDERS)[number];

/**
 * A field photo's stored filename. Looser than `PUBLIC_PAGE_IMAGE_FILENAME`
 * because migrated records carry older naming schemes, but still a bare
 * filename: no slash, no colon, so it can never be a URL or a path. A picked
 * field photo is also checked against the project's own published records
 * every time the page is built, which is the check that actually matters.
 */
export const PUBLIC_PAGE_FIELD_PHOTO_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,200}\.(jpg|jpeg|png|gif|webp)$/i;

/**
 * One photo chosen for the photos block. `caption` replaces the automatic
 * one (species, intervention type or site name) when set.
 */
export interface PublicPagePhotoPick {
  folder: PublicPagePhotoFolder;
  image: string;
  caption?: string;
}

export function isPublicPagePhotoPick(value: unknown): value is PublicPagePhotoPick {
  if (!value || typeof value !== 'object') return false;
  const pick = value as Partial<PublicPagePhotoPick>;
  if (!PUBLIC_PAGE_PHOTO_FOLDERS.includes(pick.folder as PublicPagePhotoFolder)) return false;
  // An upload made for the page follows the strict rule; field photos the looser one.
  return pick.folder === 'project'
    ? isPublicPageImage(pick.image)
    : typeof pick.image === 'string' && PUBLIC_PAGE_FIELD_PHOTO_FILENAME.test(pick.image);
}

/** Lookup key for a pick in `PublicProjectPage.photoPicks`. */
export function photoPickKey(pick: { folder: string; image: string }): string {
  return `${pick.folder}/${pick.image}`;
}

/**
 * One block in a saved arrangement.
 *
 * `key` identifies the instance, not the kind, because a theme may place the
 * same block twice and the editor needs a stable handle for each copy.
 *
 * `content` is the only place on a public page where a person supplies what is
 * shown: words for the `text` block, an uploaded image plus its caption and
 * alt text for the `image` block. Text is plain and rendered as text nodes,
 * never as markup; `image` is a filename checked by `isPublicPageImage`.
 */
export interface PublicPageBlockContent {
  heading?: string;
  body?: string;
  image?: string;
  caption?: string;
  alt?: string;
  /** The photos block's chosen photos, in order. Absent means pick automatically. */
  photos?: PublicPagePhotoPick[];
}

export interface PublicPageBlock {
  id: PublicPageBlockId;
  key: string;
  variant?: string;
  surface?: PublicPageSurface;
  content?: PublicPageBlockContent;
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
  /**
   * A cover chosen for this page alone. Wins over `project.image` and the
   * project gallery; null means "pick automatically". Shared by all themes,
   * because a cover belongs to the project, not to a layout.
   */
  coverImage: string | null;
}

export const DEFAULT_PUBLIC_PAGE_SETTINGS: PublicPageSettings = {
  enabled: false,
  theme: 'full',
  geoDetail: 'site',
  showContributorNames: false,
  layouts: {},
  coverImage: null,
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
  folder: PublicPagePhotoFolder;
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
  /**
   * The photos block's chosen photos that passed the check, keyed by
   * `photoPickKey`. A pick missing from here (deleted, unapproved, or never
   * this project's) is simply not shown. Only the rendered theme's layout is
   * resolved, so this is empty for a project that never chose photos.
   */
  photoPicks: Record<string, PublicPagePhoto>;
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
/**
 * Cache keys under which a project's public page may be stored. The page is
 * addressable by slug and by uid and each spelling is its own entry, so
 * anything that changes what the page shows must drop both.
 */
export function publicPageCacheKeys(uid: string, slug: string | null): string[] {
  const keys = [`public-page:${uid}`];
  if (slug && slug !== uid) keys.push(`public-page:${slug}`);
  return keys;
}

export function resolvePublicPageSettings(metadata: unknown): PublicPageSettings {
  const stored = (metadata as { publicPage?: Partial<PublicPageSettings> } | null)?.publicPage;
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_PUBLIC_PAGE_SETTINGS };
  }

  const theme = PUBLIC_PAGE_THEMES.includes(stored.theme as PublicPageTheme)
    ? (stored.theme as PublicPageTheme)
    : DEFAULT_PUBLIC_PAGE_SETTINGS.theme;

  return {
    enabled: stored.enabled === true,
    theme,
    // Only site-level geometry is implemented. The field keeps its union type
    // for the day fuzzed or exact points are built, but a stored value can
    // never widen what is published: whatever is stored, the page gets 'site'.
    geoDetail: 'site',
    showContributorNames: stored.showContributorNames === true,
    layouts: sanitizePublicPageLayouts(stored.layouts),
    coverImage: isPublicPageImage(stored.coverImage) ? stored.coverImage : null,
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
      const text = (value: unknown, max: number) =>
        typeof value === 'string' ? value.trim().slice(0, max) : '';

      const heading = text(content.heading, PUBLIC_PAGE_TEXT_HEADING_MAX);
      const body = text(content.body, PUBLIC_PAGE_TEXT_BODY_MAX);
      // An image value that is not a server-made filename is dropped, never
      // kept: see `PUBLIC_PAGE_IMAGE_FILENAME` for why.
      const image = isPublicPageImage(content.image) ? content.image : '';
      const caption = text(content.caption, PUBLIC_PAGE_IMAGE_CAPTION_MAX);
      const alt = text(content.alt, PUBLIC_PAGE_IMAGE_ALT_MAX);
      const photos = sanitizePhotoPicks(content.photos);

      if (heading || body || image || caption || alt || photos.length) {
        block.content = {
          ...(heading ? { heading } : {}),
          ...(body ? { body } : {}),
          ...(image ? { image } : {}),
          ...(caption ? { caption } : {}),
          ...(alt ? { alt } : {}),
          ...(photos.length ? { photos } : {}),
        };
      }
    }

    blocks.push(block);
  }

  return blocks;
}

/**
 * Chosen photos, cleaned: valid picks only, no repeats, at most
 * `PUBLIC_PAGE_PHOTO_PICKS_MAX`, captions trimmed. Order is kept, because the
 * order is the choice.
 */
export function sanitizePhotoPicks(value: unknown): PublicPagePhotoPick[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const picks: PublicPagePhotoPick[] = [];
  for (const raw of value) {
    if (picks.length >= PUBLIC_PAGE_PHOTO_PICKS_MAX) break;
    if (!isPublicPagePhotoPick(raw)) continue;

    const key = photoPickKey(raw);
    if (seen.has(key)) continue;
    seen.add(key);

    const caption =
      typeof raw.caption === 'string' ? raw.caption.trim().slice(0, PUBLIC_PAGE_IMAGE_CAPTION_MAX) : '';
    picks.push({ folder: raw.folder, image: raw.image, ...(caption ? { caption } : {}) });
  }
  return picks;
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
