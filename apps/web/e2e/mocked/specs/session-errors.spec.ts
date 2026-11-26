import type { Page } from '@playwright/test'
import type { ApiMock, MockReply } from '../api-mock'

import { networkError, rawResponse } from '../api-mock'
import { expect, test } from '../test'
import { fail, ok } from '../helpers/envelope'
import {
  advanceClockUntilCallCount,
  countTimeoutsWithDelay,
  expectNoAdditionalCalls,
} from '../helpers/fake-clock'
import { E2E_EMAIL, fakeJwt } from '../helpers/fake-token'
import { mockOverview } from '../mocks/overview'
import { MAIN_PROJECT, USER, WORKSPACE, mockSession } from '../mocks/session'

// F3 in docs/e2e-user-flows.md: what DashboardClientLayout shows when the
// bootstrap fails. A 401 or 403 from `users/me` stops at once. Any other
// failure retries 3 times, 5s apart, then shows the error screen.

test.use({ loggedIn: true })

const PROJECT_PAGE = `/project/${MAIN_PROJECT.uid}/overview`

/** How long the layout waits before each retry. */
const RETRY_DELAY = 5_000

/** The `users/me` reply for a user who has not verified their email yet. */
const EMAIL_NOT_VERIFIED = fail(403, 'Email not verified', 'email_not_verified')

const errorHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Error Occurred' })

const verifyEmailHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Verify your email' })

/** Shown once the dashboard has loaded. */
const dashboardHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Trees Planted' })

const usersMeCallCount = (api: ApiMock) => api.callsTo('GET', 'users/me').length

/**
 * Waits for the first request and then moves the clock forward through all 3 retries.
 * When this finishes, there should be 4 requests in total: 1 initial request + 3 retries.
 * Use this when the test needs to reach the error screen without checking each retry separately.
 */
async function failThroughAllRetries(page: Page, count: () => number) {
  await expect.poll(count).toBe(1)
  for (const expected of [2, 3, 4]) {
    await advanceClockUntilCallCount(page, count, expected)
  }
}

/**
 * Waits until call number `callNumber` has reached the mock and the app has
 * started the retry timer for it.
 *
 * The app starts its 5-second retry timer only after it has read the reply,
 * which happens a little after the request reaches the mock. Moving the fake
 * clock before that would start the timer late and break the exact 5s check,
 * so wait for the timer itself rather than for a fixed amount of real time.
 *
 * Do not wait for the app's "App initialization failed" log instead: the
 * production build used in CI removes every `console.*` call
 * (`removeConsole` in next.config.ts), so that line never appears there.
 */
async function waitForFailureHandled(
  count: () => number,
  retryTimersStarted: () => Promise<number>,
  callNumber: number,
) {
  await expect.poll(count).toBe(callNumber)
  await expect.poll(retryTimersStarted).toBe(callNumber)
}

