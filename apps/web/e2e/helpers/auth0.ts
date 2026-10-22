import type { Page, Route } from '@playwright/test';

import { fakeJwt } from './auth';

// Same host as lib/auth/auth0-config.ts. Nothing in Layer 1 reaches it.
export const AUTH0_ORIGIN = 'https://accounts.plant-for-the-planet.org';

export const E2E_AUTH_CODE = 'e2e-auth-code';

export interface Auth0Stub {
  /** Every /authorize request, silent (`prompt=none`) and interactive, in order. */
  authorizeRequests: URL[];
  /** The JSON bodies posted to /oauth/token. */
  tokenRequests: Record<string, string>[];
  logoutRequests: URL[];
  /** How each silent login (`prompt=none`) was answered, in order. */
  silentAnswers: ('code' | 'login_required')[];
  /** Any other Auth0 request. The fixture fails the test if this is not empty. */
  unexpected: string[];
  /** What /oauth/token hands back. Change it before the login starts. */
  accessToken: string;
  /**
   * Whether Auth0 has a session for the browser, as the real one keeps in its
   * own cookie. An interactive login starts one and /v2/logout ends it.
   */
  session: boolean;
}

function redirect(route: Route, location: string) {
  return route.fulfill({ status: 302, headers: { location } });
}

// The token exchange is a cross-origin fetch, so the browser needs these.
function corsHeaders(route: Route): Record<string, string> {
  return {
    'access-control-allow-origin': route.request().headers().origin ?? '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

// Plays the part of Auth0 so the app's own side of the handshake runs for real:
// the authorize params, the /api/auth/callback route, /redirecting, the token
// exchange and the logout return trip.
//
// `session` starts the stub with an Auth0 session, for a test that begins
// logged in. Silent logins are answered from it, so a logout that fails to end
// the session shows up as a silent login that succeeds.
export async function stubAuth0(
  page: Page,
  { session = false }: { session?: boolean } = {}
): Promise<Auth0Stub> {
  const stub: Auth0Stub = {
    authorizeRequests: [],
    tokenRequests: [],
    logoutRequests: [],
    silentAnswers: [],
    unexpected: [],
    accessToken: fakeJwt(),
    session,
  };

  await page.route(`${AUTH0_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/authorize') {
      stub.authorizeRequests.push(url);

      const back = new URL(url.searchParams.get('redirect_uri') ?? '/');
      if (url.searchParams.get('prompt') === 'none') {
        // A silent login gets a code only while there is a session. Without
        // one, this is what Auth0 answers.
        if (stub.session) {
          stub.silentAnswers.push('code');
          back.searchParams.set('code', E2E_AUTH_CODE);
        } else {
          stub.silentAnswers.push('login_required');
          back.searchParams.set('error', 'login_required');
          back.searchParams.set('error_description', 'Login required');
        }
      } else {
        stub.session = true;
        back.searchParams.set('code', E2E_AUTH_CODE);
      }
      const state = url.searchParams.get('state');
      if (state) back.searchParams.set('state', state);

      return redirect(route, back.toString());
    }

    if (url.pathname === '/oauth/token') {
      if (request.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: corsHeaders(route) });
      }

      stub.tokenRequests.push(request.postDataJSON());
      return route.fulfill({
        status: 200,
        headers: corsHeaders(route),
        json: {
          access_token: stub.accessToken,
          id_token: fakeJwt(),
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid profile email',
        },
      });
    }

    if (url.pathname === '/v2/logout') {
      stub.logoutRequests.push(url);
      stub.session = false;

      const returnTo = url.searchParams.get('returnTo');
      return returnTo
        ? redirect(route, returnTo)
        : route.fulfill({ status: 200, body: 'OK' });
    }

    stub.unexpected.push(`${request.method()} ${url.pathname}`);
    return route.abort();
  });

  return stub;
}
