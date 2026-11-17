import type { Page } from '@playwright/test'

// Custom email claim used by the app and server.
const EMAIL_CLAIM = 'https://app.plant-for-the-planet.org/email'

export const E2E_EMAIL = 'e2e.user@example.com'

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

// An unsigned, made-up token. The browser only reads `exp`
// (isTokenExpired in lib/utils/auth.ts) and the email claim for display. The
// real server would reject it, and in Layer 1 the server never sees it.
export function fakeJwt(claims: Record<string, unknown> = {}): string {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: 'https://accounts.plant-for-the-planet.org/',
    sub: 'auth0|e2e-user',
    aud: 'urn:plant-for-the-planet',
    iat: now,
    exp: now + 60 * 60,
    email: E2E_EMAIL,
    [EMAIL_CLAIM]: E2E_EMAIL,
    ...claims,
  }

  return `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(payload)}.e2e`
}

// Stores the fake token before the app loads.
// Only seed it once per tab, so reloading after logout doesn't log the user
// back in. The origin check also prevents seeding it on other sites or iframes.
export async function seedToken(
  page: Page,
  { origin, token = fakeJwt() }: { origin: string; token?: string },
) {
  await page.addInitScript(
    ({ origin, token }) => {
      if (window.location.origin !== origin || window.top !== window) return
      if (sessionStorage.getItem('e2e-token-seeded')) return

      sessionStorage.setItem('e2e-token-seeded', '1')
      localStorage.setItem('access_token', token)
    },
    { origin, token },
  )
}
