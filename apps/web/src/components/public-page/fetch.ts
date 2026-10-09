import { SAMPLE_PUBLIC_PAGE } from './sample'
import type { PublicProjectPage } from './types'

/**
 * Server-side fetch for the public page.
 *
 * The browser talks to the backend through the `/api/server/*` rewrite in
 * `next.config.ts`, but this runs on the server during static generation, where
 * there is no rewrite to follow. It therefore needs a real origin, resolved the
 * same way the rewrite resolves its destination so the two cannot disagree:
 *
 *  - `NEXT_PUBLIC_BACKEND_API=true`  the hosted dev backend
 *  - otherwise                       the Nest process on this dyno
 *
 * `PUBLIC_PAGE_API_ORIGIN` overrides both, for a deployment that splits the two
 * apps.
 */
function apiOrigin(): string {
  const override = process.env.PUBLIC_PAGE_API_ORIGIN
  if (override) return override.replace(/\/$/, '')

  if (process.env.NEXT_PUBLIC_BACKEND_API === 'true') {
    return 'https://dev.treemapper.app/api/server'
  }

  return `http://127.0.0.1:${process.env.SERVER_PORT || 3001}/api`
}

/** Envelope the server wraps every response in. Success is always 200 in the body. */
interface Envelope<T> {
  statusCode: number
  message: string
  error: unknown
  data: T | null
  code: string
}

/**
 * Returns the page, or null when there is nothing to publish. A project whose
 * public page is switched off answers exactly like a missing one, so the caller
 * cannot tell them apart either.
 */
export async function fetchPublicPage(
  slugOrUid: string,
  revalidateSeconds: number | false = 3600,
): Promise<PublicProjectPage | null> {
  // Development fixture, double gated so it cannot reach a deployed build.
  // Lets the four themes be worked on without the Nest server, and without
  // switching a real project's page on in shared staging just to see a layout.
  if (process.env.NODE_ENV === 'development' && process.env.PUBLIC_PAGE_SAMPLE === 'true') {
    return SAMPLE_PUBLIC_PAGE
  }

  const url = `${apiOrigin()}/public-page/${encodeURIComponent(slugOrUid)}`

  let response: Response
  try {
    response = await fetch(url, {
      headers: { accept: 'application/json' },
      next: revalidateSeconds === false ? { revalidate: 0 } : { revalidate: revalidateSeconds },
      cache: revalidateSeconds === false ? 'no-store' : undefined,
    })
  } catch {
    // The backend being unreachable must not render a broken page. Returning
    // null shows the not-found panel, and the next revalidation retries.
    return null
  }

  if (!response.ok) return null

  const body = (await response.json()) as Envelope<PublicProjectPage>
  if (body.statusCode !== 200 || !body.data) return null

  return body.data
}
