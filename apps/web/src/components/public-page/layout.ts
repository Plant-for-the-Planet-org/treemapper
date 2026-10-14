import { BLOCKS } from './blocks'
import type { BlockId, BlockSpec, ThemeConfig, Tone } from './themes'
import { PUBLIC_PAGE_MAX_BLOCKS } from './types'
import type { PublicPageBlock } from './types'

/**
 * What a page can be built from, and how a saved arrangement becomes one.
 *
 * A theme still ships an ordered block list, and that list is still the
 * default. This file adds one idea on top: a project may save its own order
 * for a theme, and the renderer uses it instead. The theme default is never
 * copied into storage when nothing has been changed, so a project that has
 * not touched its layout keeps following the theme as the theme improves.
 *
 * Everything here is pure and runs on the server too: `/p/:slug` is a server
 * component, and resolving a layout must not need a browser.
 */

export interface BlockVariant {
  id: string
  label: string
}

export interface BlockDefinition {
  id: BlockId
  label: string
  /** One line, written for a project owner rather than for a developer. */
  description: string
  variants: BlockVariant[]
  /** Which variant a freshly added block gets, by the theme's tone. */
  defaultVariant?: Partial<Record<Tone, string>>
  /** May appear more than once on a page. Most blocks may not. */
  repeatable?: boolean
  /** Carries words the project types. Only the text block does. */
  editableText?: boolean
  /**
   * Removing it is allowed but worth a word of warning: the page reads as
   * broken without it.
   */
  essential?: boolean
}

/**
 * The catalogue the editor offers, in the order it offers them.
 *
 * Every block here takes the same payload, so any of them can go on any theme.
 * That is what makes "add a block" a list rather than a special case per
 * theme: Story can show the verification band, Report can show photos.
 */
