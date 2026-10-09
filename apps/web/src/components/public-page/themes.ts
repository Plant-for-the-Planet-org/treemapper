import type { PublicPageTheme } from './types'

/**
 * The theme system.
 *
 * A theme is three things and nothing more: a token set, an ordered block
 * list, and a copy tone. Block components are shared by all four themes and
 * read tokens through CSS custom properties, so adding a fifth theme is a new
 * entry in `THEMES` and no new markup.
 *
 * Font variable names (`--font-pp-*`) are supplied by the route, which loads
 * them with `next/font`. A theme only picks which of them to use.
 */

export type Tone = 'formal' | 'warm' | 'simple'

export type BlockId =
  | 'hero'
  | 'anchorNav'
  | 'numbers'
  | 'verification'
  | 'narrative'
  | 'map'
  | 'photos'
  | 'species'
  | 'monitoring'
  | 'work'
  | 'people'
  | 'badges'
  | 'detailSeam'
  | 'data'
  | 'share'
  | 'footer'

export interface BlockSpec {
  id: BlockId
  /**
   * Layout variant for this block in this theme. A block falls back to its own
   * default when it does not recognise the value, so a theme can name a
   * variant a block has not learned yet without breaking the page.
   */
  variant?: string
  /** Lets one theme place the same block twice (Full renders `numbers` twice). */
  key?: string
  /**
   * Background region this block belongs to. The renderer groups consecutive
   * blocks that share a surface into one band, which is how Full draws its
   * story half and its detail half on different grounds.
   */
  surface?: 'base' | 'detail'
}

export interface ThemeConfig {
  id: PublicPageTheme
  label: string
  description: string
  tone: Tone
  /** CSS custom properties set on the page wrapper. */
  tokens: Record<string, string>
  blocks: BlockSpec[]
  /** Font variables this theme actually uses, so the route preloads no more than that. */
  fonts: Array<'sans' | 'mono' | 'serif' | 'round' | 'soft'>
}

/** Shared by Story and Full, which are the same look with different content. */
const WARM_TOKENS: Record<string, string> = {
  '--pp-bg': '#faf7f0',
  '--pp-surface': '#efece2',
  '--pp-ink': '#16211b',
  '--pp-muted': '#4d5a4f',
  '--pp-line': '#ddd9cc',
  '--pp-accent': '#2e7d4f',
  '--pp-on-accent': '#ffffff',
  '--pp-accent-soft': '#e4ece5',
  // Darker than --pp-accent on purpose: the accent fails 4.5:1 as small text
  // on the paper ground, so anything under 24px uses this instead.
  '--pp-accent-ink': '#1f5c3a',
  '--pp-inverse-bg': '#0d1f16',
  '--pp-inverse-ink': '#f4f1e8',
  '--pp-inverse-muted': '#a9bdae',
  '--pp-inverse-line': '#44604f',
  '--pp-placeholder': '#dfe4d9',
  '--pp-radius': '0px',
  '--pp-radius-lg': '0px',
  '--pp-radius-pill': '999px',
  '--pp-font-display': 'var(--font-pp-serif), Georgia, serif',
  '--pp-font-body': 'var(--font-pp-sans), system-ui, sans-serif',
  '--pp-font-num': 'var(--font-pp-sans), system-ui, sans-serif',
  '--pp-display-weight': '600',
  '--pp-display-tracking': '-0.02em',
  '--pp-hero-size': 'clamp(2.6rem, 6vw, 5.1rem)',
  '--pp-h2-size': 'clamp(1.6rem, 2.6vw, 2.1rem)',
  '--pp-stat-size': 'clamp(2.4rem, 4.4vw, 3.6rem)',
  '--pp-gap': 'clamp(3.5rem, 6vw, 5.5rem)',
}

