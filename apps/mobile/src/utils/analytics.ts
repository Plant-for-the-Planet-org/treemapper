import PostHog from 'posthog-react-native'

export const AnalyticsEvents = {
  USER_SIGNUP: 'user_signed_up',
  USER_ACTIVATED: 'user_activated',
  PROJECT_CREATED: 'project_created',
  INTERVENTION_CREATED: 'intervention_created',
  TREE_RECORDED: 'tree_recorded',
  MONITORING_PLOT_CREATED: 'monitoring_plot_created',
  TREE_MONITORED: 'tree_monitored',
} as const

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]

/**
 * Safe PostHog event capture — never throws or crashes the app.
 */
export function captureAnalyticsEvent(
  posthog: PostHog | undefined,
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): void {
  try {
    posthog?.capture(event, properties)
  } catch {
    // Silently fail — analytics must never affect app behaviour
  }
}
