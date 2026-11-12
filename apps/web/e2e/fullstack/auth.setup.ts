import fs from 'node:fs'
import path from 'node:path'

import { type APIRequestContext, expect, test as setup } from '@playwright/test'

import { hideNextDevTools } from '../helpers/devtools'
import { AUTH_FILE, assertLocalBackend, credentials } from './env'

const AUTH0_LOGIN = /^https:\/\/accounts\.plant-for-the-planet\.org\/u\//

// Same claim the app and server read (see helpers/auth.ts).
const EMAIL_CLAIM = 'https://app.plant-for-the-planet.org/email'

// A saved token is reused only if it has at least this long left, so it
// cannot expire in the middle of a run.
const MIN_TOKEN_LIFE_MS = 60 * 60 * 1000

// Runs before the Layer 2 specs, every time. In order:
//   1. Check the backend is local (never shared staging).
//   2. Check the local API server is running.
//   3. Check whether AUTH_FILE holds a token that is still good.
//   4. Reuse it, or log in through the real Auth0 Universal Login page.
//   5. Save the token, only after a new login.
// Steps 1 and 2 never depend on the saved token: a good token must not skip
// the safety checks.
setup(
  'log in through Auth0, or reuse a saved login',
  async ({ page, request, baseURL }) => {
    // 1. The backend is local.
    assertLocalBackend()
    const { email, password } = credentials()

    // 2. The backend is running. Without a token the Nest server answers 401.
    // A 5xx means the Next rewrite has nothing on SERVER_PORT to talk to.
    const probe = await request.get('/api/server/users/me')
    expect(
      probe.status(),
      'The local API server is not answering on /api/server. Start apps/server first.',
    ).toBe(401)

    const appOrigin = new URL(baseURL!).origin

    // 3 and 4. Reuse a saved token when it is still good.
    const saved = await checkSavedToken(request, appOrigin, email)
    setup.info().annotations.push({ type: 'auth', description: saved.reason })
    if (saved.reusable) return

    await hideNextDevTools(page)
    await page.goto('/login')
    await page.getByRole('button', { name: 'Continue with email' }).click()

    // Identifier first: the email, then the password on its own page.
    await page.waitForURL(AUTH0_LOGIN)
    await page.getByLabel('Email address').fill(email)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    await page.locator('input#password').fill(password)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

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
    let token: string | null = null
    await expect
      .poll(
        async () =>
          (token = await page.evaluate(() =>
            localStorage.getItem('access_token'),
          )),
        {
          message: 'No access token was stored after the login',
          timeout: 15_000,
        },
      )
      .toBeTruthy()

    // 5. Save the token, and only the token.
    saveToken(appOrigin, token!)
  },
)

/**
 * Whether AUTH_FILE holds a token the specs can start from: one for this app's
 * origin, for the account in .env.e2e, with time left, and accepted by the
 * local server. `reason` says which check decided it, without the email or the
 * token.
 */
async function checkSavedToken(
  request: APIRequestContext,
  appOrigin: string,
  email: string,
): Promise<{ reusable: boolean; reason: string }> {
  const token = readSavedToken(appOrigin)
  if (!token) return { reusable: false, reason: 'New login: no saved token' }

  const claims = decodeClaims(token)
  console.log('Saved token claims:', claims)
  if (!claims) {
    return { reusable: false, reason: 'New login: saved token is unreadable' }
  }

  // A changed test account in .env.e2e must not run as the old one.
  const tokenEmail = String(claims[EMAIL_CLAIM] ?? claims.email ?? '')
  if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
    return {
      reusable: false,
      reason: 'New login: saved token is for another account',
    }
  }

  const msLeft = Number(claims.exp) * 1000 - Date.now()
  if (!(msLeft > MIN_TOKEN_LIFE_MS)) {
    return {
      reusable: false,
      reason: 'New login: saved token expires within an hour',
    }
  }

  // The last word is the server's: it checks the signature, the audience and
  // that the account is active, none of which the claims above can prove.
  const res = await request.get('/api/server/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status() !== 200) {
    return {
      reusable: false,
      reason: `New login: the server refused the saved token (${res.status()})`,
    }
  }

  const hours = (msLeft / 3_600_000).toFixed(1)
  return {
    reusable: true,
    reason: `Reused the saved token (${hours} hours left)`,
  }
}

function readSavedToken(appOrigin: string): string | undefined {
  try {
    const state = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'))
    return state.origins
      ?.find((o: { origin: string }) => o.origin === appOrigin)
      ?.localStorage?.find(
        (item: { name: string }) => item.name === 'access_token',
      )?.value
  } catch {
    // No file yet, or not JSON: log in again.
    return undefined
  }
}

function decodeClaims(token: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
  } catch {
    return undefined
  }
}

// The specs only need localStorage.access_token. The browser's full state
// would also keep Auth0's session cookies, which last 100 days and can mint
// new tokens without a password, so they are left out. Readable by this user
// only.
function saveToken(appOrigin: string, token: string) {
  const state = {
    cookies: [],
    origins: [
      {
        origin: appOrigin,
        localStorage: [{ name: 'access_token', value: token }],
      },
    ],
  }
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })
  fs.writeFileSync(AUTH_FILE, JSON.stringify(state, null, 2), { mode: 0o600 })
  // `mode` only applies when the file is created; an older file keeps its own.
  fs.chmodSync(AUTH_FILE, 0o600)
}