export const THEMES: Record<PublicPageTheme, ThemeConfig> = {
  report: {
    id: 'report',
    label: 'Report',
    description: 'Evidence first. Tables, survival shown honestly, downloadable data, print friendly.',
    tone: 'formal',
    fonts: ['sans', 'mono'],
    tokens: {
      '--pp-bg': '#ffffff',
      '--pp-surface': '#fafbfa',
      '--pp-ink': '#15201b',
      '--pp-muted': '#55645b',
      '--pp-line': '#e2e6e2',
      '--pp-accent': '#14532d',
      '--pp-on-accent': '#ffffff',
      '--pp-accent-soft': '#f1f5f1',
      '--pp-accent-ink': '#14532d',
      '--pp-inverse-bg': '#15201b',
      '--pp-inverse-ink': '#f4f6f4',
      '--pp-inverse-muted': '#9fb0a4',
      '--pp-inverse-line': '#32413a',
      '--pp-placeholder': '#eef1ec',
      '--pp-radius': '0px',
      '--pp-radius-lg': '0px',
      '--pp-radius-pill': '0px',
      '--pp-font-display': 'var(--font-pp-sans), system-ui, sans-serif',
      '--pp-font-body': 'var(--font-pp-sans), system-ui, sans-serif',
      '--pp-font-num': 'var(--font-pp-mono), ui-monospace, monospace',
      '--pp-display-weight': '600',
      '--pp-display-tracking': '-0.02em',
      '--pp-hero-size': 'clamp(2.1rem, 3.8vw, 2.9rem)',
      '--pp-h2-size': 'clamp(1.25rem, 2vw, 1.5rem)',
      '--pp-stat-size': 'clamp(1.8rem, 3vw, 2.15rem)',
      '--pp-gap': 'clamp(2.75rem, 4.5vw, 4rem)',
    },
    blocks: [
      { id: 'hero', variant: 'masthead' },
      { id: 'numbers', variant: 'rules' },
      { id: 'verification', variant: 'band' },
      { id: 'monitoring', variant: 'table' },
      { id: 'species', variant: 'table' },
      { id: 'work', variant: 'split' },
      { id: 'map', variant: 'framed' },
      { id: 'data', variant: 'rule' },
      { id: 'footer', variant: 'quiet' },
    ],
  },

  story: {
    id: 'story',
    label: 'Story',
    description: 'One big claim, a map and real photos. Built for the link people actually click.',
    tone: 'warm',
    fonts: ['serif', 'sans'],
    tokens: WARM_TOKENS,
    blocks: [
      { id: 'hero', variant: 'cover' },
      { id: 'numbers', variant: 'display' },
      { id: 'narrative' },
      { id: 'map', variant: 'bleed' },
      { id: 'photos', variant: 'wall' },
      { id: 'species', variant: 'cards' },
      { id: 'people', variant: 'quote' },
      { id: 'share', variant: 'wide' },
      { id: 'footer', variant: 'inverse' },
    ],
  },

  full: {
    id: 'full',
    label: 'Full',
    description: 'Story above the fold, the whole evidence below. One link serves both readers.',
    tone: 'warm',
    fonts: ['serif', 'sans', 'mono'],
    tokens: {
      ...WARM_TOKENS,
      // The detail half is set on white with mono figures, so it reads as a
      // report rather than as more story.
      '--pp-detail-bg': '#ffffff',
      '--pp-font-num': 'var(--font-pp-mono), ui-monospace, monospace',
      '--pp-hero-size': 'clamp(2.4rem, 5.2vw, 4.4rem)',
    },
    blocks: [
      { id: 'hero', variant: 'cover' },
      { id: 'anchorNav' },
      { id: 'numbers', variant: 'display', key: 'numbers-display' },
      { id: 'narrative' },
      { id: 'map', variant: 'bleed' },
      { id: 'photos', variant: 'row' },
      { id: 'detailSeam', surface: 'detail' },
      { id: 'numbers', variant: 'rules', key: 'numbers-rules', surface: 'detail' },
      { id: 'verification', variant: 'band', surface: 'detail' },
      { id: 'monitoring', variant: 'table', surface: 'detail' },
      { id: 'species', variant: 'table', surface: 'detail' },
      { id: 'work', variant: 'split', surface: 'detail' },
      { id: 'data', variant: 'rule', surface: 'detail' },
      { id: 'share', variant: 'inverse' },
      { id: 'footer', variant: 'inverse' },
    ],
  },

  academy: {
    id: 'academy',
    label: 'Academy',
    description: 'Goal progress, team and species cards. Larger type, simple words.',
    tone: 'simple',
    fonts: ['round', 'soft'],
    tokens: {
      '--pp-bg': '#fffcf2',
      '--pp-surface': '#ffffff',
      '--pp-ink': '#1e2a22',
      '--pp-muted': '#5a665c',
      '--pp-line': '#e6e3d6',
      '--pp-accent': '#2f7a3c',
      '--pp-on-accent': '#ffffff',
      '--pp-accent-soft': '#e6f2e8',
      '--pp-accent-ink': '#2f7a3c',
      '--pp-inverse-bg': '#1e2a22',
      '--pp-inverse-ink': '#fffcf2',
      '--pp-inverse-muted': '#b9c6ba',
      '--pp-inverse-line': '#46564a',
      '--pp-placeholder': '#e6e3d6',
      '--pp-highlight': '#f5c242',
      '--pp-radius': '20px',
      '--pp-radius-lg': '32px',
      '--pp-radius-pill': '999px',
      '--pp-font-display': 'var(--font-pp-round), system-ui, sans-serif',
      '--pp-font-body': 'var(--font-pp-soft), system-ui, sans-serif',
      '--pp-font-num': 'var(--font-pp-round), system-ui, sans-serif',
      '--pp-display-weight': '700',
      '--pp-display-tracking': '-0.025em',
      '--pp-hero-size': 'clamp(2.4rem, 5.4vw, 4.3rem)',
      '--pp-h2-size': 'clamp(1.75rem, 3vw, 2.4rem)',
      '--pp-stat-size': 'clamp(2.1rem, 3.6vw, 2.75rem)',
      '--pp-gap': 'clamp(2.75rem, 4.5vw, 3.5rem)',
    },
    blocks: [
      { id: 'hero', variant: 'goal' },
      { id: 'numbers', variant: 'cards' },
      { id: 'people', variant: 'chips' },
      { id: 'photos', variant: 'row' },
      { id: 'map', variant: 'rounded' },
      { id: 'species', variant: 'cards' },
      { id: 'badges' },
      { id: 'share', variant: 'card' },
      { id: 'footer', variant: 'quiet' },
    ],
  },
}

export function resolveTheme(id: string | null | undefined): ThemeConfig {
  if (id && id in THEMES) return THEMES[id as PublicPageTheme]
  return THEMES.full
}

/** Anchor targets the Full theme's sticky nav links to, in order. */
export const ANCHOR_SECTIONS: Array<{ id: string; label: string }> = [
  { id: 'pp-map', label: 'Map' },
  { id: 'pp-photos', label: 'From the field' },
  { id: 'pp-detail', label: 'The detail' },
  { id: 'pp-species', label: 'Species' },
  { id: 'pp-data', label: 'Data' },
]
