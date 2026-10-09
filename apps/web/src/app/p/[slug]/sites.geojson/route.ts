import { NextResponse } from 'next/server'
import { fetchPublicPage } from '@/components/public-page/fetch'

/**
 * Site boundaries as a GeoJSON file.
 *
 * Re-serves exactly what the page was rendered from, so what someone
 * downloads is what they were looking at. Site polygons only, matching the
 * map: there is no tree-level endpoint here by design.
 */
export const revalidate = 3600

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const data = await fetchPublicPage(slug)

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = JSON.stringify(
    {
      type: 'FeatureCollection',
      features: data.sites.features,
      // Provenance travels with the file. A GeoJSON that turns up in someone
      // else's GIS six months later should still say where it came from.
      metadata: {
        project: data.project.name,
        projectUid: data.project.uid,
        source: 'TreeMapper by Plant-for-the-Planet',
        snapshotAt: data.snapshotAt,
        note: 'Site boundaries only. Individual tree positions are not published.',
      },
    },
    null,
    2,
  )

  return new NextResponse(body, {
    headers: {
      'content-type': 'application/geo+json; charset=utf-8',
      'content-disposition': `attachment; filename="${data.project.slug ?? data.project.uid}-sites.geojson"`,
    },
  })
}
