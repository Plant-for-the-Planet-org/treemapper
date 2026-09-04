/**
 * The event catalog. Section numbers match the product analytics brief so a
 * PM can map a dashboard tile straight back to an event name.
 *
 * Rules for adding an event:
 * - snake_case, past tense, named after what the user did, not the screen.
 * - Never rename an existing value. PostHog keys on the string, so a rename
 *   splits the funnel and the old data becomes unreachable.
 * - Put the "what kind" detail in a property, not in the event name. One
 *   `species_added` with a `source` property beats three near-identical events.
 */
export const AnalyticsEvents = {
  /* ---------------------------------------------------------------
   * 1. User profile and segmentation
   *
   * Most of this section is answered by person properties and super
   * properties (see identifyAnalyticsUser / registerAnalyticsSuperProperties
   * in capture.ts), not by events. DAU / WAU / MAU come from PostHog's own
   * "Application Opened" lifecycle event, which the SDK sends for us.
   * ------------------------------------------------------------ */
  USER_ACTIVATED: 'user_activated',
  NETWORK_STATE_CHANGED: 'network_state_changed',

  /* ---------------------------------------------------------------
   * 2. User journey
   * ------------------------------------------------------------ */
  LOGIN_STARTED: 'login_started',
  LOGIN_SUCCEEDED: 'login_succeeded',
  LOGIN_FAILED: 'login_failed',
  PROFILE_FETCH_FAILED: 'profile_fetch_failed',
  LOGGED_OUT: 'logged_out',
  PROJECT_OPENED: 'project_opened',
  SITE_OPENED: 'site_opened',
  PROJECT_CREATED: 'project_created',
  MAPPING_STARTED: 'mapping_started',
  MAPPING_COMPLETED: 'mapping_completed',
  MAPPING_ABANDONED: 'mapping_abandoned',
  INTERVENTION_CREATED: 'intervention_created',
  TREE_RECORDED: 'tree_recorded',
  TREE_SAVED: 'tree_saved',
  TREE_EDITED: 'tree_edited',
  TREE_DELETED: 'tree_deleted',
  SYNC_STARTED: 'sync_started',
  SYNC_COMPLETED: 'sync_completed',
  SYNC_FAILED: 'sync_failed',
  SYNC_BLOCKED: 'sync_blocked',
  SYNC_ITEM_FAILED: 'sync_item_failed',

  /* ---------------------------------------------------------------
   * 3. Feature adoption
   * ------------------------------------------------------------ */
  SPECIES_SEARCHED: 'species_searched',
  SPECIES_ADDED: 'species_added',
  SPECIES_REMOVED: 'species_removed',
  SPECIES_LIST_SYNCED: 'species_list_synced',
  MONITORING_PLOT_CREATED: 'monitoring_plot_created',
  TREE_MONITORED: 'tree_monitored',
  OFFLINE_MAP_DOWNLOAD_STARTED: 'offline_map_download_started',
  OFFLINE_MAP_DOWNLOADED: 'offline_map_downloaded',
  OFFLINE_MAP_DOWNLOAD_FAILED: 'offline_map_download_failed',
  OFFLINE_MAP_DELETED: 'offline_map_deleted',
  CUSTOM_FORM_CREATED: 'custom_form_created',
  CUSTOM_FORM_IMPORTED: 'custom_form_imported',
  CUSTOM_FORM_FIELD_ADDED: 'custom_form_field_added',
  CUSTOM_FORM_DELETED: 'custom_form_deleted',
  CUSTOM_FORM_OPENED: 'custom_form_opened',
  NOTE_ADDED: 'note_added',
  PHOTO_CAPTURED: 'photo_captured',
  PHOTO_RETAKEN: 'photo_retaken',
  DATA_EXPORTED: 'data_exported',

  /* ---------------------------------------------------------------
   * 4. Screen analytics
   *
   * Screen entry is sent as PostHog's built-in `$screen` (see
   * captureScreenView). `screen_left` carries the dwell time and where the
   * user went next, which is what "average time per screen", "exit rate"
   * and "revisit rate" are computed from.
   * ------------------------------------------------------------ */
  SCREEN_LEFT: 'screen_left',

  /* ---------------------------------------------------------------
   * 5. Form analytics
   * ------------------------------------------------------------ */
  FORM_STARTED: 'form_started',
  FORM_COMPLETED: 'form_completed',
  FORM_ABANDONED: 'form_abandoned',
  FORM_VALIDATION_FAILED: 'form_validation_failed',
  FORM_FIELD_SKIPPED: 'form_field_skipped',

  /* ---------------------------------------------------------------
   * 6. Navigation behaviour
   * ------------------------------------------------------------ */
  BACK_PRESSED: 'back_pressed',
  SEARCH_USED: 'search_used',
  MENU_OPENED: 'menu_opened',
  MENU_ITEM_CLICKED: 'menu_item_clicked',

  /* ---------------------------------------------------------------
   * 7. UX friction
   *
   * Session recordings are a separate PostHog product, switched on with
   * EXPO_PUBLIC_POSTHOG_SESSION_REPLAY (see client.ts). The events below
   * work whether or not replay is on.
   * ------------------------------------------------------------ */
  RAGE_CLICK: 'rage_click',
  REPEATED_TAP: 'repeated_tap',
  DEAD_CLICK: 'dead_click',
  SLOW_FIRST_ACTION: 'slow_first_action',
  DEEP_SCROLL: 'deep_scroll',

  /* ---------------------------------------------------------------
   * 8. Performance
   *
   * App crashes stay in Bugsnag, which has the stack traces. `app_crashed`
   * exists so a crash still shows up inside a PostHog funnel; it is sent on
   * the next app open, not at crash time.
   * ------------------------------------------------------------ */
  APP_CRASHED: 'app_crashed',
  API_REQUEST_FAILED: 'api_request_failed',
  SCREEN_LOAD_SLOW: 'screen_load_slow',
  GPS_PERMISSION_DENIED: 'gps_permission_denied',
  GPS_FIX_FAILED: 'gps_fix_failed',
  GPS_ACCURACY_POOR: 'gps_accuracy_poor',

  /* ---------------------------------------------------------------
   * 9. Terminology research
   *
   * Every event here carries a `term` property from AnalyticsTerms. The
   * question being answered is "do field workers understand the word we
   * chose", so the signal is hesitation and avoidance, not success.
   * ------------------------------------------------------------ */
  TERM_HELP_OPENED: 'term_help_opened',
  TERM_TOOLTIP_OPENED: 'term_tooltip_opened',
  TERM_FIELD_SKIPPED: 'term_field_skipped',
  TERM_FIELD_RE_EDITED: 'term_field_re_edited',
  TERM_FIELD_DWELL: 'term_field_dwell',
  TERM_FORM_ABANDONED_AT_FIELD: 'term_form_abandoned_at_field',

  /* ---------------------------------------------------------------
   * 10. Success metrics
   *
   * "Returning users after 7/30 days" and "repeat usage" are retention
   * questions PostHog answers from any event plus a person id, so they need
   * no event of their own. What it cannot derive is the first-time
   * milestone and the per-session totals, so those are sent explicitly.
   * ------------------------------------------------------------ */
  FIRST_TREE_CREATED: 'first_tree_created',
  FIRST_INTERVENTION_CREATED: 'first_intervention_created',
  FIRST_SYNC_COMPLETED: 'first_sync_completed',
  APP_SESSION_SUMMARY: 'app_session_summary',
} as const

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]

