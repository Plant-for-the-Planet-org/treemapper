import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

function getPublicBaseUrl(request: NextRequest): URL {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost ?? request.headers.get('host');
  if (!host) return new URL(request.url);

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const protocol =
    forwardedProto ?? (host.includes('localhost') ? 'http' : 'https');
  return new URL(`${protocol}://${host}`);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const base = getPublicBaseUrl(request);

  if (error) {
    const errorDesc = searchParams.get('error_description') ?? error;
    console.error('Auth0 callback error:', errorDesc);
    const errUrl = new URL('/login', base);
    // Auth0 PostLogin Action denies unverified emails with
    // error=access_denied / error_description=email_not_verified.
    // ('401' is the legacy shape, kept as a fallback.)
    const emailNotVerified =
      (error === 'access_denied' && errorDesc === 'email_not_verified') ||
      errorDesc === '401';
    if (emailNotVerified) {
      errUrl.searchParams.set('verification', 'required');
    } else {
      errUrl.searchParams.set('error', 'authentication_failed');
      errUrl.searchParams.set('reason', errorDesc);
    }
    return NextResponse.redirect(errUrl);
  }

  if (!code) {
    const noCodeUrl = new URL('/login', base);
    noCodeUrl.searchParams.set('error', 'no_code');
    return NextResponse.redirect(noCodeUrl);
  }

  const url = new URL('/redirecting', base);
  url.searchParams.set('code', code);
  if (state) url.searchParams.set('state', state);

  return NextResponse.redirect(url);
}
