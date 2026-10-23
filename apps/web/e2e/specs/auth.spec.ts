import { createHash } from 'node:crypto';

import type { ApiMock } from '../fixtures/api-mock';
import { MAIN_PROJECT, USER, mockSession } from '../fixtures/data/session';
import { expect, test } from '../fixtures/test';
import { E2E_EMAIL, fakeJwt, seedToken } from '../helpers/auth';
import { AUTH0_ORIGIN, E2E_AUTH_CODE } from '../helpers/auth0';
import { fail, ok } from '../helpers/envelope';

const DEEP_LINK = `/project/${MAIN_PROJECT.uid}/settings?tab=features`;

// Return paths that point off the app. `/\` is on the list because browsers
// read it as `//`.
const EVIL_PATHS = ['//evil.example', 'https://evil.example', '/\\evil.example'];

function sha256(value: string) {
  return createHash('sha256').update(value).digest('base64url');
}

// Settings is only the page these tests land on; these are its own loads.
function mockSettingsPage(api: ApiMock) {
  api
    .get(`projects/${MAIN_PROJECT.uid}`, ok(MAIN_PROJECT))
    .get(`projects/${MAIN_PROJECT.uid}/images`, ok([]))
    // Only the features tab asks for this. No data means "no key yet".
    .get(`projects/${MAIN_PROJECT.uid}/api-key`, ok(null));
}

function storage(page: import('@playwright/test').Page) {
  return page.evaluate(() => ({
    token: localStorage.getItem('access_token'),
    session: { ...sessionStorage },
  }));
}

declare global {
  interface Window {
    __e2eTokenWrites: string[];
  }
}

// Records every write of `access_token` the app makes. The auth store writes
// the token when it takes one, so this is the signal that the app has read it.
// Added after the `loggedIn` seed script, so the seed's own write is not counted.
function watchTokenWrites(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    window.__e2eTokenWrites = [];
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === window.localStorage && key === 'access_token') {
        window.__e2eTokenWrites.push(value);
      }
      return setItem.call(this, key, value);
    };
  });
}

test.describe('no session', () => {
  test('a protected page sends you to login and keeps the return path', async ({
    page,
    auth0,
  }) => {
    await page.goto(DEEP_LINK);

    await expect(page).toHaveURL(`/login?returnTo=${encodeURIComponent(DEEP_LINK)}`);
    await expect(
      page.getByRole('button', { name: 'Continue with email' })
    ).toBeVisible();

    // The app tried a silent login first, and it did not leave a token behind.
    expect(
      auth0.authorizeRequests.map(url => url.searchParams.get('prompt'))
    ).toEqual(['none']);
    expect((await storage(page)).token).toBeNull();
  });

  // isTokenExpired counts the last 30s before `exp` as expired already.
  const staleTokens = [
    { name: 'an expired token', expiresIn: -60 },
    { name: 'a token that expires within 30s', expiresIn: 10 },
  ];

  for (const { name, expiresIn } of staleTokens) {
    test(`${name} is cleared and you are sent to login`, async ({
      page,
      api,
      auth0,
      baseURL,
    }) => {
      await seedToken(page, {
        origin: new URL(baseURL!).origin,
        token: fakeJwt({ exp: Math.floor(Date.now() / 1000) + expiresIn }),
      });

      await page.goto(DEEP_LINK);

      await expect(page).toHaveURL(`/login?returnTo=${encodeURIComponent(DEEP_LINK)}`);
      // The stored token was dropped, so the app asked Auth0 instead.
      expect(auth0.silentAnswers).toEqual(['login_required']);
      expect((await storage(page)).token).toBeNull();
      // And it never sent the stale token to the API.
      expect(api.calls).toEqual([]);
    });
  }
});

test.describe('silent login', () => {
  test('an Auth0 session logs you in with no click', async ({
    page,
    api,
    auth0,
  }) => {
    mockSession(api);
    mockSettingsPage(api);
    // Auth0 still has a session, but this tab has no token: a new tab, or
    // localStorage cleared.
    auth0.session = true;

    await page.goto(DEEP_LINK);

    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
    await expect(page).toHaveURL(DEEP_LINK);

    // One silent login, answered with a code, and no login page.
    expect(
      auth0.authorizeRequests.map(url => url.searchParams.get('prompt'))
    ).toEqual(['none']);
    expect(auth0.silentAnswers).toEqual(['code']);
    const silent = auth0.authorizeRequests[0].searchParams;
    expect(silent.get('code_challenge_method')).toBe('S256');

    // The hidden iframe's code was exchanged with the verifier the app kept in
    // memory, the one behind the silent challenge.
    expect(auth0.tokenRequests).toHaveLength(1);
    const exchange = auth0.tokenRequests[0];
    expect(exchange).toMatchObject({
      grant_type: 'authorization_code',
      code: E2E_AUTH_CODE,
      redirect_uri: silent.get('redirect_uri'),
    });
    expect(sha256(exchange.code_verifier)).toBe(silent.get('code_challenge'));

    // The verifier never touched storage, and the new token is stored and used.
    const after = await storage(page);
    expect(after.session).not.toHaveProperty('pkce_code_verifier');
    expect(after.token).toBe(auth0.accessToken);
    expect(
      api.callsTo('GET', 'users/me')[0].request.headers().authorization
    ).toBe(`Bearer ${auth0.accessToken}`);
    // The iframe is gone once it has answered.
    await expect(page.locator('iframe')).toHaveCount(0);
  });
});

