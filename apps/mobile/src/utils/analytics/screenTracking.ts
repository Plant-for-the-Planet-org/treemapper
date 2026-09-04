import { AnalyticsEvents } from './events'
import { captureScreenView, setAnalyticsContext, trackEvent } from './capture'
import { incrementSessionCounter } from './sessionMetrics'
import { notifyFrictionScreenChanged } from './friction'

/**
 * Screen analytics (section 4) and navigation behaviour (section 6).
 *
 * PostHog's captureScreens autocapture is switched off in App.tsx on purpose:
 * it only supports @react-navigation/native v6 and below, and this app runs
 * v7. Driving it by hand from NavigationContainer.onStateChange costs a few
 * lines and gives three things autocapture never would: how long the user
 * stayed, where they went next, and whether they got there by going back.
 *
 * What each metric in the brief comes from:
 * - most / least visited screens  -> count of `$screen`
 * - average time per screen       -> avg of `screen_left.duration_ms`
 * - screen exit rate              -> share of `screen_left` with exit_reason
 *                                    "app_backgrounded"
 * - screen revisit rate           -> share of `$screen` with is_revisit true
 * - common and unexpected paths   -> `$screen.previous_screen`
 */

let currentScreen: string | null = null
let currentScreenEnteredAt = 0
let previousStackDepth = 0

/** Visits per screen for this app session, for the revisit signal. */
let visitCounts: Record<string, number> = {}

/**
 * Set while the app is in the background so the screen the user came back to
 * is not counted as a fresh visit. Without this, every app switch would look
 * like a revisit and inflate the revisit rate.
 */
let resumedScreen: string | null = null

type ExitReason = 'navigated' | 'app_backgrounded'

/**
 * When the Android hardware back button was last pressed. A back that lands
 * within the window below is attributed to the hardware button rather than an
 * in-app back arrow, which is the distinction "back button usage" is asking
 * about. iOS has no hardware back, so this stays 0 there.
 */
let hardwareBackPressedAt = 0
const HARDWARE_BACK_WINDOW_MS = 1000

export const notifyHardwareBackPressed = (): void => {
  hardwareBackPressedAt = Date.now()
}

const closeCurrentScreen = (
  nextScreen: string | null,
  exitReason: ExitReason,
  isBack: boolean,
): void => {
  if (!currentScreen) {
    return
  }
  trackEvent(AnalyticsEvents.SCREEN_LEFT, {
    screen_name: currentScreen,
    next_screen: nextScreen,
    duration_ms: Date.now() - currentScreenEnteredAt,
    is_back: isBack,
    exit_reason: exitReason,
  })
}

/**
 * Call on every navigation state change with the resolved route name and how
 * deep the stack is. Depth is what tells a back press apart from a push: it
 * shrinks when the user goes back, whatever route they land on.
 */
export const trackScreenChange = (
  screenName: string,
  stackDepth: number,
): void => {
  if (!screenName || screenName === currentScreen) {
    previousStackDepth = stackDepth
    return
  }

  const isBack = stackDepth < previousStackDepth
  closeCurrentScreen(screenName, 'navigated', isBack)

  const visitNumber = (visitCounts[screenName] ?? 0) + 1
  visitCounts[screenName] = visitNumber
  incrementSessionCounter('screens_viewed')

  const previousScreen = currentScreen
  currentScreen = screenName
  currentScreenEnteredAt = Date.now()
  previousStackDepth = stackDepth

  // Every other event now carries the screen it happened on, which is what
  // makes "where do people give up" answerable without instrumenting each
  // screen separately.
  setAnalyticsContext({ current_screen: screenName })
  notifyFrictionScreenChanged(screenName)

  captureScreenView(screenName, {
    previous_screen: previousScreen,
    visit_number: visitNumber,
    is_revisit: visitNumber > 1,
    navigation_direction: isBack ? 'back' : 'forward',
    stack_depth: stackDepth,
  })

  if (isBack) {
    const byHardware =
      Date.now() - hardwareBackPressedAt <= HARDWARE_BACK_WINDOW_MS
    hardwareBackPressedAt = 0
    trackEvent(AnalyticsEvents.BACK_PRESSED, {
      from_screen: previousScreen,
      to_screen: screenName,
      source: byHardware ? 'hardware_button' : 'in_app',
    })
  }
}

/**
 * The screen the user was on when the app went away. Closing it here is what
 * makes exit rate real: without it the last screen of every session simply
 * has no duration and drops out of the average.
 */
export const handleScreenTrackingBackgrounded = (): void => {
  closeCurrentScreen(null, 'app_backgrounded', false)
  resumedScreen = currentScreen
  currentScreen = null
}

export const handleScreenTrackingForegrounded = (): void => {
  if (!resumedScreen) {
    return
  }
  currentScreen = resumedScreen
  currentScreenEnteredAt = Date.now()
  resumedScreen = null
}

/** New app session: visit counts describe one session, so they start over. */
export const resetScreenVisitCounts = (): void => {
  visitCounts = {}
}

export const getCurrentScreen = (): string | null => currentScreen

export const getCurrentScreenEnteredAt = (): number => currentScreenEnteredAt

export const getScreenVisitCount = (screenName: string): number =>
  visitCounts[screenName] ?? 0

/**
 * Pulls the deepest active route out of a React Navigation state tree. The
 * tab navigator nests inside the root stack, so the top-level route is "Home"
 * for most of the app and is useless on its own.
 */
export const resolveActiveRoute = (
  state: unknown,
): { name: string; depth: number } | null => {
  let node: any = state
  let depth = 0
  let name: string | null = null

  while (node?.routes?.length) {
    const route = node.routes[node.index ?? node.routes.length - 1]
    if (!route) {
      break
    }
    depth += node.routes.length
    name = route.name
    node = route.state
  }

  return name ? { name, depth } : null
}
