import type PostHog from 'posthog-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getAnalyticsClient } from './client'
import { AnalyticsEvent, AnalyticsEvents, AnalyticsTerm } from './events'

export type AnalyticsProperties = Record<string, unknown>

/**
 * What PostHog will actually accept as event properties.
 *
 * Derived from the client's own signature rather than imported: the type
 * itself lives in @posthog/core, which is a transitive package here, and this
 * repo pins dependencies deliberately. Reading it off `capture` keeps us
 * correct if the SDK tightens the shape.
 */
type PostHogEventProperties = NonNullable<Parameters<PostHog['capture']>[1]>

/**
 * Call sites pass plain objects with optional fields, so half the properties
 * in this app are legitimately `undefined` ("no site selected", "no tag").
 * PostHog only accepts JSON values, so those keys are dropped here rather
 * than at ~80 call sites.
 *
 * Dropping beats sending null: an absent property and a null one mean
 * different things in a PostHog breakdown, and "the user had no site" is
 * absence, not a value.
 */
const toEventProperties = (
  properties?: AnalyticsProperties,
): PostHogEventProperties => {
  const clean: Record<string, unknown> = {}
  if (!properties) {
    return clean as PostHogEventProperties
  }
  Object.keys(properties).forEach((key) => {
    const value = properties[key]
    if (value === undefined) {
      return
    }
    // Functions and symbols cannot be serialised. Silently skipping them
    // keeps a careless call site from failing the whole event.
    const kind = typeof value
    if (kind === 'function' || kind === 'symbol' || kind === 'bigint') {
      return
    }
    clean[key] = value
  })
  return clean as PostHogEventProperties
}

/**
 * Properties merged into every event but deliberately NOT persisted.
 *
 * PostHog's own register() writes super properties to disk, which is right
 * for things that outlive a launch (app version, user type) and wrong for
 * things that describe this moment (which screen, online or offline). Those
 * live here and are re-set on each app start.
 */
let ambientContext: AnalyticsProperties = {}

/**
 * When the last non-friction event was captured. The dead-click detector uses
 * it to answer "did that tap actually do anything", so friction events are
 * excluded or every dead click would mark itself as activity.
 */
let lastActivityAt = Date.now()

const FRICTION_EVENTS: ReadonlySet<string> = new Set<string>([
  AnalyticsEvents.RAGE_CLICK,
  AnalyticsEvents.REPEATED_TAP,
  AnalyticsEvents.DEAD_CLICK,
  AnalyticsEvents.SLOW_FIRST_ACTION,
  AnalyticsEvents.DEEP_SCROLL,
])

/**
 * The one place an event leaves the app. Everything else in this module is a
 * named wrapper around it, so the try/catch and the ambient merge are
 * guaranteed rather than remembered at each call site.
 */
const emit = (
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
  instance?: PostHog,
): void => {
  try {
    const posthog = instance ?? getAnalyticsClient()
    if (!posthog) {
      return
    }
    if (!FRICTION_EVENTS.has(event)) {
      lastActivityAt = Date.now()
    }
    posthog.capture(event, toEventProperties({ ...ambientContext, ...properties }))
  } catch {
    // Analytics must never change app behaviour.
  }
}

/**
 * Safe PostHog event capture.
 *
 * Kept as the primary call signature because the screens instrumented first
 * pass their usePostHog() instance in. New non-React code should reach for
 * trackEvent instead, which resolves the shared client itself.
 */
export function captureAnalyticsEvent(
  posthog: PostHog | undefined,
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
): void {
  emit(event, properties, posthog)
}

/** Capture from anywhere, including outside the React tree. */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
): void {
  emit(event, properties)
}

/**
 * Fires once per install, ever. Used for the "first tree created" style
 * milestones in section 10, where a second event would be worse than none
 * because it quietly inflates the activation count.
 *
 * The flag is written before the event so a crash mid-capture cannot produce
 * a duplicate on the next launch.
 */
export async function trackFirstTimeEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
): Promise<void> {
  const key = `analytics-milestone-${event}`
  try {
    const already = await AsyncStorage.getItem(key)
    if (already) {
      return
    }
    await AsyncStorage.setItem(key, String(Date.now()))
    emit(event, properties)
  } catch {
    // A milestone we cannot dedupe is one we do not send.
  }
}

/**
 * Attaches the events on this device to a person, which is what makes
 * section 1 (segmentation) and the retention questions in section 10
 * answerable at all.
 *
 * No PII by design: no email, no name, no slug. Everything here is a segment
 * a PM would group by, so PostHog holds cohorts rather than a user directory.
 */
export function identifyAnalyticsUser(profile: {
  id: string
  country?: string
  type?: string
  locale?: string | null
  isPrivate?: boolean
  showPlotFeature?: boolean
  created?: string
}): void {
  try {
    const posthog = getAnalyticsClient()
    if (!posthog || !profile.id) {
      return
    }
    posthog.identify(
      profile.id,
      toEventProperties({
        country: profile.country || undefined,
        // The server calls this "type" (tpo, individual, education...). It is
        // the closest thing the mobile profile has to a role. Admin / Project
        // Manager / Field Worker / Volunteer are not on the device yet, so
        // role-level segmentation needs the profile endpoint to send them.
        user_type: profile.type || undefined,
        locale: profile.locale || undefined,
        is_private_account: profile.isPrivate ?? undefined,
        has_plot_feature: profile.showPlotFeature ?? undefined,
        account_created_at: profile.created || undefined,
        $set_once: {
          first_identified_at: new Date().toISOString(),
        },
      }),
    )
  } catch {
    // ignore
  }
}

/**
 * Cuts the link between this device and the person who just signed out, so
 * the next user's events do not land on the previous user's profile.
 */
export function resetAnalyticsUser(): void {
  try {
    getAnalyticsClient()?.reset()
  } catch {
    // ignore
  }
}

/**
 * Persisted properties added to every event from now on. Use for facts that
 * survive a restart: app version, platform, language.
 */
export function registerAnalyticsSuperProperties(
  properties: AnalyticsProperties,
): void {
  try {
    getAnalyticsClient()
      ?.register(toEventProperties(properties))
      .catch(() => undefined)
  } catch {
    // ignore
  }
}

/** Merge into the non-persisted per-event context. */
export function setAnalyticsContext(properties: AnalyticsProperties): void {
  ambientContext = { ...ambientContext, ...properties }
}

export function getAnalyticsContext(): AnalyticsProperties {
  return ambientContext
}

/**
 * PostHog's built-in screen event. Sent by hand rather than by autocapture:
 * the SDK's captureScreens only works with @react-navigation/native v6 and
 * below, and this app is on v7.
 */
export function captureScreenView(
  name: string,
  properties?: AnalyticsProperties,
): void {
  try {
    getAnalyticsClient()
      ?.screen(name, toEventProperties({ ...ambientContext, ...properties }))
      .catch(() => undefined)
  } catch {
    // ignore
  }
}

/**
 * Terminology research (section 9). A thin wrapper so every term signal is
 * guaranteed to carry the term, which is the only property the analysis
 * actually groups by.
 */
export function trackTermEvent(
  event: AnalyticsEvent,
  term: AnalyticsTerm,
  properties?: AnalyticsProperties,
): void {
  emit(event, { term, ...properties })
}

export function getLastActivityAt(): number {
  return lastActivityAt
}
