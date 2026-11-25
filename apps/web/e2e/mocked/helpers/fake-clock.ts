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
