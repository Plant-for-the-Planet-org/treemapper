import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchPublicPage } from '@/components/public-page/fetch'
import { fontClassName } from '@/components/public-page/fonts'
import { PublicProjectPageView } from '@/components/public-page/PublicProjectPageView'
import { THEMES, resolveTheme } from '@/components/public-page/themes'
import { PUBLIC_PAGE_THEMES } from '@/components/public-page/types'

/**
 * Preview a project's public page in any of the four themes.
 *
 * Exists so a project admin can compare them before choosing one, and so the
 * stored theme is not the only way to see the others. It is a separate route
 * rather than a `?theme=` parameter on the real page, because reading a search
 * param would make that page dynamic and give up its static cache.
 *
 * Always fresh, never indexed. It is a working tool, not a second public URL
 * for the same project.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Public page theme preview',
  robots: { index: false, follow: false },
}

export function generateStaticParams() {
  return []
}

interface PageProps {
  params: Promise<{ slug: string; theme: string }>
}

export default async function PublicProjectThemePreview({ params }: PageProps) {
  const { slug, theme: requested } = await params

  if (!PUBLIC_PAGE_THEMES.includes(requested as (typeof PUBLIC_PAGE_THEMES)[number])) {
    notFound()
  }

  const data = await fetchPublicPage(slug, false)
  if (!data) notFound()

  const theme = resolveTheme(requested)
  const stored = data.theme

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-[#15201b] px-6 py-3 text-[0.8125rem] text-[#f4f6f4]">
        <span className="font-semibold">Theme preview</span>
        <nav className="flex flex-wrap gap-2" aria-label="Themes">
          {Object.values(THEMES).map((option) => {
            const active = option.id === theme.id
            return (
              <a
                key={option.id}
                href={`/p/${slug}/preview/${option.id}`}
                className="inline-flex min-h-[36px] items-center rounded-full px-3.5 py-1.5 no-underline"
                style={
                  active
                    ? { background: '#f4f6f4', color: '#15201b', fontWeight: 600 }
                    : { border: '1px solid #3b4c43', color: '#cfdbd1' }
                }
              >
                {option.label}
                {option.id === stored ? ' (live)' : ''}
              </a>
            )
          })}
        </nav>
        <span className="ml-auto text-[#9fb0a4]">
          Not indexed. Set the live theme in project settings.
        </span>
      </div>

      <PublicProjectPageView data={data} theme={theme} fontClassName={fontClassName(theme)} />
    </>
  )
}
