import { AnalyticsEvents } from './events'
import { setAnalyticsContext, trackEvent } from './capture'

/**
 * Per-session counters (sections 2 and 10).
 *
 * A "session" here is one foreground period: from the app becoming active to
 * it going to the background. That matches how a field worker actually works
 * (open the app at a site, record, put the phone away) better than a fixed
 * inactivity window would.
 *
 * These live in memory only. A session that ends with the process being
 * killed loses its summary, which is the right trade: persisting counters
 * would mean a write on every tree recorded, all day, on a low-end phone.
 */

export type SessionCounter =
  | 'trees_created'
  | 'trees_edited'
  | 'interventions_created'
  | 'plots_created'
  | 'mapping_started'
  | 'mapping_completed'
  | 'forms_started'
  | 'forms_completed'
  | 'forms_abandoned'
  | 'screens_viewed'
  | 'syncs_started'
  | 'syncs_completed'
  | 'trees_synced'
  | 'api_failures'
  | 'friction_events'
  | 'searches'

const emptyCounters = (): Record<SessionCounter, number> => ({
  trees_created: 0,
  trees_edited: 0,
  interventions_created: 0,
  plots_created: 0,
  mapping_started: 0,
  mapping_completed: 0,
  forms_started: 0,
  forms_completed: 0,
  forms_abandoned: 0,
  screens_viewed: 0,
  syncs_started: 0,
  syncs_completed: 0,
  trees_synced: 0,
  api_failures: 0,
  friction_events: 0,
  searches: 0,
})

let counters = emptyCounters()
let sessionStartedAt = Date.now()
/** True if the device lost connectivity at any point during the session. */
let sawOffline = false

export const incrementSessionCounter = (
  counter: SessionCounter,
  by = 1,
): void => {
  counters[counter] += by
  if (counter === 'trees_created') {
    // Surfaced on every later event in the session so a drop-off can be read
    // against how much work the user had already done when it happened.
    setAnalyticsContext({ session_trees_created: counters.trees_created })
  }
}

export const markSessionWentOffline = (): void => {
  sawOffline = true
}

export const startAnalyticsSession = (): void => {
  counters = emptyCounters()
  sessionStartedAt = Date.now()
  sawOffline = false
  setAnalyticsContext({ session_trees_created: 0 })
}

/**
 * Emitted when the app goes to the background. One row per session, which is
 * what "trees created per session", "active mapping sessions" and "session
 * completion rate" are all computed from.
 *
 * `completed_core_task` is the app's own definition of a session that went
 * somewhere: the user recorded or monitored something rather than opening the
 * app and leaving. It is stated here rather than left to the dashboard so
 * everyone reads the same number.
 */
export const endAnalyticsSession = (lastScreen: string | null): void => {
  const durationMs = Date.now() - sessionStartedAt
  const completedCoreTask =
    counters.trees_created > 0 ||
    counters.interventions_created > 0 ||
    counters.plots_created > 0 ||
    counters.trees_edited > 0

  trackEvent(AnalyticsEvents.APP_SESSION_SUMMARY, {
    ...counters,
    duration_ms: durationMs,
    last_screen: lastScreen,
    went_offline: sawOffline,
    completed_core_task: completedCoreTask,
    was_mapping_session: counters.mapping_started > 0,
  })
}

export const getSessionCounters = (): Readonly<Record<SessionCounter, number>> =>
  counters
