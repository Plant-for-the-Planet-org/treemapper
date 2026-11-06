import fs from 'node:fs'

import { defineConfig, devices, type Project } from '@playwright/test'

import { AUTH_FILE, CREDENTIALS_FILE } from './e2e/fullstack/env'

// The test layers and the reasons behind these settings are in
// docs/e2e-testing-plan.md.

const isCI = !!process.env.CI
const port = Number(process.env.E2E_PORT ?? 3000)
const baseURL = `http://localhost:${port}`

// Layer 2 (full stack) is opt in. Without the flag its projects do not exist,
// so `yarn test:e2e` and CI never try a real login.
const isFullstack = !!process.env.E2E_FULLSTACK

// Layer 2 traces and reports hold the real bearer token and the test email,
// and e2e.yml uploads both for anyone to download (the repo is public). So
// Layer 2 must never run in that job. A future CI job for it must not upload
// artifacts, and says so by setting E2E_FULLSTACK_CI_NO_ARTIFACTS.
if (isCI && isFullstack && !process.env.E2E_FULLSTACK_CI_NO_ARTIFACTS) {
  throw new Error(
    'E2E_FULLSTACK is set in CI. Layer 2 artifacts hold a real token, so it ' +
      'needs its own job with no artifact upload. See "CI (Layer 2)" in ' +
      'docs/e2e-testing-plan.md.',
  )
}

if (isFullstack && fs.existsSync(CREDENTIALS_FILE)) {
  process.loadEnvFile(CREDENTIALS_FILE)
}

const fullstackProjects: Project[] = [
  {
    name: 'fullstack-setup',
    testDir: './e2e/fullstack',
    testMatch: /auth\.setup\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      // Never record the login. A trace keeps the typed password in plain
      // text (in the fill action, the page snapshot and the form post), and
      // a screenshot shows the email. A failed login is debugged by running
      // it headed (`--headed`), not from a trace.
      trace: 'off',
      screenshot: 'off',
      video: 'off',
    },
  },
  {
    name: 'fullstack',
    testDir: './e2e/fullstack',
    testMatch: /\.spec\.ts$/,
    dependencies: ['fullstack-setup'],
    use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
  },
]

export default defineConfig({
  // Layer 1 (mocked API). Layer 2 projects set their own folder.
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Keep `open: 'never'`: on a failure the default HTML reporter starts a
  // server and waits for Ctrl+C, which hangs scripted runs.
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    // Many dates are formatted with the browser locale and no explicit locale.
    locale: 'en-US',
    timezoneId: 'UTC',
    // Trace the first attempt and keep it only if it fails. For a flaky test
    // that is the failing run; `on-first-retry` kept the retry, which passed.
    trace: 'retain-on-first-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    ...(isFullstack ? fullstackProjects : []),
  ],
  webServer: {
    // Runs from apps/web (this file's folder), never from the repo root: see
    // CLAUDE.md. CI uses a production build because dev mode compiles each
    // page on first visit, which is slow and flaky.
    command: isCI
      ? `npm run build && npx next start -p ${port}`
      : `npm run dev -- -p ${port}`,
    url: baseURL,
    // Locally a running `npm run dev` is reused. It keeps its own .env, so the
    // values below only apply to a server Playwright starts itself. Next allows
    // one `next dev` per folder, so while one is running E2E_PORT must match it.
    reuseExistingServer: !isCI,
    timeout: 180_000,
    env: {
      // Any value works for Layer 1, but without one the login button throws.
      // Layer 2 logs in for real, so it keeps the client ID from apps/web/.env.
      ...(isFullstack
        ? {}
        : { NEXT_PUBLIC_AUTH0_CLIENT_ID: 'e2e-dummy-client-id' }),
      // A request that slips past the mocks goes to a local server, never to
      // dev.treemapper.app.
      NEXT_PUBLIC_BACKEND_API: 'false',
      MAINTENANCE_MODE: 'false',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
})
