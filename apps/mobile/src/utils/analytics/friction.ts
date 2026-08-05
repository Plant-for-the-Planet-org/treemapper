import { AnalyticsEvents } from './events'
import { getLastActivityAt, trackEvent } from './capture'
import { incrementSessionCounter } from './sessionMetrics'

/**
 * UX friction (section 7).
 *
 * Fed by a capture-phase touch listener on a View that wraps the whole app
 * (see AnalyticsProvider). Capture phase means it sees every touch regardless
 * of which component wins the responder, and because it only reads
 * coordinates it never interferes with gestures, the map, or scrolling.
 *
 * Definitions, stated here so the dashboard and the code agree:
 * - repeated_tap : 3+ taps in the same small area within 2s. Usually "did
 *                  that register?".
 * - rage_click   : 5+ taps in the same small area within 2s. The user is
 *                  hitting something that is not responding.
 * - dead_click   : a tap that produced no navigation and no tracked action
 *                  within 1.5s. A best-effort signal, not proof: taps that
 *                  only change local component state look identical to us.
 * - slow_first_action : the user sat on a screen for 8s before touching
 *                  anything. Reads as "I do not know what to do here".
 */

/** Movement above this is a drag or a scroll, not a tap. */
const DRAG_THRESHOLD_PX = 12
/** Two taps further apart than this are aimed at different things. */
const SAME_TARGET_RADIUS_PX = 44
const TAP_BURST_WINDOW_MS = 2000
const REPEATED_TAP_COUNT = 3
const RAGE_CLICK_COUNT = 5
const DEAD_CLICK_GRACE_MS = 1500
const SLOW_FIRST_ACTION_MS = 8000
/** Keeps one confusing screen from flooding the day's events. */
const MAX_DEAD_CLICKS_PER_SCREEN = 3

/**
 * Screens where the main gesture is panning, pinching or dragging a marker.
 * A tap here legitimately does nothing measurable, so dead-click detection is
 * off or it would report the map as broken all day.
 */
const DEAD_CLICK_EXEMPT_SCREENS: ReadonlySet<string> = new Set([
  'Map',
  'PolygonMarker',
  'PointMarker',
  'CreatePlotMap',
  'EditPolygon',
  'OfflineMapSelection',
  'OfflineMap',
  'PreviewPolygon',
  'PlannedTreeLocation',
  'TakePicture',
])

type Tap = { x: number; y: number; at: number }

let touchStart: Tap | null = null
let recentTaps: Tap[] = []
let reportedRepeatedTap = false
let reportedRageClick = false

let currentScreen: string | null = null
let screenEnteredAt = Date.now()
let firstActionReported = false
let deadClicksThisScreen = 0

const isSameTarget = (a: Tap, b: Tap): boolean =>
  Math.abs(a.x - b.x) <= SAME_TARGET_RADIUS_PX &&
  Math.abs(a.y - b.y) <= SAME_TARGET_RADIUS_PX

const reportFriction = (
  event: typeof AnalyticsEvents.RAGE_CLICK
    | typeof AnalyticsEvents.REPEATED_TAP
    | typeof AnalyticsEvents.DEAD_CLICK
    | typeof AnalyticsEvents.SLOW_FIRST_ACTION,
  properties: Record<string, unknown>,
): void => {
  incrementSessionCounter('friction_events')
  trackEvent(event, { screen: currentScreen, ...properties })
}

export const recordTouchStart = (x: number, y: number): void => {
  touchStart = { x, y, at: Date.now() }
}

