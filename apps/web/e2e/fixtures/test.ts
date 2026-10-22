import { test as base, expect } from '@playwright/test';

import { seedToken } from '../helpers/auth';
import { type Auth0Stub, stubAuth0 } from '../helpers/auth0';
import { ApiMock } from './api-mock';

interface Options {
  /** Seed a fake token and start the Auth0 stub with a session. */
  loggedIn: boolean;
}

interface Fixtures {
  /** Hosts outside the app that a test tried to reach. Blocked, not failed. */
  blockedHosts: string[];
  api: ApiMock;
  auth0: Auth0Stub;
}

// Import `test` and `expect` from here, not from @playwright/test, so every
// spec gets the guards below even when it never names them.
//
// Playwright runs the newest matching route first, so the order is: block every
// other origin, then let the API mock and the Auth0 stub claim their requests
// ahead of that. `api` and `auth0` depend on `blockedHosts` to force it.
export const test = base.extend<Options & Fixtures>({
  loggedIn: [false, { option: true }],

  blockedHosts: [
    async ({ page, baseURL }, use) => {
      const appOrigin = new URL(baseURL!).origin;
      const blocked: string[] = [];

      // Map tiles, the image CDN and anything else external. Maps are drawn on
      // a WebGL canvas that tests do not read, so nothing is lost.
      await page.route('**/*', route => {
        const { origin } = new URL(route.request().url());
        if (origin === appOrigin) return route.fallback();

        if (!blocked.includes(origin)) blocked.push(origin);
        return route.abort('blockedbyclient');
      });

      await use(blocked);
    },
    { auto: true },
  ],

  api: [
    async ({ page, baseURL, blockedHosts }, use) => {
      void blockedHosts;
      const api = new ApiMock();
      await api.install(page, new URL(baseURL!).origin);

      await use(api);

      expect(api.unmocked, 'API calls with no mock').toEqual([]);
    },
    { auto: true },
  ],

  auth0: [
    async ({ page, blockedHosts, loggedIn }, use) => {
      void blockedHosts;
      // A real logged-in user also has an Auth0 session, so give them one.
      const stub = await stubAuth0(page, { session: loggedIn });

      await use(stub);

      expect(stub.unexpected, 'Auth0 requests the stub does not know').toEqual(
        []
      );
    },
    { auto: true },
  ],

  page: async ({ page, baseURL, loggedIn }, use) => {
    if (loggedIn) await seedToken(page, { origin: new URL(baseURL!).origin });
    await use(page);
  },
});

export { expect };
