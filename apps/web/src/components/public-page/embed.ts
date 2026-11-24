import { defaultVariantFor, resolveLayout } from './layout'
import type { BlockId, BlockSpec, ThemeConfig } from './themes'
import type { PublicPageBlock } from './types'

/**
 * The embeddable widget: a few blocks of a public page, shown inside an
 * iframe on someone else's website.
 *
 * Nothing is stored for it. The blocks a widget shows are part of its URL
 * (`/embed/:slug/numbers/map`), so a partner can hold several widgets for one
 * project and the owner never has to manage a list. It needs no switch of its
 * own either: a widget shows exactly what the public page already publishes,
 * and goes blank the moment that page is turned off.
 *
 * The blocks travel as path segments rather than a query string so the route
 * stays statically generated (reading `searchParams` would make every hit
 * dynamic). Any unknown id is a 404 rather than being dropped, which keeps the
 * set of cacheable URLs small and every URL canonical.
 */

/**
 * Blocks that make sense in a box on someone else's page. Left out on purpose:
 * page furniture (jump links, the detail seam, footer), the share row (it
 * would share the partner's page, not ours), the data download, and the two
 * blocks whose content is typed or uploaded per arrangement (text, image).
 */
export const EMBED_BLOCK_IDS = [
  'numbers',
  'map',
  'hero',
  'narrative',
  'verification',
  'photos',
  'species',
  'monitoring',
  'work',
  'timeline',
  'people',
  'badges',
] as const satisfies readonly BlockId[]

export type EmbedBlockId = (typeof EMBED_BLOCK_IDS)[number]

export const EMBED_DEFAULT_BLOCKS: EmbedBlockId[] = ['numbers', 'map']

/** A widget is a summary. Past this it should be a link to the full page. */
export const EMBED_MAX_BLOCKS = 6

export function isEmbedBlockId(value: string): value is EmbedBlockId {
  return (EMBED_BLOCK_IDS as readonly string[]).includes(value)
}

/**
 * The block ids a widget URL asks for, or null when the URL is not a valid
 * widget. No segments means the default set.
 */
export function parseEmbedBlocks(segments: string[] | undefined): EmbedBlockId[] | null {
  if (!segments || segments.length === 0) return EMBED_DEFAULT_BLOCKS
  if (segments.length > EMBED_MAX_BLOCKS) return null
  if (!segments.every(isEmbedBlockId)) return null
  if (new Set(segments).size !== segments.length) return null
  return segments as EmbedBlockId[]
}

/**
 * Turns the requested ids into block specs. Each block keeps the variant and
 * any content the project gave it on its page in this theme (so chosen photos
 * carry over), and falls back to the theme's default variant otherwise.
 * `surface` is dropped: the widget is one band, never Full's two halves.
 */
export function embedLayout(
  theme: ThemeConfig,
  saved: PublicPageBlock[] | null | undefined,
  ids: EmbedBlockId[],
): BlockSpec[] {
  const page = resolveLayout(theme, saved)
  return ids.map((id) => {
    const onPage = page.find((spec) => spec.id === id)
    return {
      id,
      key: `embed-${id}`,
      variant: onPage?.variant ?? defaultVariantFor(id, theme.tone),
      content: onPage?.content,
    }
  })
}

export function embedPath(slug: string, ids: EmbedBlockId[]): string {
  return `/embed/${encodeURIComponent(slug)}/${ids.join('/')}`
}

/** The code a partner pastes into their site. */
export function embedSnippet(origin: string, slug: string, ids: EmbedBlockId[]): string {
  return [
    `<iframe src="${origin}${embedPath(slug, ids)}" title="Project on TreeMapper"`,
    `  data-treemapper-embed loading="lazy" width="100%" height="600"`,
    `  style="border:0;width:100%;max-width:100%;display:block"></iframe>`,
    `<script src="${origin}/embed.js" async></script>`,
  ].join('\n')
}

/** Message the widget sends its parent page. Shared with `public/embed.js`. */
export const EMBED_HEIGHT_MESSAGE = 'treemapper:embed-height'
export const EMBED_PING_MESSAGE = 'treemapper:embed-ping'