export const recordTouchEnd = (x: number, y: number): void => {
  const start = touchStart
  touchStart = null
  if (!start) {
    return
  }

  // Drags, swipes, map pans and list scrolls all end here too. Dropping them
  // is what keeps the tap counts meaningful.
  if (
    Math.abs(x - start.x) > DRAG_THRESHOLD_PX ||
    Math.abs(y - start.y) > DRAG_THRESHOLD_PX
  ) {
    return
  }

  const now = Date.now()
  const tap: Tap = { x, y, at: now }

  if (!firstActionReported) {
    firstActionReported = true
    const delay = now - screenEnteredAt
    if (delay > SLOW_FIRST_ACTION_MS) {
      reportFriction(AnalyticsEvents.SLOW_FIRST_ACTION, { delay_ms: delay })
    }
  }

  // Only taps in the same place and inside the window count as one burst.
  const burst = recentTaps.filter(
    (previous) =>
      now - previous.at <= TAP_BURST_WINDOW_MS && isSameTarget(previous, tap),
  )
  if (burst.length === 0) {
    reportedRepeatedTap = false
    reportedRageClick = false
  }
  burst.push(tap)
  recentTaps = burst

  if (burst.length >= RAGE_CLICK_COUNT && !reportedRageClick) {
    reportedRageClick = true
    reportFriction(AnalyticsEvents.RAGE_CLICK, {
      tap_count: burst.length,
      burst_duration_ms: now - burst[0].at,
    })
  } else if (burst.length >= REPEATED_TAP_COUNT && !reportedRepeatedTap) {
    reportedRepeatedTap = true
    reportFriction(AnalyticsEvents.REPEATED_TAP, {
      tap_count: burst.length,
      burst_duration_ms: now - burst[0].at,
    })
  }

  scheduleDeadClickCheck(tap)
}

const scheduleDeadClickCheck = (tap: Tap): void => {
  if (
    !currentScreen ||
    DEAD_CLICK_EXEMPT_SCREENS.has(currentScreen) ||
    deadClicksThisScreen >= MAX_DEAD_CLICKS_PER_SCREEN
  ) {
    return
  }
  const screenAtTap = currentScreen
  const activityAtTap = getLastActivityAt()

  setTimeout(() => {
    // A screen change or any tracked action in the grace period means the tap
    // did something. Only silence on both counts is treated as dead.
    if (currentScreen !== screenAtTap || getLastActivityAt() !== activityAtTap) {
      return
    }
    if (deadClicksThisScreen >= MAX_DEAD_CLICKS_PER_SCREEN) {
      return
    }
    deadClicksThisScreen += 1
    reportFriction(AnalyticsEvents.DEAD_CLICK, {
      touch_x: Math.round(tap.x),
      touch_y: Math.round(tap.y),
    })
  }, DEAD_CLICK_GRACE_MS)
}

/**
 * Called by the screen tracker on every navigation. Friction is measured per
 * screen visit, so the hesitation timer and the dead-click budget restart.
 *
 * Deliberately a push from screenTracking rather than a read of it: friction
 * knowing about screen tracking, and screen tracking knowing about friction,
 * would be a cycle.
 */
export const notifyFrictionScreenChanged = (screenName: string): void => {
  currentScreen = screenName
  screenEnteredAt = Date.now()
  firstActionReported = false
  deadClicksThisScreen = 0
  recentTaps = []
  reportedRageClick = false
  reportedRepeatedTap = false
}

/**
 * Scroll depth. Fires once per screen visit when the user passes the
 * threshold, so a long list reads as "people do reach the bottom" rather
 * than as thousands of scroll events.
 */
const DEEP_SCROLL_RATIO = 0.75
const deepScrollReported = new Set<string>()

export const recordScrollDepth = (
  listName: string,
  offset: number,
  contentLength: number,
  viewportLength: number,
): void => {
  const scrollable = contentLength - viewportLength
  if (scrollable <= 0 || deepScrollReported.has(listName)) {
    return
  }
  const ratio = offset / scrollable
  if (ratio < DEEP_SCROLL_RATIO) {
    return
  }
  deepScrollReported.add(listName)
  trackEvent(AnalyticsEvents.DEEP_SCROLL, {
    list_name: listName,
    screen: currentScreen,
    depth_ratio: Math.round(ratio * 100) / 100,
  })
}

export const resetScrollDepth = (listName: string): void => {
  deepScrollReported.delete(listName)
}
