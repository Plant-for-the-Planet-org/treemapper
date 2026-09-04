/**
 * Product analytics for the mobile app, built on PostHog.
 *
 * Import from 'src/utils/analytics' and nothing else. The split into files is
 * an implementation detail; this barrel is the contract.
 *
 * Where the numbers come from:
 * - who the user is        -> identifyAnalyticsUser + registerAnalyticsSuperProperties
 * - what they did          -> captureAnalyticsEvent / trackEvent with AnalyticsEvents
 * - which screen           -> screenTracking, driven from NavigationContainer
 * - how a form went        -> useFormAnalytics (src/hooks/analytics)
 * - where they struggled   -> friction, fed by AnalyticsProvider's touch listener
 * - per-session totals     -> sessionMetrics, flushed when the app backgrounds
 */

export { getAnalyticsClient, isSessionReplayEnabled } from './client'

export {
  AnalyticsEvents,
  AnalyticsTerms,
  FIELD_TERMS,
  type AnalyticsEvent,
  type AnalyticsTerm,
} from './events'

export {
  captureAnalyticsEvent,
  captureScreenView,
  getAnalyticsContext,
  getLastActivityAt,
  identifyAnalyticsUser,
  registerAnalyticsSuperProperties,
  resetAnalyticsUser,
  setAnalyticsContext,
  trackEvent,
  trackFirstTimeEvent,
  trackTermEvent,
  type AnalyticsProperties,
} from './capture'

export {
  getCurrentScreen,
  getCurrentScreenEnteredAt,
  getScreenVisitCount,
  handleScreenTrackingBackgrounded,
  handleScreenTrackingForegrounded,
  notifyHardwareBackPressed,
  resetScreenVisitCounts,
  resolveActiveRoute,
  trackScreenChange,
} from './screenTracking'

export {
  endAnalyticsSession,
  getSessionCounters,
  incrementSessionCounter,
  markSessionWentOffline,
  startAnalyticsSession,
  type SessionCounter,
} from './sessionMetrics'

export {
  notifyFrictionScreenChanged,
  recordScrollDepth,
  recordTouchEnd,
  recordTouchStart,
  resetScrollDepth,
} from './friction'
