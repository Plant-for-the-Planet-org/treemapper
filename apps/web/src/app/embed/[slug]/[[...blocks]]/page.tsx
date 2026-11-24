import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EmbedBridge } from '@/components/public-page/EmbedBridge'
import { embedLayout, parseEmbedBlocks } from '@/components/public-page/embed'
import { fetchPublicPage } from '@/components/public-page/fetch'
import { fontClassName } from '@/components/public-page/fonts'
import { PublicProjectPageView } from '@/components/public-page/PublicProjectPageView'
import { resolveTheme } from '@/components/public-page/themes'

/**
 * The embeddable widget: `/embed/:slug/<block>/<block>...`.
 *
 * Same data and same rules as `/p/:slug` (it reads the same endpoint, so a
 * page that is switched off is a 404 here too), but only the blocks named in
 * the URL, with no page chrome. `next.config.ts` lets any site frame this
 * path and nothing else. See `components/public-page/embed.ts` for why the
 * blocks live in the path.
 */
export const revalidate = 300
export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

interface PageProps {
  params: Promise<{ slug: string; blocks?: string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchPublicPage(slug)
  return {
    title: data ? `${data.project.name} | TreeMapper` : 'TreeMapper',
    // A widget is a fragment of a page that is already indexed.
    robots: { index: false, follow: true },
  }
}

export default async function EmbedPage({ params }: PageProps) {
  const { slug, blocks: segments } = await params
  const ids = parseEmbedBlocks(segments)
  if (!ids) notFound()

  const data = await fetchPublicPage(slug)
  if (!data) notFound()

  const pageTheme = resolveTheme(data.theme)
  // Tighter rhythm than the full page: the page's section gap is sized for
  // a scroll through a long story, and reads as empty space in a small box.
  const theme = {
    ...pageTheme,
    tokens: { ...pageTheme.tokens, '--pp-gap': 'clamp(1.5rem, 4vw, 2.25rem)' },
  }
  const blocks = embedLayout(pageTheme, data.layout, ids)
  const pagePath = `/p/${data.project.slug ?? data.project.uid}`

  return (
    <EmbedBridge>
      <div style={{ ...(theme.tokens as CSSProperties), background: 'var(--pp-bg)' }}>
        <div style={{ paddingTop: 'var(--pp-gap)' }}>
          <PublicProjectPageView
            data={data}
            theme={theme}
            blocks={blocks}
            fontClassName={fontClassName(theme)}
          />
        </div>
        <div
          className={fontClassName(theme)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            padding: '1rem clamp(1rem, 4vw, 2rem)',
            marginTop: 'var(--pp-gap)',
            borderTop: '1px solid var(--pp-line)',
            fontFamily: 'var(--pp-font-body)',
            fontSize: '0.8125rem',
            color: 'var(--pp-muted)',
          }}
        >
          <span>Every tree mapped in the field with TreeMapper</span>
          <a
            href={pagePath}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--pp-accent-ink)', fontWeight: 600, textDecoration: 'none' }}
          >
            See the full project &rarr;
          </a>
        </div>
      </div>
    </EmbedBridge>
  )
}
