import { ImageResponse } from 'next/og'
import { fetchPublicPage } from '@/components/public-page/fetch'
import { fmtHectares, fmtNum, fmtTrees } from '@/components/public-page/format'

/**
 * The social preview card.
 *
 * This is what decides whether a shared link gets clicked, so it leads with
 * the one number the project earned rather than with a logo. Drawn here rather
 * than screenshotting the page, because the page is 4,000 pixels tall and its
 * first screen is mostly a photograph.
 *
 * No webfont is loaded: a font fetch inside image generation is the usual
 * cause of a card that silently fails to render in production.
 */
export const alt = 'TreeMapper project'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 3600

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await fetchPublicPage(slug)

  const name = data?.project.name ?? 'TreeMapper'
  const headline = data ? `${fmtTrees(data.totals.trees)} trees` : 'Recorded in the field'
  const place = data
    ? [data.project.ecosystem, data.project.country].filter(Boolean).join(', ')
    : ''

  const facts = data
    ? [
        `${fmtNum(data.totals.sites)} sites`,
        `${fmtHectares(data.totals.hectares)} hectares`,
        `${fmtNum(data.totals.species)} species`,
      ]
    : []

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0d1f16',
          color: '#f4f1e8',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, color: '#9ab3a3', letterSpacing: 2 }}>
          {place ? place.toUpperCase() : 'PLANT-FOR-THE-PLANET'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 108, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>
            {headline}
          </div>
          <div style={{ display: 'flex', fontSize: 40, color: '#cfdbd1', marginTop: 20 }}>
            {name}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {facts.map((fact) => (
              <div
                key={fact}
                style={{
                  display: 'flex',
                  fontSize: 26,
                  color: '#cfdbd1',
                  border: '1px solid #44604f',
                  borderRadius: 999,
                  padding: '10px 24px',
                }}
              >
                {fact}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', fontSize: 24, color: '#9ab3a3' }}>
            Recorded with TreeMapper
          </div>
        </div>
      </div>
    ),
    size,
  )
}
