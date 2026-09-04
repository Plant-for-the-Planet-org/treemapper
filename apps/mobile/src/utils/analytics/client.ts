import PostHog from 'posthog-react-native'

/**
 * One PostHog instance for the whole app.
 *
 * PostHogProvider would happily build its own from an apiKey, but then only
 * React components could reach it. Half of what we need to measure happens
 * outside the tree: API failures in customFetch, sync outcomes, GPS errors.
 * So the instance is created here and handed to the provider via its `client`
 * prop, and non-React code gets the same object through getAnalyticsClient().
 */

const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? ''
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST

/**
 * Session replay is off unless a build explicitly turns it on. It records the
 * screen, and field workers have tree photos, plot coordinates and project
 * names on screen, so this is a decision for a build config and not a default.
 * Even when on, text inputs and images are masked (see sessionReplayConfig).
 */
const SESSION_REPLAY_ENABLED =
  process.env.EXPO_PUBLIC_POSTHOG_SESSION_REPLAY === 'true'

let client: PostHog | undefined
let created = false

/**
 * Built on first use, not at import time, so a failure inside the SDK cannot
 * take down the module graph before the app has even rendered.
 *
 * Returns undefined only if construction threw. A missing API key still
 * returns a client: it is created disabled, so every capture call downstream
 * is a no-op instead of a null check at ~80 call sites.
 */
export const getAnalyticsClient = (): PostHog | undefined => {
  if (created) {
    return client
  }
  created = true
  try {
    client = new PostHog(API_KEY, {
      host: HOST,
      // No key means a build that was never meant to report (a fork, a local
      // release build). __DEV__ keeps developer noise out of the PM's funnels.
      disabled: __DEV__ || !API_KEY,
      // Gives us "Application Opened / Backgrounded / Installed / Updated"
      // for free. DAU / WAU / MAU and "new vs returning" are built on these.
      captureAppLifecycleEvents: true,
      // JS-level crashes arrive as PostHog's own `$exception`, so a crash can
      // sit inside a funnel next to the step it interrupted. Bugsnag stays
      // the place to read a stack trace; this is for "how often does the
      // recording flow die on us". Console capture is off: the app logs a
      // lot, and it would be noise with a bill attached.
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          console: false,
        },
      },
      enableSessionReplay: SESSION_REPLAY_ENABLED,
      sessionReplayConfig: {
        maskAllTextInputs: true,
        maskAllImages: true,
        // One snapshot a second is enough to follow a flow and is gentle on
        // the battery, which matters for a full day in the field.
        throttleDelayMs: 1000,
      },
    })
  } catch {
    // Analytics must never stop the app from starting.
    client = undefined
  }
  return client
}

export const isSessionReplayEnabled = (): boolean => SESSION_REPLAY_ENABLED