/**
 * The words we are unsure about. Section 9 of the brief asks whether field
 * workers understand these, so every term event tags one of them and the
 * research is a single breakdown rather than a hunt through event names.
 *
 * Keep the values stable: they become the x-axis of that breakdown.
 */
export const AnalyticsTerms = {
  ESI: 'esi',
  INTERVENTION: 'intervention',
  MONITORING_PLOT: 'monitoring_plot',
  SPECIES: 'species',
  SITE: 'site',
  PROJECT: 'project',
  REMEASUREMENT: 'remeasurement',
  SAMPLE_TREE: 'sample_tree',
} as const

export type AnalyticsTerm = (typeof AnalyticsTerms)[keyof typeof AnalyticsTerms]

/**
 * Form field keys that carry one of the terms above. The form analytics hook
 * reads this to decide whether a skipped or re-edited field is also a
 * terminology signal, so instrumenting a form gives section 9 for free.
 */
export const FIELD_TERMS: Record<string, AnalyticsTerm> = {
  intervention_type: AnalyticsTerms.INTERVENTION,
  intervention_key: AnalyticsTerms.INTERVENTION,
  intervention_date: AnalyticsTerms.INTERVENTION,
  species: AnalyticsTerms.SPECIES,
  species_name: AnalyticsTerms.SPECIES,
  tree_count: AnalyticsTerms.SPECIES,
  site: AnalyticsTerms.SITE,
  site_id: AnalyticsTerms.SITE,
  project: AnalyticsTerms.PROJECT,
  project_id: AnalyticsTerms.PROJECT,
  plot_name: AnalyticsTerms.MONITORING_PLOT,
  plot_shape: AnalyticsTerms.MONITORING_PLOT,
  plot_type: AnalyticsTerms.MONITORING_PLOT,
  remeasurement_date: AnalyticsTerms.REMEASUREMENT,
  sample_tree_count: AnalyticsTerms.SAMPLE_TREE,
}
