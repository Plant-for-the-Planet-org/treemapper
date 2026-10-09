import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchPublicPage } from '@/components/public-page/fetch'
import { fontClassName } from '@/components/public-page/fonts'
import { fmtHectares, fmtNum, fmtTrees } from '@/components/public-page/format'
import { PublicProjectPageView } from '@/components/public-page/PublicProjectPageView'
import { resolveTheme } from '@/components/public-page/themes'

/**
 * The shareable public project page.
 *
 * Sits outside every route group on purpose: no auth, no `AuthInitializer`,
 * no dashboard chrome, no maintenance gate. It is statically generated and
 * revalidated hourly, so a link that goes round a social network hits the
 * cache rather than the database.
 */
export const revalidate = 3600

/**
 * No project is prerendered at build time. Which projects have a public page
 * is a runtime setting, and building a list would mean querying every project
 * on every deploy to find the handful that opted in.
 */
export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchPublicPage(slug)

  if (!data) {
    return { title: 'Project not found', robots: { index: false, follow: false } }
  }

  const { project, totals } = data
  const description =
    project.description?.trim() ||
    `${fmtTrees(totals.trees)} trees recorded across ${fmtNum(totals.sites)} sites and ${fmtHectares(totals.hectares)} hectares, each one mapped in the field.`

  return {
    title: `${project.name} | TreeMapper`,
    description,
    alternates: { canonical: `/p/${project.slug ?? project.uid}` },
    openGraph: {
      type: 'website',
      title: project.name,
      description,
      siteName: 'TreeMapper by Plant-for-the-Planet',
    },
    twitter: { card: 'summary_large_image', title: project.name, description },
    robots: { index: true, follow: true },
  }
}

export default async function PublicProjectPage({ params }: PageProps) {
  const { slug } = await params
  const data = await fetchPublicPage(slug)

  if (!data) notFound()

  const theme = resolveTheme(data.theme)

  return (
    <PublicProjectPageView data={data} theme={theme} fontClassName={fontClassName(theme)} />
  )
}
