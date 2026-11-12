import { expect, test as setup } from '@playwright/test'

import { hideNextDevTools } from '../helpers/devtools'
import { AUTH_FILE, assertLocalBackend, credentials } from './env'

const AUTH0_LOGIN = /^https:\/\/accounts\.plant-for-the-planet\.org\/u\//

// Runs once before the Layer 2 specs. It logs in through the real Auth0
// Universal Login page, the way a user does, and saves the browser state
// (localStorage.access_token) to AUTH_FILE for the specs to start from.
setup('log in through Auth0', async ({ page, request, baseURL }) => {
  assertLocalBackend()
  const { email, password } = credentials()

  // Without a token the Nest server answers 401. A 5xx means the Next rewrite
  // has nothing on SERVER_PORT to talk to.
  const probe = await request.get('/api/server/users/me')
  expect(
    probe.status(),
    'The local API server is not answering on /api/server. Start apps/server first.',
  ).toBe(401)

  await hideNextDevTools(page)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continue with email' }).click()

  // Identifier first: the email, then the password on its own page.
  await page.waitForURL(AUTH0_LOGIN)
  await page.getByLabel('Email address').fill(email)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  await page.locator('input#password').fill(password)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  const appOrigin = new URL(baseURL!).origin
  const backInApp = (url: URL) => url.origin === appOrigin
  // Three ways out of the password page: back to the app, Auth0's consent
  // screen (Auth0 asks each user once to allow an app that runs on
  // localhost), or a rejection. Wait for all three and handle whichever
  // happens first.
  const outcome = await Promise.race([
    page
      .waitForURL(
        url => backInApp(url) || url.pathname.startsWith('/u/consent'),
      )
      .then(() => 'navigated' as const),
    page
      .getByText('Wrong email or password')
      .waitFor()
      .then(() => 'rejected' as const),
  ])

  // Fail at once and never retry: each bad attempt counts toward Auth0's
  // account lockout.
  if (outcome === 'rejected') {
    throw new Error(
      'Auth0 rejected E2E_USER_EMAIL / E2E_USER_PASSWORD in apps/web/.env.e2e. ' +
        'Check them by logging in by hand before running again.',
    )
  }

  // Not back in the app yet, so this is the consent screen.
  if (!backInApp(new URL(page.url()))) {
    await page.getByRole('button', { name: 'Accept' }).click()
    await page.waitForURL(backInApp)
  }
  // Auth0 sends back a one-time code, not the token. The app swaps that code
  // for the token at /api/auth/callback and then stores it in localStorage,
  // so the token can land a moment after the redirect. Keep checking until it
  // appears or the timeout expires.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('access_token')), {
      message: 'No access token was stored after the login',
      timeout: 15_000,
    })
    .toBeTruthy()
  // Save the authenticated browser state so other E2E tests
  // can reuse the session without logging in again.
  await page.context().storageState({ path: AUTH_FILE })
})
