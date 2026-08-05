# Mobile product analytics

PostHog instrumentation for the TreeMapper mobile app. Sections below map 1:1
to the product analytics brief so a dashboard tile can be traced back to the
event that feeds it.

Mobile only. The web dashboard reports separately.

## Setup

```
EXPO_PUBLIC_POSTHOG_API_KEY=...
EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
EXPO_PUBLIC_POSTHOG_SESSION_REPLAY=false   # optional, see "Session replay"
```

Analytics is disabled in `__DEV__` and whenever the API key is missing, so a
developer's taps never reach the PM's funnels.

## Using it

```ts
import { AnalyticsEvents, trackEvent } from 'src/utils/analytics'

trackEvent(AnalyticsEvents.TREE_SAVED, { tree_type: 'sample' })
```

Works inside and outside React. The client is a module singleton, so
`usePostHog()` is not needed. The older `captureAnalyticsEvent(posthog, ...)`
signature still works and is what the first six events use.

Hooks, for the things that need lifecycle:

| Hook | For |
| --- | --- |
| `useFormAnalytics(name, props?)` | form funnels, skipped fields, abandonment |
| `useMappingAnalytics(mode, props?)` | mapping sessions |
| `useScreenLoadTiming(screen, ms?)` | slow screen loads |
| `useSearchAnalytics(context)` | debounced search events |
| `useScrollDepthTracking(list)` | scroll depth |

### Adding an event

1. Add a `SCREEN_SNAKE_CASE` entry to `events.ts` under its brief section.
2. Never rename an existing value. PostHog keys on the string, so a rename
   splits the funnel and the old data becomes unreachable.
3. Put the "what kind" detail in a property, not the event name. One
   `species_added` with a `source` property beats three near-identical events.

### What must never be sent

No tree photos, no GPS coordinates, no search terms, no note text, no email,
no display name. Send the shape instead: lengths, counts, accuracy in metres,
a boolean. Server-side uids (project, site, species guid) are fine; they are
internal identifiers, not personal data.

## Automatic properties

On every event, no call site needed.

**Super properties** (persisted): `app_version`, `app_build`, `platform`,
`device_model`, `os_version`, `device_locale`, `app_language`, `is_emulator`.

**Ambient context** (per launch): `current_screen`, `is_offline`,
`network_type`, `is_logged_in`, `active_project_id`, `active_site_id`,
`session_trees_created`.

`is_offline` is the one to reach for first. Field workers are usually offline,
and any funnel that ignores that will look broken when it is only remote.

**Person properties** (on `identify`): `country`, `user_type`, `locale`,
`is_private_account`, `has_plot_feature`, `account_created_at`.

## Sections

### 1. User profile and segmentation

Answered by properties, not events. Total / new vs returning / DAU / WAU / MAU
come from PostHog's built-in `Application Opened` lifecycle event plus the
person id from `identify()`.

`network_state_changed` covers online vs offline usage.

**Gap: role and organization.** `GET /mobile/user/profile` does not return
either. `user_type` (tpo, individual, education) is sent as the nearest thing.
Admin / Project Manager / Field Worker / Volunteer segmentation needs the
endpoint to send a role, and an org id, first. See "Backend gaps".

### 2. User journey

`login_started` → `login_succeeded` / `login_failed` / `profile_fetch_failed`,
`logged_out`, `project_opened`, `site_opened`, `mapping_started` →
`mapping_completed` / `mapping_abandoned`, `intervention_created`,
`tree_recorded` → `tree_saved`, `tree_edited`, `tree_deleted`,
`sync_started` → `sync_completed` / `sync_failed` / `sync_blocked`,
`sync_item_failed`.

Login success rate = `login_succeeded` / `login_started`. Auth0 can succeed
while the profile fetch fails, which is why the third event exists: that
failure is ours, not the user's.

`sync_blocked` is deliberately not `sync_failed`. Tapping sync with no signal
is normal in the field, and folding it into the failure rate would bury the
real failures.

Session completion rate comes from `app_session_summary.completed_core_task`.

### 3. Feature adoption

Species (`species_searched`, `species_added`, `species_removed`,
`species_list_synced`), monitoring plots (`monitoring_plot_created`,
`tree_monitored`), offline maps (started / downloaded / failed / deleted),
custom forms (created / imported / field added / deleted / opened), notes
(`note_added`), photos (`photo_captured`, `photo_retaken`), export
(`data_exported`).

**Gap: team collaboration.** Nothing in the mobile app is a collaboration
feature today. Nothing is instrumented for it. See "Backend gaps".

### 4. Screen analytics

`$screen` on entry, `screen_left` on exit.

| Metric | From |
| --- | --- |
| most / least visited | count of `$screen` |
| average time per screen | avg `screen_left.duration_ms` |
| exit rate | share of `screen_left` with `exit_reason = app_backgrounded` |
| revisit rate | share of `$screen` with `is_revisit = true` |
| common paths | `$screen.previous_screen` |

