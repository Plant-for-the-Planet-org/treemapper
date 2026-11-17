import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * On-demand revalidation for a public project page.
 *
 * The /p pages are statically regenerated on a timer, which is right for field
 * data but wrong for the enable switch: without this, a page someone just
 * turned on (or off) keeps serving its cached answer until the timer fires.
 * The settings screen calls this after every successful save so the public URL
 * reflects the change immediately.
 *
 * Deliberately unauthenticated: all it can do is ask Next to rebuild a /p
 * page, which the backend's own public-page cache absorbs. It cannot read
 * anything, and it only accepts strings shaped like a project slug or uid, so
 * it cannot be pointed at any other path.
 */
const SLUG_OR_UID = /^(?:[a-z0-9-]{3,120}|proj_[A-Za-z0-9]{1,60})$/

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const slugs = [
    (body as { slug?: unknown })?.slug,
    (body as { uid?: unknown })?.uid,
  ].filter((value): value is string => typeof value === 'string' && SLUG_OR_UID.test(value))

  if (!slugs.length) {
    return NextResponse.json({ error: 'Provide a project slug or uid' }, { status: 400 })
  }

  for (const slug of slugs) {
    // The page resolves by slug and by uid, and each spelling is its own cache
    // entry, so the caller sends both and all the routes under each are purged.
    revalidatePath(`/p/${slug}`)
    revalidatePath(`/p/${slug}/data.json`)
    revalidatePath(`/p/${slug}/sites.geojson`)
    revalidatePath(`/p/${slug}/opengraph-image`)
  }

  return NextResponse.json({ revalidated: slugs })
}
