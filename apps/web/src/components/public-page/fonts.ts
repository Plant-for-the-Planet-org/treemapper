import { Bricolage_Grotesque, Figtree, Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import type { ThemeConfig } from './themes'

/**
 * Faces for the public page.
 *
 * Declared here rather than in the root layout for two reasons. The dashboard
 * does not use any of them, and the layout's own fonts are wired to
 * `--font-sans` and friends, which the page must not inherit: a theme owns its
 * typography through `--pp-font-*`.
 *
 * Only the variables a theme lists are attached to the wrapper, so a Report
 * page never ships Bricolage Grotesque.
 */

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-pp-sans',
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-pp-mono',
  display: 'swap',
})

const serif = Fraunces({
  subsets: ['latin'],
  variable: '--font-pp-serif',
  display: 'swap',
})

const round = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-pp-round',
  display: 'swap',
})

const soft = Figtree({
  subsets: ['latin'],
  variable: '--font-pp-soft',
  display: 'swap',
})

const BY_KEY = { sans, mono, serif, round, soft } as const

export function fontClassName(theme: ThemeConfig): string {
  return theme.fonts.map((key) => BY_KEY[key].variable).join(' ')
}