test.describe('F3. Session error screens', () => {
  test.beforeEach(async ({ page, api }) => {
    await page.clock.install()
    mockSession(api)
  })

  test.describe('401 and 403 stop at once, with no retry', () => {
    test('an unverified email shows "Verify your email" with the address from the token', async ({
      page,
      api,
    }) => {
      api.get('users/me', EMAIL_NOT_VERIFIED)

      await page.goto(PROJECT_PAGE)

      await expect(verifyEmailHeading(page)).toBeVisible()
      // The address comes from the token: `users/me` failed, so it is the only
      // place the page could read it.
      await expect(page.getByText(E2E_EMAIL)).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'I have verified, check again' }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Sign in with a different account' }),
      ).toBeVisible()

      await expectNoAdditionalCalls(page, () => usersMeCallCount(api), 1)
    })

    for (const status of [401, 403]) {
      test(`a ${status} shows the server's message and "Sign in again", which logs out`, async ({
        page,
        api,
        auth0,
      }) => {
        api.get('users/me', fail(status, 'Your account is not active'))

        await page.goto(PROJECT_PAGE)

        await expect(errorHeading(page)).toBeVisible()
        // The server's own message, not the generic one. Scoped to a paragraph:
        // in dev, Next's error overlay repeats the console.error text.
        await expect(
          page
            .getByRole('paragraph')
            .filter({ hasText: 'Your account is not active' }),
        ).toBeVisible()
        // Retrying cannot change the server's answer, so there is no "Try Again".
        await expect(
          page.getByRole('button', { name: 'Try Again' }),
        ).toHaveCount(0)

        await expectNoAdditionalCalls(page, () => usersMeCallCount(api), 1)

        await page.getByRole('button', { name: 'Sign in again' }).click()
        await expect(page).toHaveURL('/login?returnTo=%2F')
        expect(auth0.logoutRequests).toHaveLength(1)
      })
    }
  })

  test.describe('Server errors are retried 3 times', () => {
    test('a 500 shows the error screen after 3 retries, and "Try Again" runs 3 more', async ({
      page,
      api,
    }) => {
      api.get('users/me', fail(500))
      const count = () => usersMeCallCount(api)

      await page.goto(PROJECT_PAGE)
      await expect.poll(count).toBe(1)

      // Three retries. The error screen stays hidden until the last one fails.
      for (const n of [2, 3, 4]) {
        await expect(errorHeading(page)).toHaveCount(0)
        await advanceClockUntilCallCount(page, count, n)
      }

      await expect(errorHeading(page)).toBeVisible()
      await expect(
        page.getByText('There was an error while loading your dashboard'),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

      // No fourth retry.
      await expectNoAdditionalCalls(page, count, 4)

      // "Try Again" resets the counter: one call now, three more retries.
      await page.getByRole('button', { name: 'Try Again' }).click()
      await expect.poll(count).toBe(5)
      for (const n of [6, 7, 8]) {
        await advanceClockUntilCallCount(page, count, n)
      }
      await expect(errorHeading(page)).toBeVisible()

      await expectNoAdditionalCalls(page, count, 8)
    })

    test('each retry fires exactly 5 seconds after the failure', async ({
      page,
      api,
    }) => {
      api.get('users/me', fail(500))
      const count = () => usersMeCallCount(api)

      // `clock.install()` leaves time running at real speed, so the real time
      // spent waiting would count toward the 5s. Stop it, so only the
      // fastForward calls below move it.
      await page.clock.pauseAt(Date.now() + 1_000)
      const retryTimersStarted = await countTimeoutsWithDelay(page, RETRY_DELAY)

      await page.goto(PROJECT_PAGE)

      for (const n of [1, 2, 3]) {
        await waitForFailureHandled(count, retryTimersStarted, n)
        // 1ms short of the delay: nothing yet.
        await expectNoAdditionalCalls(page, count, n, RETRY_DELAY - 1)
        // The last millisecond: the retry goes out.
        await page.clock.fastForward(1)
        await expect.poll(count).toBe(n + 1)
      }

      await expect(errorHeading(page)).toBeVisible()
    })

    // Failures that never reach the app as a clean JSON error. Each must be
    // treated like a server error: retried, then the "Try Again" screen, never
    // a crash, a blank page or "Sign in again".
    const brokenResponses: { name: string; reply: MockReply }[] = [
      { name: 'a network failure', reply: networkError() },
      {
        // What a gateway sends when the server behind it is down.
        name: 'a 502 HTML page',
        reply: rawResponse({ status: 502, body: '<html>Bad Gateway</html>' }),
      },
      {
        // Cut off mid-body, as a dropped connection leaves it.
        name: 'cut-off JSON in a 200',
        reply: rawResponse({
          body: '{"statusCode":200,"data":',
          contentType: 'application/json',
        }),
      },
      {
        name: 'a 200 with no user',
        reply: ok(null),
      },
    ]

    for (const { name, reply } of brokenResponses) {
      test(`${name} is handled like a 500: 3 retries, then "Try Again"`, async ({
        page,
        api,
      }) => {
        api.get('users/me', reply)
        const count = () => usersMeCallCount(api)

        await page.goto(PROJECT_PAGE)
        await failThroughAllRetries(page, count)

        await expect(errorHeading(page)).toBeVisible()
        await expect(
          page.getByText('There was an error while loading your dashboard'),
        ).toBeVisible()
        await expect(
          page.getByRole('button', { name: 'Try Again' }),
        ).toBeVisible()
        await expect(
          page.getByRole('button', { name: 'Sign in again' }),
        ).toHaveCount(0)
      })
    }

    test('a 500 from projects reruns the whole bootstrap (known bug)', async ({
      page,
      api,
    }) => {
      // Known bug, issue #1151. `users/me` already put the user in the store,
      // so when the retry timer sets the state back to idle, the effect in
      // DashboardClientLayout takes the "already loaded" branch and marks
      // success instead of running the bootstrap again. `projects` is never
      // retried; the page spins forever and never shows an error. Fails at the
      // advanceClockUntilCallCount below (1 projects call, never 2).
      test.fail(true, '#1151: a failed GET projects is never retried')
      mockOverview(api)
      let calls = 0
      api.get('projects', () =>
        ++calls === 1
          ? fail(500)
          : ok({ projects: [MAIN_PROJECT], workspaces: [WORKSPACE] }),
      )
      const projectCalls = () => api.callsTo('GET', 'projects').length

      await page.goto(PROJECT_PAGE)
      await expect.poll(projectCalls).toBe(1)
      await advanceClockUntilCallCount(page, projectCalls, 2)

      await expect(dashboardHeading(page)).toBeVisible()
      // The retry runs the whole bootstrap again, `users/me` included.
      expect(usersMeCallCount(api)).toBe(2)
    })
  })

  test.describe('Getting back to the dashboard', () => {
    // 503 is what a server sends while it restarts or is overloaded, the most
    // likely reason a retry helps. It takes the same path as 500.
    for (const status of [500, 503]) {
      test(`the dashboard loads when users/me fails twice with ${status}, then succeeds`, async ({
        page,
        api,
      }) => {
        mockOverview(api)
        let calls = 0
        api.get('users/me', () => (++calls <= 2 ? fail(status) : ok(USER)))
        const count = () => usersMeCallCount(api)

        await page.goto(PROJECT_PAGE)
        await expect.poll(count).toBe(1)
        await advanceClockUntilCallCount(page, count, 2)
        await advanceClockUntilCallCount(page, count, 3)

        await expect(dashboardHeading(page)).toBeVisible()
        await expect(errorHeading(page)).toHaveCount(0)
        // Recovered for good: no retry is left waiting to start over.
        await expectNoAdditionalCalls(page, count, 3)
      })
    }

    test('a double click on "Try Again" sends one request, not two', async ({
      page,
      api,
    }) => {
      mockOverview(api)
      // Fails until the user gives up waiting, then works, so the only calls
      // after the click are the ones the click caused.
      let recovered = false
      api.get('users/me', () => (recovered ? ok(USER) : fail(500)))
      const count = () => usersMeCallCount(api)

      await page.goto(PROJECT_PAGE)
      await failThroughAllRetries(page, count)
      await expect(errorHeading(page)).toBeVisible()

      // Today the first click removes the error screen, so the second lands on
      // whatever is behind it. If the button ever stays up while loading, the
      // second click would start a second bootstrap, and the count shows it.
      recovered = true
      await page.getByRole('button', { name: 'Try Again' }).dblclick()

      await expect(dashboardHeading(page)).toBeVisible()
      await expectNoAdditionalCalls(page, count, 5)
    })

    // A reload is what most users try first. It must start from scratch, not
    // carry over the spent retries or the error screen.
    const reloadCases = [
      {
        serverRecovered: false,
        title: 'retries 3 times when the server is still down',
      },
      {
        serverRecovered: true,
        title: 'loads the dashboard when the server is back',
      },
    ]

    for (const { serverRecovered, title } of reloadCases) {
      test(`a reload after the error screen ${title}`, async ({
        page,
        api,
      }) => {
        mockOverview(api)
        let recovered = false
        api.get('users/me', () => (recovered ? ok(USER) : fail(500)))
        const count = () => usersMeCallCount(api)

        await page.goto(PROJECT_PAGE)
        await failThroughAllRetries(page, count)
        await expect(errorHeading(page)).toBeVisible()

        recovered = serverRecovered
        await page.reload()
        await expect.poll(count).toBe(5)

        if (serverRecovered) {
          await expect(dashboardHeading(page)).toBeVisible()
          await expect(errorHeading(page)).toHaveCount(0)
          await expectNoAdditionalCalls(page, count, 5)
        } else {
          for (const n of [6, 7, 8]) {
            await expect(errorHeading(page)).toHaveCount(0)
            await advanceClockUntilCallCount(page, count, n)
          }
          await expect(errorHeading(page)).toBeVisible()
          await expectNoAdditionalCalls(page, count, 8)
        }
      })
    }
  })

  test.describe('Buttons on the error screens', () => {
    // The ways out that log the user out. "Sign in again" is covered by the
    // 401/403 test in the first group.
    //
    // Not tested: a second click while the first logout is still on its way to
    // Auth0. Logout navigates away at once, and Playwright cannot click (or
    // even dispatch a click) on a page with a navigation pending, so a test
    // here would only ever make one click, whatever it claimed.
    const logoutButtons: {
      screen: string
      button: string
      reply: MockReply
      retriesFirst: boolean
    }[] = [
      {
        screen: 'Error Occurred',
        button: 'Sign out',
        reply: fail(500),
        retriesFirst: true,
      },
      {
        screen: 'Verify your email',
        button: 'Sign in with a different account',
        reply: EMAIL_NOT_VERIFIED,
        retriesFirst: false,
      },
    ]

    for (const { screen, button, reply, retriesFirst } of logoutButtons) {
      test(`"${button}" on "${screen}" logs out and goes to login`, async ({
        page,
        api,
        auth0,
      }) => {
        api.get('users/me', reply)
        const count = () => usersMeCallCount(api)

        await page.goto(PROJECT_PAGE)
        if (retriesFirst) {
          await failThroughAllRetries(page, count)
        }
        await expect(page.getByRole('heading', { name: screen })).toBeVisible()

        await page.getByRole('button', { name: button }).click()

        await expect(page).toHaveURL('/login?returnTo=%2F')
        expect(auth0.logoutRequests).toHaveLength(1)
      })
    }

    test('"I have verified, check again" gets a new token without a full sign in, then loads the dashboard', async ({
      page,
      api,
      auth0,
    }) => {
      mockOverview(api)
      let calls = 0
      api.get('users/me', () => (++calls === 1 ? EMAIL_NOT_VERIFIED : ok(USER)))

      await page.goto(PROJECT_PAGE)
      await expect(verifyEmailHeading(page)).toBeVisible()

      // The user verified, so Auth0 still has a session and now mints a token
      // that says so. Distinct from the seeded one, so the test can tell which
      // token the second call used.
      const freshToken = fakeJwt({ email_verified: true })
      auth0.accessToken = freshToken
      await page
        .getByRole('button', { name: 'I have verified, check again' })
        .click()

      await expect(dashboardHeading(page)).toBeVisible()
      await expect(verifyEmailHeading(page)).toHaveCount(0)

      // A silent login, not a full sign in: no logout, no trip to /login.
      expect(auth0.silentAnswers).toEqual(['code'])
      expect(auth0.tokenRequests).toHaveLength(1)
      expect(auth0.logoutRequests).toHaveLength(0)
      await expect(page).toHaveURL(PROJECT_PAGE)

      // Asking again with the old token would get the same 403, so the check
      // must use the new one.
      const [first, second] = api.callsTo('GET', 'users/me')
      expect(first.request.headers().authorization).not.toBe(
        `Bearer ${freshToken}`,
      )
      expect(second.request.headers().authorization).toBe(
        `Bearer ${freshToken}`,
      )
    })

    test('"I have verified, check again" logs out when the Auth0 session has ended', async ({
      page,
      api,
      auth0,
    }) => {
      api.get('users/me', EMAIL_NOT_VERIFIED)

      await page.goto(PROJECT_PAGE)
      await expect(verifyEmailHeading(page)).toBeVisible()

      // Auth0 refuses the silent login, as it does once its session is gone.
      auth0.session = false
      await page
        .getByRole('button', { name: 'I have verified, check again' })
        .click()

      await expect(page).toHaveURL('/login?returnTo=%2F')
      // Only the first answer is the button's. The /login page it lands on runs
      // a silent login of its own, which is refused too.
      expect(auth0.silentAnswers[0]).toBe('login_required')
      expect(auth0.logoutRequests).toHaveLength(1)
    })
  })
})
