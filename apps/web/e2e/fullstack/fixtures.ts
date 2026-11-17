import fs from 'node:fs'

import { type APIRequestContext, test as base, expect } from '@playwright/test'

import type { ApiResponse } from '@shared-core/types/api-responses'

import { hideNextDevTools } from '../helpers/devtools'
import { AUTH_FILE } from './env'

const API_PREFIX = '/api/server/'

export interface Backend {
  /**
   * GETs a path under /api/server/ as the logged-in user and returns `data`.
   * Fails the test unless the envelope says 200. Use it to read what the page
   * should show, so no real data is ever written into the repo.
   */
  get<T = any>(path: string): Promise<T>
  request: APIRequestContext
}

interface Fixtures {
  /** The real access token the setup project saved. */
  token: string
  backend: Backend
  /** Every /api/server/ call the page made, as `GET users/me` (no query). */
  apiCalls: string[]
}

// Reads the access token the setup project saved to AUTH_FILE.
function savedToken(): string {
  const state = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'))
  const token = state.origins
    ?.flatMap(
      (o: { localStorage: { name: string; value: string }[] }) =>
        o.localStorage,
    )
    .find((item: { name: string }) => item.name === 'access_token')?.value
  if (!token)
    throw new Error(`No access_token in ${AUTH_FILE}. Run the setup project.`)
  return token
}

// Layer 2 (full stack): no API mock, no Auth0 stub, no blocked hosts.
//
// Specs in this folder import `test` and `expect` from here, never from
// ../fixtures/test. That one is Layer 1: it mocks every API call and stubs
// Auth0, so a full-stack spec importing it would quietly test nothing real.
export const test = base.extend<Fixtures>({
  token: async ({}, use) => {
    await use(savedToken())
  },

  backend: async ({ playwright, baseURL, token }, use) => {
    // Use the application's Next.js API rewrite instead of calling
    // the backend directly. This keeps tests on the same API route as the browser.
    const request = await playwright.request.newContext({
      baseURL: new URL(API_PREFIX, baseURL!).toString(),
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })

    await use({
      request,
      async get(path) {
        const res = await request.get(path.replace(/^\//, ''))
        const body = (await res.json()) as ApiResponse
        expect(body.statusCode, `GET ${path}: ${body.message}`).toBe(200)
        return body.data
      },
    })

    await request.dispose()
  },

  // Records every /api/server/ call the page makes, in every test (auto), and
  // fails the test if any of them answered with a 5xx.
  apiCalls: [
    async ({ page, baseURL }, use) => {
      const prefix = new URL(API_PREFIX, baseURL!).toString()
      const calls: string[] = []
      const serverErrors: string[] = []

      page.on('request', req => {
        if (!req.url().startsWith(prefix)) return
        const path = new URL(req.url()).pathname.slice(API_PREFIX.length)
        calls.push(`${req.method()} ${path}`)
      })
      // Capture server errors even when the UI hides them behind an empty state.
      page.on('response', res => {
        if (res.url().startsWith(prefix) && res.status() >= 500) {
          serverErrors.push(
            `${res.status()} ${res.request().method()} ${res.url()}`,
          )
        }
      })

      await use(calls)
      expect(serverErrors, 'API calls that failed on the server').toEqual([])
    },
    { auto: true },
  ],

  page: async ({ page }, use) => {
    await hideNextDevTools(page)
    await use(page)
  },
})

export { expect }
