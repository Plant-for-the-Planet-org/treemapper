// Values both E2E layers need. Each one mirrors the app, so keep them in step
// with it.

/**
 * The browser only ever calls same-origin /api/server/*, which next.config.ts
 * rewrites to the Nest server.
 */
export const API_PREFIX = '/api/server/'

/** The custom email claim in the access token, read by the app and server. */
export const EMAIL_CLAIM = 'https://app.plant-for-the-planet.org/email'
