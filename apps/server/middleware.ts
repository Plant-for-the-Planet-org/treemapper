import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'
import { type NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import { NextMiddlewareResult } from 'next/dist/server/web/types'

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const headers = { 'accept-language': request.headers.get('accept-language') ?? '' }

  const response = NextResponse.next()

  /*
   * Match all request paths except for the ones starting with:
   * - login
   * - register
   */
  if (![
    '/login',
    '/register',
  ].includes(request.nextUrl.pathname)) {
    const res: NextMiddlewareResult = await withAuth(
      // Response with local cookies
      () => response,
      {
      // Matches the pages config in `[...nextauth]`
        pages: {
          signIn: '/login',
        },
      },
    )(request as NextRequestWithAuth, event)
    return res
  }

  return response
}