Screens are captured by hand from `NavigationContainer.onStateChange`, not by
PostHog autocapture. The SDK's `captureScreens` only supports
`@react-navigation/native` v6 and below; this app is on v7. Doing it manually
is also what gives us dwell time and exit reason, which autocapture would not.

### 5. Form analytics

`form_started`, `form_completed`, `form_abandoned`,
`form_validation_failed`, `form_field_skipped`.

Completion rate = `form_completed` / `form_started`.
Most skipped fields = breakdown of `form_field_skipped.field`.
Abandonment point = `form_abandoned.abandoned_at_field`.

A form is abandoned when the user leaves the screen without submitting; the
hook detects that on unmount.

Instrumented: `tree_measurement`, `intervention_form`,
`monitoring_plot_details`. Any other form is one `useFormAnalytics` call away.

### 6. Navigation behaviour

`back_pressed` (with `source: hardware_button | in_app`), `search_used`,
`menu_opened`, `menu_item_clicked`. Paths come from `$screen.previous_screen`.

Search sends `query_length` and `result_count`, never the query text. Searches
returning zero results are the useful ones: they say the species list is
missing something people look for.

### 7. UX friction

`rage_click` (5+ taps in one spot within 2s), `repeated_tap` (3+),
`dead_click`, `slow_first_action` (8s before first touch), `deep_scroll`.

One capture-phase touch listener in `AnalyticsProvider` feeds all of these. It
only reads coordinates and never takes the responder, so gestures, the map and
scrolling are untouched. Drags beyond 12px are discarded, so scrolls and map
pans do not register as taps.

`dead_click` is best-effort, not proof: a tap that only changes local
component state looks the same to us as one that did nothing. Map-like screens
are exempt, and it is capped at 3 per screen visit so one confusing screen
cannot flood a day's events.

### 8. Performance

`app_crashed`, `api_request_failed`, `screen_load_slow`,
`gps_permission_denied`, `gps_fix_failed`, `gps_accuracy_poor`, plus
`sync_failed` / `sync_item_failed` from section 2.

Crashes stay in **Bugsnag**, which has the stack traces. PostHog gets two
weaker signals so a crash can appear inside a funnel: its own `$exception` for
JS errors, and `app_crashed` on the next launch when the previous run never
reached the background (a native crash or an OS kill).

`api_request_failed` fires from `customFetch`, so it covers every call in the
app. URLs are reduced to patterns (`/projects/:id/sites`) or every project id
would make its own bucket.

Offline sync retries: `sync_item_failed` with `outcome = retryable`.
`quarantined` means the record can never upload without the user editing it,
which is the one worth chasing.

### 9. Terminology research

Every event carries a `term` from `AnalyticsTerms`:
`term_help_opened`, `term_tooltip_opened`, `term_field_skipped`,
`term_field_re_edited`, `term_field_dwell`, `term_form_abandoned_at_field`.

`FIELD_TERMS` in `events.ts` maps form field keys to terms, so instrumenting a
form with `useFormAnalytics` produces the terminology signals for free.

Break these down by `app_language`: a word only confuses people in the
language they actually read it in.

**Gap: ESI.** The term does not appear anywhere in the mobile app. It is kept
in `AnalyticsTerms` so it is ready the day it ships, but nothing emits it.

### 10. Success metrics

`first_tree_created`, `first_intervention_created`, `first_sync_completed`
(each fires once per install, ever, deduped in AsyncStorage) and
`app_session_summary`.

Trees per session = `app_session_summary.trees_created`.
Active mapping sessions = `app_session_summary.was_mapping_session`.
Trees synced = `app_session_summary.trees_synced`.

Repeat usage and returning users after 7/30 days are retention questions
PostHog answers from any event plus a person id, so they need no event of
their own.

## Sessions

A session is one foreground period: app becomes active until it goes to the
background. That matches how a field worker actually works better than a fixed
inactivity window would. Counters are in memory, so a session that ends with
the process being killed loses its summary. That is deliberate: persisting
counters would mean a disk write per tree, all day, on a low-end phone.

## Session replay

Off unless `EXPO_PUBLIC_POSTHOG_SESSION_REPLAY=true`. Field workers have tree
photos, plot coordinates and project names on screen, so this is a build-config
decision and not a default. Even when on, text inputs and images are masked and
snapshots are throttled to 1/second to protect the battery.

Everything in section 7 works with replay off.

## Backend gaps

Three things the brief asks for that the device cannot answer today:

1. **User role** (Admin / Project Manager / Field Worker / Volunteer) —
   `GET /mobile/user/profile` does not return one. Add it and it flows
   straight into `identifyAnalyticsUser` in `capture.ts`.
2. **Organization** — same endpoint, same fix. Once it exists, PostHog's
   `group()` would let a PM analyse by org rather than only by person.
3. **Team collaboration** — no such feature in the mobile app yet, so there is
   nothing to instrument.
