# E2E user flows plan (Playwright)

Which user flows to cover next in the web dashboard (`apps/web`), in what
order, and what each one needs. It builds on
[e2e-testing-plan.md](./e2e-testing-plan.md), which holds the strategy, the
test layers, the harness and the CI setup. Read that first.

**Status:** proposed 2026-11-04, for review. Written so far: F1 scenario 1 in
Layer 2 (full stack, local only, 2026-11-05), F2 in Layer 1 except the switch
across workspaces (`specs/landing.spec.ts`, 2026-11-11), and F2 scenario 1 in
Layer 2 (`fullstack/deep-link.spec.ts`, 2026-11-12).

**How this was made:** by reading the code, not by running the app. Labels,
endpoints and bugs below come from the source and give a path where it
matters. Treat a label as a starting point for a locator, and check it in the
browser (`--ui` or `--debug`) when you write the test.

**Why these flows:** each one covers something users rely on, and each one
walks through a different part of the code. Writing them in order is also a
guided tour of the app: the bootstrap and stores first, then the field data
that is the core of TreeMapper, then teams and review, then admin.

---

## Contents

- [What is already covered](#what-is-already-covered)
- [Facts every flow depends on](#facts-every-flow-depends-on)
- [Priority and order](#priority-and-order)
- [Shared prerequisites](#shared-prerequisites)
- Flows
  - [F1. A returning user lands on their project](#f1-a-returning-user-lands-on-their-project)
  - [F2. Deep links, unknown projects and the project switcher](#f2-deep-links-unknown-projects-and-the-project-switcher)
  - [F3. Session error screens](#f3-session-error-screens)
  - [F4. Record a single-tree intervention](#f4-record-a-single-tree-intervention)
  - [F5. Find and manage interventions](#f5-find-and-manage-interventions)
  - [F6. Create and edit a site from a file](#f6-create-and-edit-a-site-from-a-file)
  - [F7. Bulk upload interventions from a CSV](#f7-bulk-upload-interventions-from-a-csv)
  - [F8. Grow the team: invite, accept, change role](#f8-grow-the-team-invite-accept-change-role)
  - [F9. Review a submission on the approval board](#f9-review-a-submission-on-the-approval-board)
  - [F10. A new user onboards and creates a project](#f10-a-new-user-onboards-and-creates-a-project)
  - [F11. Project settings and the API key](#f11-project-settings-and-the-api-key)
  - [F12. What each role can see and do](#f12-what-each-role-can-see-and-do)
- [Later, and not E2E](#later-and-not-e2e)
- [Bugs these flows are expected to surface](#bugs-these-flows-are-expected-to-surface)
- [Questions to settle before some flows](#questions-to-settle-before-some-flows)

---

## What is already covered

`apps/web/e2e/specs/auth.spec.ts` covers login and logout in full: the
redirect to login, the PKCE round trip, silent login, stale tokens, callback
errors, open redirects, logout (also from the collapsed sidebar), and logout
while impersonating. None of the flows below repeat that. They all start
logged in (`test.use({ loggedIn: true })`).

`apps/web/e2e/fullstack/landing.spec.ts` covers F1 scenario 1 in Layer 2,
and `fullstack/deep-link.spec.ts` covers F2 scenario 1: a real Auth0 login
(reused while the saved token is good), a local server and a local database.
They run only when asked (`E2E_FULLSTACK=1`), never in CI. How to run it is in
[e2e-testing-plan.md, "Running locally and in
CI"](./e2e-testing-plan.md#running-locally-and-in-ci).

`apps/web/e2e/specs/landing.spec.ts` covers F2 in Layer 1: deep links, an
unknown project, the switcher within one workspace, legacy `/dashboard` links
and an invite on a project route. See [F2](#f2-deep-links-unknown-projects-and-the-project-switcher)
for what is in and what is left out.

Tests 2 to 5 in [e2e-testing-plan.md, "First five
tests"](./e2e-testing-plan.md#first-five-tests) map to F1, F2, the legacy
links part of F2, and F10 here. Tests 3 and 4 (F2) are written. Test 2 (F1) has
only its Layer 2 version so far, and test 5 is not written. Their step
lists live in that file and are not copied here; this file adds what they
need and where they sit in the order.

---

## Facts every flow depends on

These shape how every test is mocked. All were read in the code.

- **The fetcher never throws on an HTTP error.**
  `packages/shared-core/fetchApi/customFetch.ts` returns
  `{ statusCode, message, code, data: null }` for any non-2xx, and a network
  failure gives `statusCode: 0`. Pages check `body.statusCode`. A `try/catch`
  around a fetcher never sees an HTTP error, which is the cause of several
  "shows success on failure" bugs below.
- **Every success body says `statusCode: 200`**, even for a `POST` that answers
  201 on the wire (`apps/server/src/common/interceptors/response.interceptor.ts`).
  Use `ok(data)` from `e2e/helpers/envelope.ts` for every success mock.
- **Some fetchers wrap one level deeper.** The presign call is read as
  `data.data.uploadUrl` on the profile page, and the approval queues as
  `data.data[]`. Copy the shape the page reads, not what looks tidy.
- **Stores live in memory only.** Every full page load runs the bootstrap again
  (`GET /users/me`, `GET /projects`, `GET /workspace/my`, `GET /notifications`),
  so every test needs `mockSession(api)`. Flows that end in
  `window.location.href = ...` reload and bootstrap again.
- **Gates are client side and role based.** `selectedProject.userRole` drives
  almost every gate. Helpers are in `apps/web/src/lib/projectAccess.ts`
  (`isProjectAdmin`, `canWriteToProject`), but many pages compare strings by
  hand. The extra permissions (`approve_intervention`, `add_site`, and the rest)
  are set on the Team page and **never checked anywhere in the web app**.
- **Image uploads leave `/api/server`.** The browser calls
  `POST /api/server/users/presign-url`, then `PUT /api/upload-image?uploadUrl=...`
  on the app's own origin. That second route is a Next route handler, so the
  API mock does not catch it and `blockedHosts` does not block it: unmocked, the
  Next server would fetch `uploadUrl` itself. Every flow that uploads an image
  must route it (see [Shared prerequisites](#shared-prerequisites)).
- **Maps cannot be read.** Every flow below can be finished without a map
  click: typed coordinates, a geometry file, or a CSV.

---

## Priority and order

Score: **Value** is how much users lose if it breaks. **Learn** is how much
new code the test walks through. **Effort** is the mock and fixture work.

| # | Flow | Value | Learn | Effort | Phase |
|---|---|---|---|---|---|
| F1 | Returning user lands on their project | High | High (bootstrap, stores, overview) | Low | A |
| F2 | Deep links, unknown project, project switcher, legacy links | High | Medium (routing) | Low | A |
| F3 | Session error screens | Medium | Medium (error states, `page.clock`) | Low | A |
| F4 | Record a single-tree intervention | **Highest** | High (core form, payloads, uploads) | Medium | B |
| F5 | Find and manage interventions | High | High (filters, query params, edits) | Medium | B |
| F6 | Create and edit a site from a file | High | Medium (geometry, site access) | Medium | B |
| F7 | Bulk upload from a CSV | Medium-High | Medium (parsing, validation, stepper) | Medium | B |
| F8 | Invite, accept, change role | High | Medium (invites, reload flows) | Medium | C |
| F9 | Review on the approval board | Medium-High | Medium (board, threads) | Medium | C |
| F10 | New user onboards | High | Medium (standalone pages) | Medium | C |
| F11 | Project settings and API key | Medium | Medium (tabs, save payload) | Low-Med | D |
| F12 | What each role can see and do | Medium | Low (gates only) | Low per role | D |

**Why this order:**

1. **Phase A** builds the fixtures every later test reuses (a project with
   sites, roles, a second project) and is the cheapest way to learn how a page
   load works. Do it first even though F4 is the most valuable flow.
2. **Phase B** is what TreeMapper exists for: recording interventions and the
   sites they sit in. F4 comes before F5 so that the list test can reuse the
   intervention data builder.
3. **Phase C** is about people: teams, invites and review. These flows reload
   the page on purpose, so they need the patterns from Phase A.
4. **Phase D** is breadth. F12 grows one role at a time and waits on the
   intended role rules (see [Questions](#questions-to-settle-before-some-flows)).

Suggested spec files, one per area, in `apps/web/e2e/specs/`:
`landing.spec.ts` (F1, F2), `session-errors.spec.ts` (F3),
`new-intervention.spec.ts` (F4), `interventions.spec.ts` (F5),
`sites.spec.ts` (F6), `bulk-upload.spec.ts` (F7), `team.spec.ts` (F8),
`approvals.spec.ts` (F9), `onboarding.spec.ts` (F10), `settings.spec.ts` (F11),
`roles.spec.ts` (F12).

---

## Shared prerequisites

Build these once, in the order the flows need them.

| Need | Where | First used by |
|---|---|---|
| A second project (**done**: `SECOND_PROJECT`, same workspace, passed as `mockSession(api, { projects })`), and the project with each role (`owner`, `admin`, `contributor`, `observer`) (not yet) | `e2e/fixtures/data/session.ts` (`mockSession` takes options now; add `withRole(role)` next) | F1, F2, F12 |
| A second workspace with a project in it (not yet; only the cross-workspace switch needs it) | `e2e/fixtures/data/session.ts` | F2 scenario 3 |
| Overview mocks: KPIs, recent additions, map data (**done**: `mockOverview(api)`, any project uid) | `e2e/fixtures/data/overview.ts` | F1, F2 |
| A pending invite and its status mock (**done**: `mockInviteStatus(api)`) | `e2e/fixtures/data/invites.ts` | F2, F8 |
| Typed builders for sites, interventions, species and members, made up and small | `e2e/fixtures/data/*.ts` | F4 to F9 |
| A route for `PUT /api/upload-image` that returns `{ success: true }` and records calls, plus a presign mock | a helper next to `api-mock.ts`, or a `uploads` fixture | F4, F11 |
| Small test files: a Polygon GeoJSON, a KML, a Point GeoJSON, a valid and an invalid CSV, a tiny PNG | `e2e/fixtures/files/` (made up, never real coordinates of a real project) | F4, F6, F7 |
| `page.clock` for the 5s retry loop, the 2s post-success timers and the 30s overview poll | in the spec | F3, F8 |
| A `page.on('dialog')` handler for the few `window.alert` calls | in the spec | F11 (profile) |

Rules that carry over from the strategy doc: find elements by role, label and
text; add a `data-testid` only when that fails (many icon buttons have no
name, listed per flow). Never wait for network idle. Never copy a real API
response into the repo.

---

## F1. A returning user lands on their project

**Purpose.** Every visit starts here. If the bootstrap breaks, nothing else
works. This is test 2 in the strategy doc; its steps are there.

**What you learn.** How a page load works end to end: auth token, bootstrap
calls, stores, the project layout guard, the overview and the sidebar.

**User journey**

1. Open `/`.
2. The app loads the user and their projects, then goes to
   `/project/<primaryProjectUid>/overview`.
3. The sidebar shows the project, the nav groups and the user. The overview
   shows four stat cards and, for owners and admins, the recent activity panel.

**Pages and components**

- `app/(standalone)/page.tsx` (the `/` redirect)
- `app/dashboard/DashboardClientLayout.tsx` (`initializeApp`, the bootstrap)
- `app/(dashboard)/project/[projectUid]/layout.tsx` (uid guard, store hydration)
- `overview/component/Overview.tsx`, `StatCardsContainer.tsx`,
  `RecentAdditionsComponent.tsx`, `GlobalMap.tsx`
- `component/sidebar/DashboardSidebar.tsx`, `component/header/NotificationIcon.tsx`

**API**

| Call | Notes |
|---|---|
| `GET users/me` | No `primaryWorkspaceUid` means `/onboard`; no `primaryProjectUid` means `POST projects/personal` first |
| `GET projects` | `data.projects[]` and `data.workspaces[]` |
| `GET workspace/my` | Non-empty shows the "Workspace" sidebar item |
| `GET notifications?page=1&limit=10` | Once, no polling |
| `GET analytics/project-kpis/<uid>` | Polled every 30s |
| `GET analytics/recent-additions/<uid>?page=1&limit=10` | Owner and admin only, polled every 30s |
| `GET interventions/<uid>/map/all`, `GET projects/<uid>/sites/map` | Map data |
| `POST workspace/primary` | Only if the project's workspace is not the selected one |

**Logic and state**

- `useUserStore.user`, `useProjectStore.projects`, `selectedProject`,
  `selectedWorkspce` (sic).
- The layout renders the page only after `selectedProject.uid` matches the URL.
- Overview gates "Live activity" and "Recent interventions" on owner or admin,
  by hand (`Overview.tsx`).

**Scenarios**

1. Owner lands on the overview. Stat titles "Trees Planted", "Species
   Planted", "Restoration Area", "Active Contributors" show test values. No
   `POST projects/personal`, no unmocked call.
2. A user with no `primaryProjectUid` gets `POST projects/personal`, then a
   second `GET users/me`, then lands on the new project.
3. A contributor lands and sees no "Recent interventions" panel and no
   `recent-additions` call.
4. Notifications: the bell shows the unread count; "Mark all read" sends
   `PATCH notifications/mark-all-read`.

**Edge cases**

- The tree count grows between polls: a toast "N new trees added" shows. Needs
  `page.clock` to jump 30s. Optional.
- `primaryProjectUid` not in the projects list lands on "Project not found".

**Prerequisites:** overview mocks, a contributor variant of the project.

**Status**

| Scenario | Layer 1 (mocked) | Layer 2 (full stack, local) |
|---|---|---|
| 1. Owner lands on the overview | Not written | **Done**, `fullstack/landing.spec.ts` |
| 2. No `primaryProjectUid` | Not written | Not planned: needs a user with no main project, and it writes |
| 3. Contributor lands | Not written | Not written: needs a contributor account. The spec already switches its checks on the role it reads |
| 4. Notifications | Not written | Unread count next (read only). "Mark all read" writes, so it waits for agreement |

What the Layer 2 test learned, for whoever writes the Layer 1 version:

- The real `users/me` sends `displayName` and no `name`, and `firstName` /
  `lastName` can be `null`. The mock `USER` in `session.ts` has `name`, which
  is why the sidebar name bug below (#1137) never showed with mocks.
- On a project with no data all four stats read 0, which is also what the
  cards show when the KPI call fails. Check that the page's KPI request
  returned 200, not only the values.
- Locators that work: the sidebar is `[data-slot="sidebar"]`; a stat card is
  `[data-slot="card"]` filtered by its heading (`getByRole('heading', { name:
  'Trees Planted' })`), and its value is the first `p`. The owner and admin
  panel shows as a "Live activity" button; the "Recent interventions" panel is
  mounted but zero-width until it is opened.

---

## F2. Deep links, unknown projects and the project switcher

**Purpose.** Shared links and bookmarks must open the right project. The
routing migration (`URL-ROUTING-MIGRATION.md`) lists these as never checked
at runtime. Covers tests 3 and 4 and scenario 12 in the strategy doc.

**What you learn.** How the URL picks the project, how the switcher writes the
URL, and how the legacy `/dashboard/*` stubs work.

**User journey**

1. Open `/project/p_second/settings` from a shared link.
2. Use the sidebar project switcher to pick another project.
3. Open a project id you have no access to.
4. Open an old `/dashboard/...` bookmark.

**Pages and components**

- `(dashboard)/project/[projectUid]/layout.tsx`
- `DashboardSidebar.tsx` (switcher, `selectOrg` call)
- `lib/projectRoutes.ts` (`subpageFromPath`, `projectHref`)
- `component/LegacyProjectRedirect.tsx`, `app/dashboard/page.tsx`

**API:** the bootstrap, plus `POST workspace/primary` with
`{ workspaceUid, projectUid }` when the switch crosses workspaces, plus the
target page's own calls (settings: `GET projects/<uid>`,
`GET projects/<uid>/images`).

**Logic and state**

- The switcher keeps only the first path segment:
  `/project/a/forms/123` becomes `/project/b/forms`.
- It does not re-check the role on the new project.
- A non-200 from `workspace/primary` shows "Something went wrong" and stays.

**Scenarios**

1. Deep link to the second project's settings shows its data, and the switcher
   shows its name.
2. Switch from `/project/p_main/sites` to the second project: lands on
   `/project/p_second/sites`.
3. Switch across workspaces: `POST workspace/primary` has the right body.
4. Unknown uid: "Project not found", then "Go to dashboard" ends on the main
   project's overview.
5. Legacy links (strategy doc, test 4): expected to fail today, see Bugs.

**Edge cases:** a failed `workspace/primary` keeps the user where they were;
`?project-invite=` on a project route leaves the project list empty (see Bugs).

**Prerequisites:** a second project; a second workspace only for scenario 3.

**Status** (Layer 1 in `specs/landing.spec.ts`, Layer 2 in
`fullstack/deep-link.spec.ts`)

| Scenario | Layer 1 (mocked) | Layer 2 (full stack, local) |
|---|---|---|
| 1. Deep link to the second project's settings | **Done** | **Done**. Skips unless the account has a second project in its main project's workspace |
| 2. Switch within one workspace keeps the section | **Done** | Not written |
| 3. Switch across workspaces | **Left out on purpose** (workspace work is a separate task). Needs a second workspace in the session mock | Not planned: `POST workspace/primary` changes the account's main workspace |
| 4. Unknown uid, then "Go to dashboard" | **Done** | Not written |
| 5. Legacy links | **Done**. `/dashboard/overview` and `/dashboard/settings` are `test.fail()` (they spin forever, see the strategy doc's Known issues); `/dashboard?project-invite=` passes | Not written |
| Edge: failed `workspace/primary` | **Left out** with scenario 3: within one workspace the switch never calls it | Not planned |
| Edge: `?project-invite=` on a project route | **Done**. The modal opens (normal test); the page behind it loading is `test.fail()` (see Bugs) | Not written |

What writing it taught, for later flows:

- **Both projects sit in one workspace on purpose.** The switcher only calls
  `POST workspace/primary` when the workspace changes, and that call has no
  mock, so the unmocked-call guard proves it was never made.
- **A deep link races the bootstrap.** `DashboardClientLayout` selects the
  user's main project while the project layout selects the one in the URL.
  The URL wins today, but if it ever lost, the settings page would load
  p_main behind a p_second URL. The deep link test checks that
  `GET projects/p_main` is never called, not only what the page shows.
- **Check `test.fail()` tests for the right failure.** `test.fail()` passes on
  any failure, a broken mock included. Each one here was run with the JSON
  reporter to see that it fails where the bug says: the URL stays on
  `/dashboard/...`, and "Trees Planted" never shows behind the invite.
- Locators that work: the switcher is the sidebar button whose name holds the
  project name; projects in the open list are buttons with the exact project
  name. The settings "Project name" field has a real label, so
  `getByLabel('Project name')` works. An empty sites list shows "No sites
  found".
- The switcher keeps only the first path segment, and the role is not
  re-checked on the new project. Neither has its own test: the first needs a
  nested page with its own mocks (forms), the second belongs to F12.
- **The Layer 2 deep link test is read-only by force, not by care.** It routes
  every non-GET `/api/server/` request, aborts it and fails the test, so a
  page that starts writing cannot change the real account. It reads the
  expected name, slug, workspace and role from the API as the same user, and
  checks that the page's own `GET projects/<uid>` returned 200: empty fields
  alone would also pass on a failed load.

---

## F3. Session error screens

**Purpose.** When the session is broken, users must see a clear way out, not
a spinner. Scenario 11 in the strategy doc.

**What you learn.** The error branches of the bootstrap and how to control
timers in a test.

**User journey:** open any project page while the server refuses or fails.

**Pages and components:** `DashboardClientLayout.tsx` (error screens and
`handleError` retry loop).

**API:** `GET users/me` answering `fail(401|403, ..., code)` or
`fail(500)`; `GET projects` answering non-200.

**Logic**

- 401 or 403 from `users/me` shows the error at once, no retry.
- Any other failure retries 3 times, 5s apart, then shows "Error Occurred".

**Scenarios**

1. `email_not_verified`: heading "Verify your email", the email from the
   token, buttons "I have verified, check again" and "Sign in with a different
   account".
2. Another 403 code: "Error Occurred" and "Sign in again".
3. `users/me` returns 500 four times: with `page.clock`, "There was an error
   while loading your dashboard" shows after the third retry, with exactly 4
   calls made. "Try Again" starts the loop again.
4. The server recovers on the second call: the page loads normally.

**Edge cases:** "I have verified, check again" calls the Auth0 silent login;
the stub answers `login_required`, which logs out. Assert the logout request.

**Prerequisites:** `page.clock`.

---

## F4. Record a single-tree intervention

**Purpose.** The core of the product: a field worker records a tree that was
planted. The strategy doc listed this for the full-stack layer because it was
not clear how a location is entered. It is clear now: coordinates can be typed,
so the flow fits the mocked layer.

**What you learn.** The biggest form in the app, how its payload is built,
species search, image upload, and the upload modal.

**User journey**

1. From "Interventions", click "New Intervention" (top bar), or open
   `/project/<uid>/new-intervention`.
2. Keep the type "Single Tree Registration" (the default).
3. Optionally pick a site in "Site (Optional)".
4. Search a species in "Search for species..." and pick it.
5. Under "Location", type latitude and longitude, then click "Set Location".
6. Fill "Planting Date", "Height (m)", "Width/DBH (cm)", and an optional tag.
7. Choose an image.
8. Click "Create Intervention". The upload modal shows "Upload Successful!".
9. Click "Done". The app goes back to the previous page.

**Pages and components**

- `new-intervention/page.tsx`
- `components/SpeciesSelector.tsx`, `components/LocationSelector.tsx`,
  `component/InterventionSelectMap.tsx` (typed coordinates at about line 1050),
  `components/InterventionFileUpload.tsx`
- `InterventionUploadModal.tsx`
- `utils/validation.ts`, `utils/payloadBuilder.ts`, `constants.ts`

**API**

| Call | Notes |
|---|---|
| `GET projects/<uid>/sites` | Fills the site `<select>` |
| `GET scientific-species/search?name=` | Debounced 300ms; global species, not project species |
| `POST users/presign-url`, then `PUT /api/upload-image` | Only with an image |
| `POST interventions/projects/<uid>/web` | The save. Planning mode uses `.../web/plan`; many planned single trees use `.../web/plan/bulk-single` |
| `GET interventions/<uid>/sites/<siteUid>/map` | Only when the existing interventions overlay is on |

**Key logic and state**

- Role gate: owner, admin, contributor. Others see "You don't have permission
  to create interventions..." and a disabled submit.
- Changing the type resets species and geometry.
- Types that allow both shapes start in Polygon mode. Click "Point" first to
  see the coordinate inputs. Single tree is Point only.
- Validation for single tree: species, location and image required; height
  and width above 0, at most 200, at most 2 decimals; tag at most 100 chars.
  Errors list under "Please fix the following errors:".
- Payload: `{ type, captureMode: 'off-site', geometry, registrationDate,
  interventionStartDate, interventionEndDate, treeCount, species, tag, height,
  width, image?, plantProjectSite?, metadata }`.
- No store write: the form is local state. The list page refetches on return.

**Scenarios**

1. Happy path: the `POST .../web` body has the right type, a Point geometry
   with `[lng, lat]` in that order, the species, and the image file name from
   the presign mock.
2. Submit with nothing filled: the error list names the missing fields and no
   `POST` is sent.
3. Height 250 or 1.234: a validation error.
4. Server failure: the modal shows "Upload Failed" and "Try Again" sends the
   `POST` again.
5. Observer opens the URL: the permission text shows and submit is disabled.
6. Planning mode ("Toggle planning mode"): no image section, and the `POST`
   goes to `.../web/plan`.

**Edge cases**

- Multi tree with a Polygon from a GeoJSON file (`InterventionFileUpload`
  accepts `.geojson`, `.json`, `.kml`). Good second test.
- A Point file uploaded for a type that only takes a polygon is refused.
- Unknown species ("Unknown Species" then "Add Species") is sent with
  `isUnknown`.

**Prerequisites:** presign and upload-image mocks, a tiny PNG and a GeoJSON in
`e2e/fixtures/files/`, a species search mock.

---

## F5. Find and manage interventions

**Purpose.** After recording comes checking and fixing. Managers use this list
every day.

**What you learn.** How UI filters turn into query parameters, infinite
scroll, the detail panel, and several kinds of edit modals.

**User journey**

1. Open "Interventions".
2. Search by HID, filter by type, site or capture mode, pick a date range in
   the top bar.
3. Open an intervention to see its species, sample trees and details.
4. Edit the description or the species count, or delete it.
5. Select many and assign them to a site, or change their start date.

**Pages and components**

- `intervention/page.tsx`, `component/InterventionsPanel.tsx`,
  `InterventionCard.tsx`, `InterventionDetails.tsx`
- `EditInterventionModal.tsx`, `SpeciesEditModal.tsx`, `TreeCard.tsx`,
  `EditTreeModal.tsx`, `BulkUpdateModal.tsx`, `BulkStartDateEditModal.tsx`
- Store: `useInterventionFilterStore` (date range)

**API**

| Call | Notes |
|---|---|
| `GET interventions/projects/<uid>?page&limit=20&searchHid&type&captureMode&projectSiteId&interventionStartDate&...` | Empty params are dropped. Response `data.intervention[]`, `data.pagination` |
| `GET projects/<uid>/sites` | For the site filter |
| `PUT interventions/<iUid>/<uid>` | Inline description, body `{ interventionUid, prjid, field: 'description', value }` |
| `PUT interventions/<iUid>/<uid>/<speciesUid>` | Species count, `{ speciesCount, scientificSpeciesId? }` |
| `POST .../edit/validate`, then `PUT interventions/<iUid>/<uid>/edit` | Edit modal; success needs `success: true` in the body |
| `DELETE interventions/<uid>/<iUid>` | Delete |
| `PUT interventions/projects/<uid>/start-date/bulk` | Bulk start date |
| `PUT interventions/trees/<hid>/<uid>/edit`, `POST .../remeasure` | Tree edit and remeasurement |

**Logic and state**

- The list fetches twice on mount (two effects). Assert on the last call, not
  the count.
- `?id=<uid>` deep links to one intervention; if it is not on page 1, a second
  call asks for it with `limit: 1`.
- Edit and Delete show for owner and admin only. The inline description edit
  and the tree edit button are not gated.
- The status badge shows `planned` as `completed` (`lib/interventionStatus.ts`).

**Scenarios**

1. Filters: picking a type and a site sends `type=` and `projectSiteId=`;
   "Clear all filters" drops them. The search sends `searchHid` after the
   500ms debounce.
2. Date preset "This Month" sends the matching start and end dates (freeze the
   clock).
3. Deep link `?id=` opens that intervention's detail.
4. Delete as owner: the dialog "Delete Intervention", then the `DELETE` call,
   then a refetch.
5. Observer: no Edit or Delete buttons.
6. Bulk start date: two selected, the `PUT` body lists both uids.
7. Empty project: the empty state offers "Create Intervention".

**Edge cases**

- Scroll to load page 2: pages are appended and de-duplicated by uid.
- Bulk assign site sends one `PUT` per intervention; a failure in the middle
  shows no error (see Bugs).

**Prerequisites:** an intervention data builder with species and sample trees.

---

## F6. Create and edit a site from a file

**Purpose.** Sites are the places interventions sit in, and setting one up is
an early step for every project. A file upload avoids drawing on the map.
Scenario 8 in the strategy doc; it fits the mocked layer.

**What you learn.** GeoJSON and KML handling, site detail, and site access.

**User journey**

1. On "Sites", click "Add Site" (owner and admin only).
2. Fill "Enter site name", pick a site type, fill the description.
3. Upload a Polygon GeoJSON or KML. "Location selected" shows.
4. Click "Create Site". The app goes back to the sites list.
5. Select the site, click "Edit", change the name, "Save".
6. Click "Manage" under Access, grant a member access.

**Pages and components**

- `newsite/page.tsx`, `component/GeoJSONfileupload.tsx`, `component/MapSelect.tsx`
- `sites/page.tsx`, `sites/component/SitesPanel.tsx`, `SiteDetails.tsx`,
  `SiteAccess.tsx`

**API**

| Call | Notes |
|---|---|
| `POST projects/<uid>/sites` | `{ name, description, location: FeatureCollection, status }` |
| `GET projects/<uid>/sites` | The list |
| `PUT projects/<uid>/sites/<siteUid>` | `{ name, description, geoJSON? }`; geometry only when changed |
| `GET projects/<uid>/sites/<siteUid>/members` | Reads `data.data[]` |
| `POST .../access/grant`, `POST .../access/revoke` | `{ memberUid }` |
| `POST .../sync-ttc` | Only on the `platform-projects` workspace, owner or admin |

**Logic and state**

- The new site form labels have no `htmlFor`; use placeholders.
- The upload takes `.kml`, `.geojson`, `.json` up to 10MB, Polygon only. KML
  is converted with `@tmcw/togeojson` and altitude is dropped.
- The submit button stays disabled until name, description and geometry are
  set.
- The site save is optimistic and ignores the response.

**Scenarios**

1. Happy path with GeoJSON: the `POST` body holds the FeatureCollection and
   the chosen status.
2. Same with KML: the body geometry has no altitude.
3. A Point file: "Point geometry is not supported. Only Polygon geometry is
   allowed." and submit stays disabled.
4. A broken JSON file: "Invalid JSON format." and "Try Again".
5. Edit name: the `PUT` body has the new name and no `geoJSON`.
6. Site access: grant through "Confirm Action", the grant call, then a refetch.
7. Sites list filters: search by name, status filter, sort.

**Edge cases**

- Save fails with 403: the UI still shows the new name (see Bugs; write it as
  `test.fail()` or skip until fixed).
- Contributor: no "Add Site" in the top bar, but `/newsite` by URL still works.

**Prerequisites:** Polygon GeoJSON, KML and Point GeoJSON in
`e2e/fixtures/files/`, a site and member data builder.

---

## F7. Bulk upload interventions from a CSV

**Purpose.** Large projects bring data in bulk. One wrong column can create
hundreds of bad records. Scenario 9 in the strategy doc; the happy path fits
the mocked layer, the rules belong in unit tests.

**What you learn.** File parsing in the browser, the validation table, and a
multi-step flow that posts on mount.

**User journey**

1. Open "Bulk Upload". Step "Site": pick a site, "Continue".
2. Step "Upload": choose a CSV, "Continue to next step".
3. Step "Validate": see the table, fix a row inline if needed, "Continue to
   upload".
4. Step "Success": the upload starts at once and shows "Upload successful".

**Pages and components**

- `bulkupload/page.tsx`, `component/SelectProjectSite.tsx`,
  `component/InfoSection.tsx`, `component/DataValidation.tsx`,
  `component/UploadSuccess.tsx`
- The custom format path (`bulkupload/custom-format/`) is a separate, later
  test.

**API**

| Call | Notes |
|---|---|
| `GET projects/<uid>/sites` | Step 1 |
| `POST interventions/projects/<uid>/bulk` | Step 4, body is an **array** of interventions with Point geometry `[lng, lat]` |

The `bulkIntervention` URL in `api.url.ts` (`/prokects`) is dead; nothing uses
it.

**Logic and state**

- Accepts `.csv`, `.tsv`, `.xlsx`. Dates are day first (`DD/MM/YYYY`).
- Rules: Single needs exactly 1 species and 1 tree; Multi needs more than 1
  tree; latitude and longitude in range; start date not in the future; end
  date not before start.
- The continue button reads "Fix N errors to continue" while rows are invalid.
- Local state only, no store.

**Scenarios**

1. Happy path: 2 rows (one Single, one Multi). The `POST` body has 2 items with
   the right types, dates and coordinates.
2. A CSV with one bad row: "Fix 1 errors to continue" and no `POST`.
3. Fix the row inline: the button turns into "Continue to upload".
4. A `.xls` file is refused with "Please upload an Excel (.xlsx) or CSV file."
5. A file with only headers: "That file has no data rows".
6. Server failure: "Upload failed" and "Retry upload" posts again.

**Edge cases**

- "Go to interventions" after success goes to `/project/undefined/intervention`
  (known issue in the strategy doc). Write as `test.fail()` with a ticket.

**Prerequisites:** a valid and an invalid CSV in `e2e/fixtures/files/`, built
from the "Download template" columns.

---

## F8. Grow the team: invite, accept, change role

**Purpose.** Projects are run by teams. Invites are how a project grows and
roles are how access is controlled. Scenarios 6 and 14 in the strategy doc.

**What you learn.** The Team page, the invite modal, how an invite link is
accepted on any page, and the reload after accepting.

**User journey**

1. Owner opens "Team", clicks "Invite User", fills "Email address", picks a
   role, "Send invitation".
2. Owner opens a member row, changes the role, "Save changes".
3. Owner removes a member ("Remove user", then "Remove").
4. The invitee opens `/?project-invite=<token>` and clicks "Accept
   Invitation".

**Pages and components**

- `team/page.tsx`, `team/component/InviteUserModal.tsx`,
  `UserDetailsModal.tsx`, `BulkInviteModal.tsx` (invite links)
- `component/ProjectInviteModal.tsx`, mounted by `DashboardClientLayout`

**API**

| Call | Notes |
|---|---|
| `GET projects/<uid>/allmembers` | `data.members[]` and `data.invitations[]` |
| `GET analytics/<uid>/leaderboard?pageSize=1000`, `GET projects/<uid>/team-activity?limit=20` | Also on load |
| `POST projects/<uid>/invites` | `{ email, message, role }` |
| `POST projects/<uid>/invites/expire` | Cancel an invite, `{ token }` |
| `PATCH projects/<uid>/members/<memberUid>/role` | `{ role }` |
| `DELETE projects/<uid>/members/<memberUid>` | Remove |
| `GET projects/invites/<token>/status` | Invite modal; `.../status/link` for link invites |
| `POST projects/invites/accept` | `{ token }`; `.../accept/link` for link invites |
| `POST projects/invites/decline` | Email invites only |

**Logic and state**

- With `?project-invite` or `?project-link`, the bootstrap stops after
  `users/me` and does not load projects.
- After accept: toast, then after 2s a full reload without the parameter. Use
  `page.clock` or wait for the URL.
- Invite role options: Admin, Contributor, Observer. No Owner.
- After a role change or a removal the page refetches after 2s.

**Scenarios**

1. Invite by email: the `POST` body; "Invitation sent!"; then the pending list
   shows the email.
2. Invalid email: "Email address is invalid" and no `POST`.
3. Change role to Observer: the `PATCH` body.
4. Remove a member: the confirm dialog and the `DELETE` call.
5. Accept an email invite from `/`: accept call, then the reload lands on the
   overview with the projects call made.
6. An expired invite shows "This invitation has expired and can no longer be
   accepted." and only "Close".
7. Decline an email invite: the decline call, then a reload without the
   parameter.

**Edge cases**

- Closing an email invite with the X shows "Project invite declined
  successfully" without calling decline (see Bugs).
- Invite links: "Generate invitation link", the shown URL is
  `<origin>/?project-link=<link>`. Deleting a link just made in the same
  session sends the wrong id (see Bugs).
- Two-user version (inviter and invitee in two browser contexts) belongs to
  the full-stack layer.

**Prerequisites:** a member data builder; invite status data for pending,
expired and accepted.

---

## F9. Review a submission on the approval board

**Purpose.** On projects with approval turned on, nothing is final until a
reviewer approves it. Scenario 15 in the strategy doc says to use the modal
buttons rather than drag and drop; this flow does that.

**What you learn.** The review status model, the board columns, comment
threads, and the difference between project and workspace scope.

**User journey**

1. Open "Approvals". Cards sit in "New Requests", "In Review", "Approved",
   "Rejected".
2. Open a new card, click "Start review". It moves to "In Review".
3. Open it again, click "Approve", or "Reject" with a reason.
4. Leave a comment in the discussion.
5. Switch to "Sites" and do the same for a site.

**Pages and components**

- `approvals/page.tsx`, `component/ApprovalBoard.tsx`, `ApprovalColumn.tsx`,
  `ApprovalCard.tsx`, `SiteApprovalCard.tsx`, `ApprovalModal.tsx`
- Types: `packages/shared-core/types/approval.types.ts`

**API**

| Call | Notes |
|---|---|
| `GET approval-board/projects/<uid>/requires-approval` | Read, but the "not enabled" screen is commented out |
| `GET approval-board/projects/<uid>/queue?limit=100&page=1` | Interventions, reads `data.data[]` |
| `GET approval-board/projects/<uid>/sites/queue?...` | Sites |
| `GET approval-board/interventions/<iUid>`, `GET .../threads/current` | When the modal opens |
| `POST approval-board/projects/<uid>/interventions/<iUid>/review` | `{ decision }`, or `{ decision: 'rejected', note }` |
| `POST approval-board/projects/<uid>/sites/<siteUid>/review` | Same for sites |
| `POST approval-board/projects/<uid>/threads/<threadUid>/comments` | Admin comment; field workers use `approval-board/threads/<threadUid>/comments` |

**Logic and state**

- Column mapping: `draft`, `pending` to New Requests; `in_review`,
  `changes_requested`, `in_revision`, `resubmitted` to In Review; `approved`,
  `published` to Approved; `rejected`, `unpublished` to Rejected.
- The only transitions in the UI: pending to in review, in review to approved
  or rejected. Approved and rejected are final.
- Local state in the board; `useApprovalStore` is set but not used.
- After a decision the board reloads its queue.

**Scenarios**

1. Start review on a pending intervention: the `POST` body is
   `{ decision: 'in_review' }`, and the queue is fetched again.
2. Approve: `{ decision: 'approved' }`.
3. Reject: the second "Reject" button stays disabled until a reason is typed;
   the body carries the note.
4. Comment as owner: goes to the admin comment route; the "Internal note"
   checkbox shows.
5. Comment as contributor (direct URL): goes to the field worker route; no
   internal note checkbox.
6. "Mine" filter and search narrow the cards.
7. Sites tab: approve a site.

**Edge cases**

- A contributor or observer still sees "Start review", "Approve" and "Reject"
  (see Bugs). Record today's behaviour in F12 once the rule is agreed.
- The internal note flag is never sent (see Bugs).
- Drag and drop: one optional test, using `page.mouse` with steps, since the
  sensor needs an 8px move. Not worth more.

**Prerequisites:** approval queue data with one card per column, a thread with
comments.

---

## F10. A new user onboards and creates a project

**Purpose.** Every new user goes through this once. Test 5 in the strategy
doc; its steps and asserts are there.

**What you learn.** The standalone pages, a mock that changes state after a
call, and full reloads in the middle of a flow.

**Extra detail found since the strategy doc was written**

- Plan cards on `/onboard` are clickable cards, not radios: find them by text
  ("Personal/Organization Use").
- The "Private" plan goes to a second screen ("Tell us about yourself").
  "Skip" and "Submit" run the same handler, so Skip still sends what was typed.
- `?flow=add-project` (from "Create New Project" in the switcher) skips
  `POST users/onboarding` and goes straight to `/create-project`.
- `/create-project` with no `?name` sends you back to
  `/onboard?flow=add-project`.
- The create form is valid with no map point; the location is optional.

**Scenarios to add to test 5**

1. The add-project path from the switcher: no onboarding call, and
   `POST projects` uses the chosen workspace.
2. A name with `&` or `#`: today it breaks the query string (see Bugs).
3. Validation: "Project name is required", "Please enter a valid URL".

**Prerequisites:** a `users/me` mock that returns a workspace only after
`POST users/onboarding` has been called.

---

## F11. Project settings and the API key

**Purpose.** Admins change project details and turn on features such as the
approval board and API access. Partly covered: `auth.spec.ts` lands on
settings, but never saves.

**What you learn.** A large page with tabs in the query string, a save that
sends a cleaned payload, and the API key life cycle.

**User journey**

1. Open "Project settings". Tabs: "General settings", "Location", "Features",
   "Danger zone" (`?tab=general|location|features|danger`).
2. Change the name and target, "Save changes".
3. On Features, turn on "Project API", then "Generate API key", then
   "Revoke".
4. Turn on "Approval board" and save.

**Pages and components:** `settings/page.tsx` (one large file).

**API**

| Call | Notes |
|---|---|
| `GET projects/<uid>`, `GET projects/<uid>/images` | On load |
| `GET projects/<uid>/api-key` | Features tab |
| `PATCH projects/<uid>` | Save; also `{ apiEnabled }` from the switch, and `{ originalGeometry }` from Location |
| `POST projects/<uid>/api-key` | Generate or regenerate; reads `data.apiKey` |
| `DELETE projects/<uid>/api-key` | Revoke |
| `POST users/presign-url`, `PUT /api/upload-image`, `POST projects/<uid>/images` | Add image |
| `DELETE projects/<uid>` | Delete project |

**Logic and state**

- `canEdit`: owner or admin, with special rules on the `platform-projects`
  workspace (read-only unless in review). There is no page gate: a contributor
  sees every field locked.
- The save sends only cleaned, non-empty fields; `country` is cut to 3 upper
  case letters; `target` only if a positive whole number.

**Scenarios**

1. Save general: the `PATCH` body; "Project settings updated successfully!".
2. Save fails with 500: today it still says success (see Bugs). `test.fail()`.
3. Generate an API key: the key shows once with a copy button; revoke sends the
   `DELETE`.
4. Contributor by URL: fields locked, Save disabled.
5. Platform project not in review: the read-only notice shows.

**Edge cases**

- Delete project reloads the same URL and lands on "Project not found" (see
  Bugs).
- The "Bulk upload" switch is never sent (TODO in the code, keep it).

**Prerequisites:** API key status mocks (none, exists); a platform workspace
variant.

---

## F12. What each role can see and do

**Purpose.** Scenario 10 in the strategy doc. Gates differ between client and
server, and within the client from page to page.

**What you learn.** Every gate in one place. Run it last, as a table driven
spec, once the intended rules are agreed.

**What the code does today** (`DashboardSidebar.tsx` and the pages)

| Item | Owner | Admin | Contributor | Observer |
|---|---|---|---|---|
| Overview, Sites, Species, Interventions, Plots, Bulk Upload, Leaderboard (sidebar) | yes | yes | yes | yes |
| Team, Approvals, Forms (sidebar); Bulk Upload (top bar button) | yes | yes | no | **yes** |
| Data Explorer, Project settings | yes | yes | no | no |
| New Intervention submit | yes | yes | yes | no |
| Add Site (top bar) | yes | yes | no | no |
| Intervention Edit and Delete | yes | yes | no | no |
| Approve and Reject buttons on the board | yes | yes | **yes** (by URL) | **yes** |

Sidebar items are hidden with `role === 'contributor'`, so an observer (and
an unknown role) sees Team, Approvals and Forms.

**Scenarios:** one `test.describe` per role. For each, check the sidebar items
and open two or three gated URLs directly. Assert today's behaviour only where
it is agreed; mark the rest `test.fixme` with the open question.

**Prerequisites:** the role variants from Phase A, and answers to question 4
in the strategy doc.

---

## Later, and not E2E

**Later, mocked, lower priority**

| Flow | Why later |
|---|---|
| Species: add from search, request a new species, favourite | Useful, but simple CRUD. `species/page.tsx` |
| Forms builder | Reordering is drag and drop only, and field labels have no `htmlFor`. Test create, add a field, publish. `component/forms/` |
| Workspace admin: settings, members, project status and transfer | Owner and admin of a workspace only. Uses a custom, non-Radix modal and select, so locators need care |
| Superadmin impersonation start and exit | Few users. Exit is half covered by `auth.spec.ts` |
| Profile edit | Small. Note the double-wrapped presign response and `window.alert` |
| Monitoring plot create | Can be done with typed centre and size, no map. Newer feature, check it is in use first |
| Data Explorer export | File is built in the browser; assert the download, not its content |
| Custom format bulk upload | Needs a folder upload (`webkitdirectory`) |

**Not E2E**

| Area | Better as |
|---|---|
| TreeMatch | Server integration tests. Hidden in the sidebar (`showTreeMatch = false`), and writes reach TTC with no undo |
| Device management | Not in the sidebar (commented out); needs telemetry columns first |
| Leaderboard filters | Broken (see Bugs); fix first, then one small test |
| Validation rules, payload builders, CSV parsing | Vitest: `new-intervention/utils/`, `bulkupload` validation, `GeoJSONfileupload` parsing |
| Server guards and permissions | Supertest in `apps/server` |

---

## Bugs these flows are expected to surface

Found while reading the code for this plan. Each one is in addition to the
"Known issues" list in the strategy doc. Confirm each in a browser before
filing it. The usual pattern applies: one `test.fail()` per bug, plus a
normal test for the rest of the page.

| Flow | Bug | Where |
|---|---|---|
| F11 | Save and location update show success on any server error: the fetcher does not throw, and the code only checks for a throw | `settings/page.tsx`, `handleSubmit` and `handleLocationUpdate` |
| F11 | Delete project reloads the deleted project's URL, which shows "Project not found" | `settings/page.tsx`, `handleDeleteProject` |
| F8 | Closing an email invite with X shows "Project invite declined successfully" without calling decline. After a failed status call the user sees an error and a "declined" toast | `ProjectInviteModal.tsx`, `handleClose` |
| F8 | A failed decline never stops the spinner | `ProjectInviteModal.tsx` |
| F8 | Deleting an invite link made in the same session sends a timestamp as its id | `team/component/BulkInviteModal.tsx` |
| F8 | Role select, "Remove user" and "Save changes" in the member modal are not gated on owner or admin | `team/component/UserDetailsModal.tsx` |
| F9 | "Start review", "Approve" and "Reject" show for every role; `isAdmin` only hides the internal note checkbox | `approvals/component/ApprovalModal.tsx` |
| F9 | The "Internal note" flag is never sent to the API | `approvals/component/ApprovalBoard.tsx` |
| F6 | Site edit is optimistic and ignores the response; the Edit button is not role gated | `sites/page.tsx`, `SiteDetails.tsx` |
| F6 | Site delete makes no API call; the delete dialog is never opened | `sites/page.tsx` |
| F6 | Sites status filter values (`planning`, `completed`) do not match site types (`planted`, `reforestation`) | `sites/component/SitesPanel.tsx`, `newsite/page.tsx` |
| F6 | `maxAreaHa` is declared but never read, so no area limit is enforced | `component/GeoJSONfileupload.tsx` |
| F7 | A file over 10MB shows an error but still continues | `bulkupload/component/InfoSection.tsx` |
| F7 | `AVERAGE PLANT WIDTH` is read for width, but validation checks `AVERAGE PLANT DIAMETER` | `bulkupload/component/UploadSuccess.tsx`, `DataValidation.tsx` |
| F5 | Intervention delete ignores the response; bulk assign site shows no error when one request fails | `intervention/component/InterventionDetails.tsx`, `BulkUpdateModal.tsx` |
| F5 | Dead UI: ownership transfer is never opened (and its fetcher URL has a stray `}`), "Update Location" and "Add Image" fake an upload with a timer | `InterventionDetails.tsx`, `api.fetch.ts` |
| F4 | `scientificSpeciesUid` is filled with the numeric species id | `new-intervention/utils/payloadBuilder.ts` |
| F4 | The presign file name is `getMilliseconds()`, so only 1000 names exist | `new-intervention/InterventionUploadModal.tsx` |
| F1 | Notification action button only closes the modal; the per-item X removes it only on the client | `component/header/NotificationIcon.tsx` |
| F1 | **#1137. Seen in a browser** (Layer 2). The sidebar shows a blank user name, and "U" as the initials when there is no image, for a user with no first or last name: it falls back to `user.name`, but `users/me` sends `displayName`, not `name`. `fullstack/landing.spec.ts` notes it as a "known issue" for now | `component/sidebar/DashboardSidebar.tsx`, `userName` |
| F2 | **Seen in a test** (`landing.spec.ts`, `test.fail()`). `?project-invite=` on a project route leaves the project list empty, so the page spins behind the modal | `DashboardClientLayout.tsx`, `initializeApp` |
| Later | Leaderboard filters and "load more" send no parameters, so every filter shows the same data and "load more" appends duplicates | `leaderboard/page.tsx` |
| Later | Profile save does not check the `PATCH` result, and does not update the store | `(standalone)/profile/page.tsx` |

---

## Questions to settle before some flows

1. **Roles (blocks F12, shapes F9 and F8).** Should observers see Team,
   Approvals and Forms, and should contributors see Bulk Upload in the sidebar
   when the top bar hides it from them? Should non-admins see the approval
   decision buttons? This is question 4 in the strategy doc.
2. **Extra permissions.** `approve_intervention`, `approve_site`, `add_site`
   and `request_species` can be set on the Team page but nothing in the web
   app reads them. Is that planned work, or should the UI hide them?
3. **Bugs found here.** Fix first, or land the tests as `test.fail()` with
   tickets? Same as question 3 in the strategy doc; one answer for both lists
   would keep the suite consistent.
4. **Monitoring plots and forms.** Are they in use yet? If not, they stay in
   "Later".
