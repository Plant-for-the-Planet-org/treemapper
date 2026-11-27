import { expect, type Page } from '@playwright/test'

// These helpers require the fake clock to be installed first:
// await page.clock.install()

/** Time window long enough for the currently configured retries to fire. */
export const RETRY_WAIT_WINDOW_MS = 20_000

/**
 * Moves the fake clock forward in 1-second steps until the expected
 * number of API calls happens.
 *
 * This verifies that the expected call happens without any extra
 * calls happening along the way.
 *
 * Note: This does not verify the exact retry delay.
 * Test retry timing separately.
 *
 * We use small steps because the retry timer is created only after
 * the application handles the failed API response.
 */
export async function advanceClockUntilCallCount(
  page: Page,
  getCallCount: () => number,
  expectedCallCount: number,
) {
  await expect
    .poll(
      async () => {
        await page.clock.fastForward(1_000)
        return getCallCount()
      },
      { intervals: [50], timeout: 20_000 },
    )
    .toBe(expectedCallCount)
}

/**
 * Tracks how many times the page starts a timeout with the specified delay.
 *
 * Call this before page.goto() so we don't miss timers started during
 * application initialization.
 *
 * Returns a function that reads the current count. Tests can use it to wait
 * until the application has actually started a timer instead of relying on
 * an arbitrary fixed wait.
 *
 * Also handles Playwright's fake clock replacing window.setTimeout, so
 * timeout counting continues to work with the fake clock.
 */
export async function countTimeoutsWithDelay(
  page: Page,
  delayMs: number,
): Promise<() => Promise<number>> {
  await page.addInitScript(delay => {
    const target = window as Window & { __e2eTimeoutCount?: number }
    let started = 0
    target.__e2eTimeoutCount = started
    let current = window.setTimeout
    const counting = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) => {
      if (timeout === delay) target.__e2eTimeoutCount = ++started
      return current.call(window, handler, timeout, ...args)
    }) as typeof window.setTimeout
    Object.defineProperty(window, 'setTimeout', {
      configurable: true,
      get: () => counting,
      // Ignore our own wrapper: if the clock saved it as the original and
      // puts it back on uninstall, `current` would call itself forever.
      set: (next: typeof window.setTimeout) => {
        if (next !== counting) current = next
      },
    })
  }, delayMs)

  return () =>
    page.evaluate(
      () =>
        (window as Window & { __e2eTimeoutCount?: number }).__e2eTimeoutCount ??
        0,
    )
}

/**
 * Moves the fake clock forward to allow pending retries to happen,
 * then checks that the API call count has not increased.
 *
 * We wait 500ms in real time because React and the application
 * need time to process any timers that fired during the clock jump.
 */
export async function expectNoAdditionalCalls(
  page: Page,
  getCallCount: () => number,
  expectedCallCount: number,
  advanceByMs = RETRY_WAIT_WINDOW_MS,
) {
  await page.clock.fastForward(advanceByMs)
  await page.waitForTimeout(500)
  expect(getCallCount()).toBe(expectedCallCount)
}