export const BLOCK_CATALOGUE: Record<BlockId, BlockDefinition> = {
  hero: {
    id: 'hero',
    label: 'Opening',
    description: 'Project name, the headline claim and where the work is.',
    essential: true,
    variants: [
      { id: 'cover', label: 'Cover' },
      { id: 'masthead', label: 'Masthead' },
      { id: 'goal', label: 'Goal bar' },
    ],
    defaultVariant: { formal: 'masthead', warm: 'cover', simple: 'goal' },
  },
  anchorNav: {
    id: 'anchorNav',
    label: 'Jump links',
    description: 'A sticky bar linking to the map, photos, detail, species and data.',
    variants: [],
  },
  numbers: {
    id: 'numbers',
    label: 'Headline numbers',
    description: 'Trees, hectares, sites, species, plots and contributors.',
    repeatable: true,
    variants: [
      { id: 'display', label: 'Large' },
      { id: 'rules', label: 'Ruled' },
      { id: 'cards', label: 'Cards' },
    ],
    defaultVariant: { formal: 'rules', warm: 'display', simple: 'cards' },
  },
  verification: {
    id: 'verification',
    label: 'How it was checked',
    description: 'Share of trees with a GPS fix, a photo and an on-site capture.',
    variants: [{ id: 'band', label: 'Band' }],
  },
  narrative: {
    id: 'narrative',
    label: 'What we are doing',
    description: 'A short written lead, built from the project description.',
    variants: [],
  },
  map: {
    id: 'map',
    label: 'Map',
    description: 'Site boundaries. Individual tree positions are never shown.',
    variants: [
      { id: 'framed', label: 'Framed' },
      { id: 'bleed', label: 'Full bleed' },
      { id: 'rounded', label: 'Rounded' },
    ],
    defaultVariant: { formal: 'framed', warm: 'bleed', simple: 'rounded' },
  },
  photos: {
    id: 'photos',
    label: 'Photos',
    description: 'Pictures taken in the field by the people doing the work.',
    variants: [
      { id: 'wall', label: 'Wall of six' },
      { id: 'row', label: 'Row of three' },
    ],
    defaultVariant: { warm: 'wall' },
  },
  species: {
    id: 'species',
    label: 'Species',
    description: 'What was planted, with native and conservation flags where sourced.',
    variants: [
      { id: 'table', label: 'Table' },
      { id: 'cards', label: 'Cards' },
    ],
    defaultVariant: { formal: 'table', warm: 'cards', simple: 'cards' },
  },
  monitoring: {
    id: 'monitoring',
    label: 'Survival',
    description: 'Remeasured trees and how many are still alive, per site.',
    variants: [{ id: 'table', label: 'Table' }],
  },
  work: {
    id: 'work',
    label: 'Kind of work',
    description: 'The mix of intervention types, including the ones that planted nothing.',
    variants: [
      { id: 'split', label: 'With timeline' },
      { id: 'mix', label: 'Mix only' },
    ],
    defaultVariant: { formal: 'split', warm: 'split', simple: 'split' },
  },
  timeline: {
    id: 'timeline',
    label: 'Timeline',
    description: 'Trees recorded per quarter, as a bar chart.',
    variants: [],
  },
  people: {
    id: 'people',
    label: 'The team',
    description: 'Who recorded the work. Names only if you turned names on.',
    variants: [
      { id: 'quote', label: 'With quote' },
      { id: 'chips', label: 'Chips' },
    ],
    defaultVariant: { simple: 'chips' },
  },
  badges: {
    id: 'badges',
    label: 'Badges',
    description: 'Simple earned markers, written for a younger reader.',
    variants: [],
  },
  text: {
    id: 'text',
    label: 'Your own words',
    description: 'A heading and a few sentences you write yourself. Plain text.',
    repeatable: true,
    editableText: true,
    variants: [
      { id: 'prose', label: 'Paragraph' },
      { id: 'quote', label: 'Pull quote' },
    ],
  },
  detailSeam: {
    id: 'detailSeam',
    label: 'Section break',
    description: 'The line between the story half of the page and the evidence half.',
    variants: [],
  },
  data: {
    id: 'data',
    label: 'Download the data',
    description: 'Links to the site boundaries and the whole page as JSON.',
    variants: [{ id: 'rule', label: 'Ruled' }],
  },
  share: {
    id: 'share',
    label: 'Share',
    description: 'Buttons to pass the page on.',
    variants: [
      { id: 'wide', label: 'Wide' },
      { id: 'inverse', label: 'Dark' },
      { id: 'card', label: 'Card' },
    ],
    defaultVariant: { warm: 'inverse', simple: 'card' },
  },
  footer: {
    id: 'footer',
    label: 'Footer',
    description: 'Snapshot date, project website and the privacy link.',
    essential: true,
    variants: [
      { id: 'quiet', label: 'Quiet' },
      { id: 'inverse', label: 'Dark' },
    ],
    defaultVariant: { warm: 'inverse' },
  },
}

/** The catalogue in offer order, which is the order `PUBLIC_PAGE_BLOCK_IDS` declares. */
export const CATALOGUE_LIST: BlockDefinition[] = Object.values(BLOCK_CATALOGUE)

/**
 * A theme's own list, with a key on every entry.
 *
 * Keys matter from here on: the editor tracks a block by key while it moves,
 * and a theme only sets one where it places the same block twice.
 */
export function defaultLayout(theme: ThemeConfig): BlockSpec[] {
  return theme.blocks.map((spec, index) => ({
    ...spec,
    key: spec.key ?? `${spec.id}-${index}`,
  }))
}

/**
 * What to render: the project's saved arrangement, or the theme's own list.
 *
 * Defensive in the same way the server's sanitiser is, and for the same
 * reason. A stored layout can name a block that no longer exists, and a
 * public page must still render, so unknown ids are dropped rather than
 * crashing the renderer. An arrangement left with nothing in it falls back to
 * the theme, because a blank page is never the right answer.
 */
export function resolveLayout(
  theme: ThemeConfig,
  stored: PublicPageBlock[] | null | undefined,
): BlockSpec[] {
  if (!stored || !stored.length) return defaultLayout(theme)

  const seen = new Set<string>()
  const blocks: BlockSpec[] = []

  for (const entry of stored) {
    if (blocks.length >= PUBLIC_PAGE_MAX_BLOCKS) break
    if (!entry || !(entry.id in BLOCKS)) continue

    const key = entry.key && !seen.has(entry.key) ? entry.key : `${entry.id}-${blocks.length}`
    if (seen.has(key)) continue
    seen.add(key)

    blocks.push({
      id: entry.id,
      key,
      ...(entry.variant ? { variant: entry.variant } : {}),
      ...(entry.surface ? { surface: entry.surface } : {}),
      ...(entry.content ? { content: entry.content } : {}),
    })
  }

  return blocks.length ? blocks : defaultLayout(theme)
}