// getSafeRedirectPath guards both places a return path comes from a URL: the
// `returnTo` on /login, which becomes the OAuth state, and the `redirectTo` on
// /redirecting after logout. Each must fall back to `/` for another site.
test.describe('open redirect', () => {
  const loginCases = [
    // The control: proves the check below reads the value the app saved.
    { returnTo: DEEP_LINK, saved: DEEP_LINK },
    ...EVIL_PATHS.map(returnTo => ({ returnTo, saved: '/' })),
  ];

  for (const { returnTo, saved } of loginCases) {
    test(`login saves returnTo=${returnTo} as ${saved}`, async ({
      page,
      auth0,
    }) => {
      let state: string | null = null;

      // Newest route wins, so this runs ahead of the Auth0 stub. It stops the
      // login here: a 204 cancels the navigation and leaves the browser on
      // /login, where the saved state can be read. Finishing at `/` would need
      // the overview's mocks, and /redirecting goes to the saved state without
      // checking it again, so the saved value is the one that counts.
      await page.route(
        url => url.origin === AUTH0_ORIGIN && url.pathname === '/authorize',
        route => {
          const url = new URL(route.request().url());
          if (url.searchParams.get('prompt') === 'none') return route.fallback();

          state = url.searchParams.get('state');
          return route.fulfill({ status: 204 });
        }
      );

      await page.goto(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      // Let the silent login on page load finish before starting a real one.
      await expect.poll(() => auth0.silentAnswers).toEqual(['login_required']);
      await page.getByRole('button', { name: 'Continue with email' }).click();

      await expect.poll(() => state).toBeTruthy();
      expect((await storage(page)).session[`oauth_state_${state}`]).toBe(saved);
    });
  }

  for (const redirectTo of EVIL_PATHS) {
    test(`logout return ignores redirectTo=${redirectTo}`, async ({
      page,
      blockedHosts,
      baseURL,
    }) => {
      await page.goto(
        `/redirecting?logoutSuccess=true&redirectTo=${encodeURIComponent(redirectTo)}`
      );

      // It falls back to `/` on the app. With no session, `/` then goes on to
      // login, but only after a silent login the app allows 5s for, so do not
      // wait for that: either page counts.
      await expect(page).toHaveURL(
        url =>
          url.origin === new URL(baseURL!).origin &&
          (url.pathname === '/' || url.pathname === '/login')
      );
      expect(blockedHosts.filter(host => host.includes('evil.example'))).toEqual([]);
    });
  }
});

test.describe('login', () => {
  test('the full round trip lands you back on the deep link', async ({
    page,
    api,
    auth0,
    baseURL,
  }) => {
    mockSession(api);
    mockSettingsPage(api);

    await page.goto(DEEP_LINK);
    await expect(page).toHaveURL(/\/login\?returnTo=/);
    await page.getByRole('button', { name: 'Continue with email' }).click();

    // Auth0 (stubbed) sends the browser to the real /api/auth/callback, which
    // hands off to /redirecting, which exchanges the code and goes back.
    await expect(page).toHaveURL(DEEP_LINK);
    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();

    const logins = auth0.authorizeRequests.filter(
      url => url.searchParams.get('prompt') !== 'none'
    );
    expect(logins).toHaveLength(1);
    const authorize = logins[0].searchParams;
    expect(authorize.get('response_type')).toBe('code');
    expect(authorize.get('code_challenge_method')).toBe('S256');
    expect(authorize.get('audience')).toBe('urn:plant-for-the-planet');
    expect(authorize.get('scope')).toBe('openid profile email');
    expect(authorize.get('redirect_uri')).toBe(`${baseURL}/api/auth/callback`);
    expect(authorize.get('state')).toBeTruthy();

    // The code exchange proves it holds the verifier behind the challenge it
    // sent. This is the check PKCE exists for.
    expect(auth0.tokenRequests).toHaveLength(1);
    const exchange = auth0.tokenRequests[0];
    expect(exchange).toMatchObject({
      grant_type: 'authorization_code',
      code: E2E_AUTH_CODE,
      client_id: authorize.get('client_id'),
      redirect_uri: authorize.get('redirect_uri'),
    });
    expect(sha256(exchange.code_verifier)).toBe(authorize.get('code_challenge'));

    // The new token is stored and used, and the one-time login values are gone.
    const after = await storage(page);
    expect(after.token).toBe(auth0.accessToken);
    expect(after.session).not.toHaveProperty('pkce_code_verifier');
    expect(after.session).not.toHaveProperty(`oauth_state_${authorize.get('state')}`);
    expect(
      api.callsTo('GET', 'users/me')[0].request.headers().authorization
    ).toBe(`Bearer ${auth0.accessToken}`);
  });

  // GET /api/auth/callback is a Next route handler; these hit it directly, the
  // way Auth0 would after a failed login.
  const callbackErrors = [
    {
      name: 'an unverified email opens the verify-email dialog',
      query: '?error=access_denied&error_description=email_not_verified',
      landsOn: '/login?verification=required',
      shows: { role: 'heading', name: 'Email Verification Required' },
    },
    {
      name: 'an Auth0 error goes back to login with the reason',
      query: '?error=access_denied&error_description=Wrong%20password',
      landsOn: '/login?error=authentication_failed&reason=Wrong+password',
      shows: { role: 'button', name: 'Continue with email' },
    },
    {
      name: 'a callback with no code goes back to login',
      query: '',
      landsOn: '/login?error=no_code',
      shows: { role: 'button', name: 'Continue with email' },
    },
  ] as const;

  for (const { name, query, landsOn, shows } of callbackErrors) {
    test(`callback: ${name}`, async ({ page, auth0 }) => {
      const response = await page.goto(`/api/auth/callback${query}`);

      // Check where the callback redirected on the response, not with
      // toHaveURL. Once /login loads it may tidy its query string with
      // history.replaceState (AuthInitializer does that for `auth_failed`), and
      // that changes the page URL but never the response URL.
      expect(response!.request().redirectedFrom()?.url()).toContain(
        '/api/auth/callback'
      );
      const target = new URL(response!.url());
      expect(target.pathname + target.search).toBe(landsOn);
      await expect(page.getByRole(shows.role, { name: shows.name })).toBeVisible();
      expect(auth0.tokenRequests).toHaveLength(0);
      expect((await storage(page)).token).toBeNull();
    });
  }
});

test.describe('logged in', () => {
  test.use({ loggedIn: true });

  test('opening login keeps the session and does not break', async ({
    page,
    api,
    auth0,
  }) => {
    // The guard for the test below. That one is marked test.fail(), which
    // turns every failure into a pass, so it cannot catch a crash or a lost
    // token here. This one must pass both before and after #1124 is fixed.
    mockSession(api);
    mockSettingsPage(api);

    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await watchTokenWrites(page);

    await page.goto(`/login?returnTo=${encodeURIComponent(DEEP_LINK)}`);

    // The app has read the stored token and taken it: the auth store writes it
    // back when it does. Without this wait, the checks below could run before
    // the app has done anything at all.
    await page.waitForFunction(() => window.__e2eTokenWrites.length > 0);

    // Still on login while #1124 is open, on the deep link once it is fixed.
    await expect(
      page
        .getByRole('button', { name: 'Continue with email' })
        .or(page.getByRole('button', { name: 'Account menu' }))
    ).toBeVisible();
    expect((await storage(page)).token).not.toBeNull();
    // The token was good, so the app had no reason to ask Auth0 for a new one.
    expect(auth0.authorizeRequests).toHaveLength(0);
    expect(pageErrors).toEqual([]);
  });

  test('opening login sends you on to the return path', async ({ page, api }) => {
    // Known bug, issue #1124. LoginContent only sends you on once the user profile is in
    // the store, and only DashboardClientLayout loads it, which /login is not
    // under. So a cold load of /login with a valid token stays on /login.
    // Remove this line when it is fixed; the test then has to pass.
    // test.fail() passes on any failure, so this test checks the redirect
    // only. The test above covers everything else on this page.
    test.fail(true, 'logged-in user is not sent on from /login');

    mockSession(api);
    mockSettingsPage(api);

    await page.goto(`/login?returnTo=${encodeURIComponent(DEEP_LINK)}`);

    await expect(page).toHaveURL(DEEP_LINK);
  });

  test('the sidebar menu logs you out at Auth0 and lands on login', async ({
    page,
    api,
    auth0,
    baseURL,
  }) => {
    mockSession(api);
    mockSettingsPage(api);

    await page.goto(`/project/${MAIN_PROJECT.uid}/settings`);
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await expect(page).toHaveURL('/login?returnTo=%2F');

    // logout() goes through Auth0's /v2/logout with the app's client id and
    // asks to come back to /redirecting. It always asks for `/`: every path
    // counts as protected (PROTECTED_PATH holds '/').
    expect(auth0.logoutRequests).toHaveLength(1);
    const logoutUrl = auth0.logoutRequests[0];
    expect(logoutUrl.searchParams.get('client_id')).toBeTruthy();
    expect(logoutUrl.searchParams.get('returnTo')).toBe(
      `${baseURL}/redirecting?logoutSuccess=true&redirectTo=%2F`
    );
    expect((await storage(page)).token).toBeNull();

    // A reload must not log you back in. With no token, the app asks Auth0 for
    // a silent login. The test started with an Auth0 session, so this is
    // refused only if the logout really ended it.
    const silentBefore = auth0.silentAnswers.length;
    const exchangesBefore = auth0.tokenRequests.length;

    await page.reload();

    // Wait for the silent login to finish: its hidden iframe is removed once
    // Auth0 has answered.
    await expect
      .poll(() => auth0.silentAnswers.length)
      .toBeGreaterThan(silentBefore);
    await expect(page.locator('iframe')).toHaveCount(0);

    expect(auth0.silentAnswers.slice(silentBefore)).toEqual(['login_required']);
    expect(auth0.tokenRequests).toHaveLength(exchangesBefore);
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole('button', { name: 'Continue with email' })
    ).toBeVisible();
    expect((await storage(page)).token).toBeNull();
  });

  test('logging out while impersonating ends the impersonation first', async ({
    page,
    api,
    auth0,
  }) => {
    mockSession(api);
    mockSettingsPage(api);
    api.get('users/me', ok({ ...USER, impersonated: true }));
    // How many Auth0 logouts had happened when the exit call came in.
    const logoutsAtExit: number[] = [];
    api.put('workspace/impersonate/exit', () => {
      logoutsAtExit.push(auth0.logoutRequests.length);
      return ok(null);
    });

    await page.goto(`/project/${MAIN_PROJECT.uid}/settings`);
    await expect(page.getByText(`Impersonating ${E2E_EMAIL}`)).toBeVisible();
    const { token } = await storage(page);

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/login?returnTo=%2F');

    // Without the exit, the server would resume the impersonation at the
    // admin's next login. It has to happen before the token is gone.
    const exits = api.callsTo('PUT', 'workspace/impersonate/exit');
    expect(exits).toHaveLength(1);
    expect(exits[0].request.headers().authorization).toBe(`Bearer ${token}`);
    expect(logoutsAtExit).toEqual([0]);
    expect(auth0.logoutRequests).toHaveLength(1);
  });

  test('a failed impersonation exit does not block logout', async ({
    page,
    api,
    auth0,
  }) => {
    mockSession(api);
    mockSettingsPage(api);
    api.get('users/me', ok({ ...USER, impersonated: true }));
    api.put('workspace/impersonate/exit', fail(500));

    await page.goto(`/project/${MAIN_PROJECT.uid}/settings`);
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await expect(page).toHaveURL('/login?returnTo=%2F');
    expect(api.callsTo('PUT', 'workspace/impersonate/exit')).toHaveLength(1);
    expect(auth0.logoutRequests).toHaveLength(1);
    expect((await storage(page)).token).toBeNull();
  });

  test.describe('narrow screen', () => {
    // Below 1280px the sidebar starts collapsed to icons, and the account menu
    // is a different button.
    test.use({ viewport: { width: 1024, height: 720 } });

    test('the collapsed sidebar menu logs you out', async ({
      page,
      api,
      auth0,
    }) => {
      mockSession(api);
      mockSettingsPage(api);

      await page.goto(`/project/${MAIN_PROJECT.uid}/settings`);

      // Only the collapsed button carries the user's name as its title.
      const accountMenu = page.getByRole('button', { name: 'Account menu' });
      await expect(accountMenu).toHaveAttribute('title', USER.name);
      await accountMenu.click();
      await page.getByRole('menuitem', { name: 'Logout' }).click();

      await expect(page).toHaveURL('/login?returnTo=%2F');
      expect(auth0.logoutRequests).toHaveLength(1);
      expect((await storage(page)).token).toBeNull();
    });
  });
});
