import PostHog from 'posthog-react-native'

// ─── Event catalogue ────────────────────────────────────────────────────────
//
// Names are snake_case and immutable: PostHog keys on the string, so renaming
// one splits the funnel and orphans old data.  Add new ones; never rename.
//
// Organised by domain so it's easy to see what each brief section covers:
//   Auth       – login / logout / account lifecycle
//   Navigation – menu usage
//   Settings   – language, preferences
//   Species    – search and selection
//   Intervention – the core field-data capture flow
//   Mapping    – polygon / point capture
//   Photo      – camera
//   Forms      – dynamic forms import/export
//   Sync       – upload to server
//   Offline maps – map tile downloads

export const AnalyticsEvents = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  // Funnel: login_started → login_succeeded (or login_failed)
  // A partial funnel (started but no outcome) means Auth0 never returned.
  LOGIN_STARTED:          'login_started',
  LOGIN_SUCCEEDED:        'login_succeeded',
  LOGIN_FAILED:           'login_failed',
  // Auth0 succeeded but fetching the TreeMapper profile failed.
  // Counted separately because the fix is server-side, not user-side.
  PROFILE_FETCH_FAILED:   'profile_fetch_failed',
  LOGOUT:                 'logout',
  ACCOUNT_DELETED:        'account_deleted',
  // Fired by useAuthentication when a new user is written to Realm for the first time.
  USER_ACTIVATED:         'user_activated',

  // ── Navigation ────────────────────────────────────────────────────────────
  // Covers every tap on an enabled sidebar item.
  // Uses the stable `key` so the breakdown doesn't split by language.
  MENU_ITEM_CLICKED:      'menu_item_clicked',

  // ── Settings ──────────────────────────────────────────────────────────────
  LANGUAGE_CHANGED:       'language_changed',

  // ── Species ───────────────────────────────────────────────────────────────
  // Selecting a species to attach to an intervention vs managing favourites.
  SPECIES_SELECTED:       'species_selected',
  SPECIES_FAVORITED:      'species_favorited',
  SPECIES_UNFAVORITED:    'species_unfavorited',

  // ── Intervention ──────────────────────────────────────────────────────────
  // Full funnel: started → (map + species + form) → created
  INTERVENTION_STARTED:   'intervention_started',
  INTERVENTION_CREATED:   'intervention_created',

  // ── Tree / monitoring ─────────────────────────────────────────────────────
  TREE_RECORDED:          'tree_recorded',
  MONITORING_PLOT_CREATED: 'monitoring_plot_created',
  TREE_MONITORED:         'tree_monitored',
  PLOT_GROUP_CREATED:     'plot_group_created',

  // ── Project ───────────────────────────────────────────────────────────────
  PROJECT_CREATED:        'project_created',

  // ── Mapping ───────────────────────────────────────────────────────────────
  // polygon_point_added fires on every corner so we can compute drop-off
  // (how many points before the user abandons).
  MAP_POLYGON_POINT_ADDED: 'map_polygon_point_added',
  // polygon_completed fires when the ring is closed and saved.
  MAP_POLYGON_COMPLETED:  'map_polygon_completed',

  // ── Photo ─────────────────────────────────────────────────────────────────
  PHOTO_TAKEN:            'photo_taken',
  PHOTO_RETAKEN:          'photo_retaken',

  // ── Forms ─────────────────────────────────────────────────────────────────
  FORM_IMPORTED:          'form_imported',
  FORM_EXPORTED:          'form_exported',
  FORM_IMPORT_FAILED:     'form_import_failed',

  // ── Sync ──────────────────────────────────────────────────────────────────
  // sync_completed carries uploaded/failed/quarantined counts.
  // sync_failed is a hard stop (network down, server maintenance).
  SYNC_STARTED:           'sync_started',
  SYNC_COMPLETED:         'sync_completed',
  SYNC_FAILED:            'sync_failed',

  // ── Offline maps ──────────────────────────────────────────────────────────
  OFFLINE_MAP_DOWNLOADED: 'offline_map_downloaded',
  OFFLINE_MAP_DELETED:    'offline_map_deleted',

  // ── Privacy ───────────────────────────────────────────────────────────────
  // The answer to the "link analytics to my account" prompt. `source` is
  // first_launch or settings. Sent in both cases; a decline goes anonymously.
  ANALYTICS_CONSENT_UPDATED: 'analytics_consent_updated',

  // ── Rating ────────────────────────────────────────────────────────────────
  // The "Enjoying TreeMapper?" store-rating prompt. `action` is rate / feedback
  // / dismiss and `source` is prompt (automatic) or menu (manual entry).
  APP_RATING_PROMPT:      'app_rating_prompt',

  // ── Content ───────────────────────────────────────────────────────────────
  GUIDE_OPENED:           'guide_opened',
  NOTIFICATION_OPENED:    'notification_opened',
} as const

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]

/**
 * The one place an event leaves the app.
 *
 * Silently swallows all errors so analytics can never affect app behaviour.
 * Undefined property values are omitted rather than sent as null — absence
 * and null mean different things in a PostHog breakdown.
 */
export function captureAnalyticsEvent(
  posthog: PostHog | undefined,
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): void {
  try {
    if (!posthog) return
    if (!properties) {
      posthog.capture(event)
      return
    }
    // Strip undefined values: absent ≠ null in PostHog breakdowns.
    const clean: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(properties)) {
      if (v !== undefined) clean[k] = v
    }
    // PostHog's native SDK accepts plain objects; the type narrowing is overly
    // strict for our use-case, so we widen here once rather than at every call.
    posthog.capture(event, clean as Parameters<PostHog['capture']>[1])
  } catch {
    // Silently fail — analytics must never crash or block user flows.
  }
}