/** The arrangement as the API stores it. Keys are always written out. */
export function toStoredLayout(blocks: BlockSpec[]): PublicPageBlock[] {
  return blocks.map((spec, index) => ({
    id: spec.id,
    key: spec.key ?? `${spec.id}-${index}`,
    ...(spec.variant ? { variant: spec.variant } : {}),
    ...(spec.surface ? { surface: spec.surface } : {}),
    ...(spec.content?.heading || spec.content?.body
      ? {
          content: {
            ...(spec.content.heading ? { heading: spec.content.heading } : {}),
            ...(spec.content.body ? { body: spec.content.body } : {}),
          },
        }
      : {}),
  }))
}

/** True when the arrangement is the theme's own, so nothing needs storing. */
export function matchesDefault(theme: ThemeConfig, blocks: BlockSpec[]): boolean {
  return (
    JSON.stringify(toStoredLayout(defaultLayout(theme))) === JSON.stringify(toStoredLayout(blocks))
  )
}

export function defaultVariantFor(id: BlockId, tone: Tone): string | undefined {
  const definition = BLOCK_CATALOGUE[id]
  return definition.defaultVariant?.[tone] ?? definition.variants[0]?.id
}

/** A key nothing else in this arrangement is using. */
export function nextKey(blocks: BlockSpec[], id: BlockId): string {
  const used = new Set(blocks.map((block) => block.key))
  let n = 1
  while (used.has(`${id}-${n}`)) n += 1
  return `${id}-${n}`
}

/**
 * Where a newly added block goes.
 *
 * At the end, but above the footer, because a block added below the footer is
 * never what anyone meant. It inherits the surface of the block it lands
 * after, so adding to the Full theme's evidence half keeps it on that ground
 * rather than splitting the band in two.
 */
export function addBlock(blocks: BlockSpec[], id: BlockId, theme: ThemeConfig): BlockSpec[] {
  const footerAt = blocks.findIndex((block) => block.id === 'footer')
  const at = footerAt === -1 ? blocks.length : footerAt
  const before = blocks[at - 1]

  const variant = defaultVariantFor(id, theme.tone)
  const next: BlockSpec = {
    id,
    key: nextKey(blocks, id),
    ...(variant ? { variant } : {}),
    ...(before?.surface ? { surface: before.surface } : {}),
    ...(BLOCK_CATALOGUE[id].editableText
      ? { content: { heading: '', body: '' } }
      : {}),
  }

  return [...blocks.slice(0, at), next, ...blocks.slice(at)]
}

/** Moves one block by `offset` places. Out of range is a no-op, not a wrap. */
export function moveBlock(blocks: BlockSpec[], key: string, offset: number): BlockSpec[] {
  const from = blocks.findIndex((block) => block.key === key)
  if (from === -1) return blocks

  const to = from + offset
  if (to < 0 || to >= blocks.length) return blocks

  const next = [...blocks]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** Reorders by key, which is what a drag reports. */
export function reorderBlocks(blocks: BlockSpec[], activeKey: string, overKey: string): BlockSpec[] {
  const from = blocks.findIndex((block) => block.key === activeKey)
  const to = blocks.findIndex((block) => block.key === overKey)
  if (from === -1 || to === -1 || from === to) return blocks
  return moveBlock(blocks, activeKey, to - from)
}

export function removeBlock(blocks: BlockSpec[], key: string): BlockSpec[] {
  return blocks.filter((block) => block.key !== key)
}

export function updateBlock(
  blocks: BlockSpec[],
  key: string,
  changes: Partial<BlockSpec>,
): BlockSpec[] {
  return blocks.map((block) => (block.key === key ? { ...block, ...changes } : block))
}

/** Blocks already on the page that cannot be added again. */
export function usedOnceIds(blocks: BlockSpec[]): Set<BlockId> {
  const used = new Set<BlockId>()
  for (const block of blocks) {
    if (!BLOCK_CATALOGUE[block.id]?.repeatable) used.add(block.id)
  }
  return used
}
