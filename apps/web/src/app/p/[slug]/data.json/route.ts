import { NextResponse } from 'next/server'
import { fetchPublicPage } from '@/components/public-page/fetch'

/**
 * Everything the page was rendered from, as one JSON file.
 *
 * The honest version of a "download the data" button: not a curated export,
 * just the payload itself, so a reader can check any figure on the page
 * against its source.
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

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${data.project.slug ?? data.project.uid}-treemapper.json"`,
    },
  })
}
