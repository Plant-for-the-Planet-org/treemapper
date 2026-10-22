# E2E testing plan (Playwright)

Plan for adding browser end-to-end tests to the web dashboard (`apps/web`).

**Status:** in progress. Proposed 2026-10-15. Phase 1 is done, and so is step 1
of Phase 3 (the `e2e.yml` workflow). Phase 2 has started: `auth.spec.ts` covers
test 1 below, plus login and logout. See [Open questions](#open-questions)
before starting Phase 4.

Findings come from reading the code, not from running the app. **Confirmed**
means it was read in the code. **Inferred** means it follows from the code but
has not been checked in a browser.

---

## Summary

- Use **Playwright**, starting with desktop Chromium only.
- Two test layers:
  - **Layer 1, mocked API.** Most tests. A fake token goes in `localStorage`,
    and `page.route` serves test data for `/api/server/**`. No secrets are
    needed, so it is safe for a public repo and for pull requests from forks.
  - **Layer 2, full stack.** A few smoke tests against a real server and a
    throwaway Postgres + PostGIS database, with a real Auth0 test user. This
    layer is blocked on the Auth0 questions below.
- Keep the suite small. Logic such as form validation and payload builders
  belongs in unit tests, not E2E.
- The E2E workflow (`.github/workflows/e2e.yml`) is the first CI workflow in
  this repo.

---

## How the web app works (the parts that matter for tests)

### Request path

- Every page is client-rendered inside
  `apps/web/src/app/dashboard/DashboardClientLayout.tsx`. There is no
  `middleware.ts`, so all auth gating happens in the browser.
- The browser only ever calls same-origin `/api/server/*`. `apps/web/next.config.ts`
  rewrites that to the Nest server on `127.0.0.1:3001` (`/api/*`), or to
  `dev.treemapper.app` when `NEXT_PUBLIC_BACKEND_API=true`.
- In production, web and server run as one Docker image on one Heroku dyno
  (`heroku.yml`, `Dockerfile`). There are no preview deploys.

### Auth (confirmed)

- Hand-rolled Auth0 PKCE flow against `accounts.plant-for-the-planet.org`
  (`apps/web/src/lib/auth/`). There is no Auth0 SDK.
- The only "logged in" signal is `localStorage.access_token`. The browser
  checks its `exp` claim only, never the signature (`lib/utils/auth.ts`,
  `isTokenExpired`). There is no refresh token.
- With no valid token, `AuthInitializer` tries a hidden silent-login iframe
  (5s timeout), and then the layout pushes `/login?returnTo=<path+query>`.
- The server checks real RS256 tokens against Auth0 JWKS, audience and issuer
  (`apps/server/src/auth/jwt.strategy.ts`). It also requires an email claim
  and a verified email. **There is no test bypass.**

### What happens on every full page load

Stores are in memory only (Zustand, no persistence), so this runs on every
reload:

1. `GET /users/me`
2. No `primaryWorkspaceUid` → go to `/onboard`
3. No `primaryProjectUid` → `POST /projects/personal`, then fetch `/users/me` again
4. `GET /projects`, `GET /workspace/my`, `GET /notifications`

Success responses use the server envelope
`{ statusCode, message, data, code }`. The client checks `body.statusCode`, not
the HTTP status, so mocks must set it.

### Routes

| Group | Routes | Notes |
|---|---|---|
| Public | `/login`, `/redirecting`, `GET /api/auth/callback` | |
| `(standalone)` | `/`, `/onboard`, `/create-project`, `/profile` | `/` redirects to the user's main project |
| `(dashboard)` | `/project/:uid/` + `overview`, `sites`, `newsite`, `species`, `team`, `intervention`, `new-intervention`, `monitoring-plots`, `bulkupload`, `approvals`, `forms`, `dataexplore`, `leaderboard`, `settings`, `treematch` | The uid in the URL picks the project. An unknown uid shows "Project not found" |
| `(workspace)` | `/workspace/:wsUid/` + `general`, `members`, `projects`, `approvals`, `species`, `activity` | Workspace owner or admin, or superadmin |
| Legacy | `/dashboard/*` | Redirect stubs, kept on purpose for old bookmarks |

### Roles

- Project: `owner`, `admin`, `contributor`, `observer`, plus extra permissions
  (`approve_intervention`, `approve_site`, `add_site`, `request_species`,
  `manage_form`).
- Workspace: `owner`, `admin`, `member`. A workspace owner or admin with no
  project membership acts as project `admin` on the server.
- User type `superadmin` can impersonate other users.
- Sidebar items are gated per role in
  `apps/web/src/component/sidebar/DashboardSidebar.tsx`. Several client gates
  do not match what the server allows (see
  [Known issues](#known-issues-the-tests-are-expected-to-surface)).

### External services a page load can touch

| Service | When |
|---|---|
| Auth0 (`accounts.plant-for-the-planet.org`) | Login, logout, and the silent-login iframe when no valid token is stored |
| Map tiles: CARTO, ArcGIS imagery, OpenStreetMap | Any page with a map. Overview defaults to satellite imagery |
| Image CDN (`NEXT_PUBLIC_CDN_BASE`) | Wherever images render |
| TTC (donations) | Never from the browser. The server calls it for TreeMatch only |

No analytics or error tracking is wired into the web app.

---

## Test layers

### Layer 1: mocked API (most tests)

- **Auth:** an unsigned, fake JWT with a future `exp`, set in
  `localStorage.access_token` with `addInitScript` before app code runs. The
  server never sees it.
- **API:** `page.route('**/api/server/**')` serves typed test data in the
  server envelope. Any call without a mock **fails the test**, so new calls
  cannot slip by unnoticed.
- **External hosts:** block or stub Auth0, the map tile hosts and the CDN.
- **Test data:** small, made up and typed. Never copy real responses into the
  repo: it is public.

### Layer 2: full stack (a few smoke tests)

- A throwaway Postgres with PostGIS (for example the `postgis/postgis` image).
  The migrations do not run `CREATE EXTENSION postgis`, so the image must
  provide it.
- Run the migrations (`npx ts-node src/database/migrate.ts` from `apps/server`),
  then seed with SQL **before** starting the server:
  - workspaces with the slugs `private-projects`, `platform-projects` and
    `development-projects` (onboarding fails without them);
  - a few `scientific_species` rows (species tests need them).

  The server loads workspace ids into an in-memory cache at startup only, so a
  workspace inserted after boot is "not found" until a restart.
- **Server env:**
  - dummy `R2_*` values (the server will not boot without them);
  - the same `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` the web app uses;
  - leave TTC, email and push settings unset.
- **Auth:** real Auth0 tokens are needed (see [Open questions](#open-questions)).
- **Cleanup:** drop the database after each run. Most deletes are soft, and
  there are no API routes to delete users, workspaces or sites.

### Never point tests at

- The shared staging database. The usual server `.env` `DATABASE_URL` points
  there (see `CLAUDE.md`).
- `dev.treemapper.app`, for anything that writes data.
- TreeMatch writes. They update totals in TTC, and there is no unmatch route.

### Keeping mocks honest

Mocked data can drift from the real API. One Layer 2 smoke test should repeat
the checks of the Layer 1 "returning user" test (test 2 below) against the real
server.

---

## Why Playwright

Playwright fits this app for these reasons:

- **Network control.** All API calls go to same-origin `/api/server/**`, so
  `page.route` can serve different data per role. One suite covers owner,
  admin, contributor and observer without four Auth0 accounts.
- **Login seeding.** `addInitScript` sets `localStorage.access_token` before the
  app starts. That is the same hook the "Token injection" section of
  `CLAUDE.md` uses.
- **Two users in one test.** Invite flows need an inviter and an invitee at
  once, and Playwright gives isolated browser contexts in one test.
- **Timing control.** `page.clock` skips the 5s retry loops and the 30s polling.
- **Debugging and cost.** Trace files can be replayed after a CI failure, and
  parallel runs are free. It also runs on Windows and Linux.

Alternatives considered:

| Tool | Verdict |
|---|---|
| Cypress | Would work, but it is weaker at the cross-origin Auth0 login and at two users in one test, and parallel runs need a paid service |
| Vitest + Testing Library | The right tool for validation logic and helpers. Use it alongside Playwright, not instead of it |
| Supertest (server) | The right tool for permission guards and services. Already installed in `apps/server` |

**Limit to accept:** Maplibre draws maps on a WebGL canvas, which tests cannot
read. Test the page around the map, and unit test the GeoJSON logic.

### Browser settings

- Desktop Chromium, viewport 1440x900. The sidebar opens by default at 1280px
  or wider.
- `locale: 'en-US'` and `timezoneId: 'UTC'`. Many dates are formatted with the
  browser locale (`toLocaleString()` with no locale argument).
- No mobile emulation at first. On a mobile user agent, `MobileAppRedirect`
  tries to open a `treemapper://` app link. If mobile is added later, set
  `sessionStorage['treemapper-banner-dismissed'] = 'true'` first.
- Firefox and WebKit can be added later for one or two smoke tests, if needed.

---

## Prioritised scenarios

In the "Fit" column, **M** means Layer 1 (mocked), **F** means Layer 2 (full
stack), and **U** means it is better as a unit or integration test.

| # | Flow | Pages / components | Expected outcome | Why | Priority | Fit |
|---|---|---|---|---|---|---|
| 1 | Open a protected page with no session | any route, `DashboardClientLayout`, `login/components/LoginContent.tsx` | Redirect to `/login?returnTo=...`; login starts PKCE with the right parameters | The login gate runs in the browser only | High | M |
| 2 | Returning user opens the app | `/`, project layout, `Overview` | Lands on `/project/<main>/overview`; sidebar and stats show | Every visit goes through this | High | M, plus one F smoke test |
| 3 | Open a shared deep link | `(dashboard)/project/[projectUid]/layout.tsx` | The right project loads; an unknown uid shows "Project not found" | Unchecked runtime item in `URL-ROUTING-MIGRATION.md` | High | M |
| 4 | Use an old `/dashboard/*` bookmark | `component/LegacyProjectRedirect.tsx` | Goes to `/project/<uid>/...`; invite query string is kept | Real bookmarks; likely broken (see Known issues) | High | M |
| 5 | New user, first run | `/onboard`, `/create-project` | Project created; lands on its overview | Every new user; likely creates two projects | High | M, then F |
| 6 | Accept a project invite | `/?project-invite=T`, `ProjectInviteModal` | Joins the project, skips onboarding | How teams grow | High | M; F needs two users |
| 7 | Record a single-tree intervention | `/project/:uid/new-intervention` | Shows in the interventions list | Core purpose of the product | High value, complex | F (Phase 4). Check first how location is entered |
| 8 | Create a site from a GeoJSON/KML file | `/newsite`, `GeoJSONfileupload` | Site appears in the list | Core setup step; a file upload avoids drawing on the map | Med-High | F |
| 9 | Bulk upload a CSV | `/bulkupload` (4 steps) | Success screen; link opens interventions | Large data path | Medium | One happy path: F. Validation rules: U |
| 10 | Sidebar and access per role | `DashboardSidebar`, `ProjectRoleGate` | Each role sees the right items | Client and server gates disagree today | Medium | M |
| 11 | Session error screens | `DashboardClientLayout` | `email_not_verified` shows "Verify your email"; 5xx retries, then "Error Occurred" | Users get stuck here when it breaks | Medium | M (use `page.clock`) |
| 12 | Switch project, stay on the same section | sidebar project switcher | `/project/<new>/<same section>` | Routing migration item | Medium | M |
| 13 | Log out | `lib/logout.ts` | Token cleared; goes to Auth0 `/v2/logout` | Shared machines in the field | Medium | M |
| 14 | Team: invite, change role, remove | `/team` | Server enforces roles | Access control | Medium | F |
| 15 | Settings, species, approvals, forms, export | the matching pages | Edits save; export downloads | Breadth | Low-Med | F later. Approvals: use modal buttons, not drag and drop |
| 16 | Workspace admin, impersonation and exit | `/workspace/*` | Banner shows; exit works | Superadmin only | Low-Med | F later |
| 17 | TreeMatch | `/treematch` | n/a | Hidden in the sidebar; writes reach TTC with no undo; logic already has unit tests | Low | Not E2E. Use server integration tests |
| 18 | Map drawing and display | `GlobalMap`, `MapSelect` | n/a | WebGL canvas | Low | Test the page around the map. GeoJSON logic: U |
| 19 | Form validation, payload builders | `create-project`, `new-intervention/utils`, bulk validation | n/a | Pure logic | n/a | U (Vitest) |

---

## Current state and gaps

What exists (confirmed):

- `apps/server`: two Jest unit test files,
  `src/treematch/match-math.spec.ts` and
  `src/treematch/automatch/automatch-planner.spec.ts`.
- `apps/server/test/app.e2e-spec.ts`: the untouched Nest template. It expects
  `GET /` to return "Hello World!", which no longer exists, so it fails.
- No tests in `apps/web`, `apps/mobile` or `packages/shared-core`.

| Gap | What it means for Playwright |
|---|---|
| No CI; no `.github/` folder on `develop` | The E2E workflow is the first workflow |
| Root `yarn test` runs `turbo test`, but `turbo.json` has no `test` task | Add `test` and `test:e2e` tasks |
| No `data-testid` in `apps/web` | Find elements by role, label and text; add test ids only where needed |
| `next lint` no longer exists in Next 16 | `yarn lint` is broken for web; separate cleanup |
| No server `.env.example`, no docker-compose, no seed script | Needed for Layer 2 |
| Repo pins Node 22.x with `engine-strict=true` | Use Node 22 (`.nvmrc`), or `yarn add` will refuse |
| `.gitignore` lacks `test-results/`, `playwright-report/`, `blob-report/`, saved login state | Add these before the first run. Saved login state holds tokens, and the repo is public |

---

## Proposed layout and config

```
apps/web/
  playwright.config.ts
  e2e/
    fixtures/
      test.ts        # extended test: authedPage, role, api
      api-mock.ts    # route handler; fails on any unmocked call
      data/          # made-up users, projects, workspaces
    helpers/
      auth.ts        # fake JWT builder, localStorage seeding
      envelope.ts    # ok(data) / fail(status, code) helpers
    specs/           # Layer 1
    fullstack/       # Layer 2, separate Playwright project, opt in
```

The tests live inside `apps/web` so they can reuse the `@/` and
`@shared-core/` import paths, with one pinned dev dependency
(`@playwright/test`). Browsers are installed with `npx playwright install`.

Config notes:

- `webServer` runs from `apps/web`, never from the repo root (see `CLAUDE.md`).
  - **CI:** `next build && next start`. Dev mode compiles each page on first
    visit, which is slow and flaky.
  - **Locally:** `reuseExistingServer: true`, so a running `npm run dev` is reused.
- The build needs `NEXT_PUBLIC_AUTH0_CLIENT_ID` set (a dummy value is fine for
  Layer 1), or the login button throws.
- No retries locally, 2 in CI. Record a trace on the first retry and a
  screenshot on failure.
- Never wait for "network idle". The overview polls every 30s, so it never goes idle.

---

## Running locally and in CI

- **Locally:** run `npx playwright test` from `apps/web`. Add `--ui` to debug.
- **CI (Layer 1):** GitHub Actions on pull requests and pushes to `develop`.
  1. Node 22, Yarn cache, `yarn install --frozen-lockfile`.
  2. Cache the Playwright browsers.
  3. Build the web app and run the tests.
  4. Upload the report and traces only when a test fails.
- **CI (Layer 2):** a PostGIS service container. Runs only on pushes to
  `develop` or nightly, because pull requests from forks get no secrets.
- **Staging or preview:** none exist. A nightly read-only smoke test against
  `dev.treemapper.app` is optional and needs approval.

---

## Phased plan

### Phase 1: minimum setup

1. Use Node 22 locally.
2. Add `@playwright/test`, pinned to an exact version. Commit it with
   `ALLOW_DEP_CHANGE=1` and tell the team.
3. Add the config, fixtures, helpers and made-up data.
4. Add the `.gitignore` entries, a `test:e2e` script, and a turbo task (fix the
   root `test` task too).
5. Add one trivial test: `/login` renders.

**Why:** prove the harness boots the app and blocks external hosts before any
real test depends on it.

### Phase 2: the most valuable tests

1. Write the five tests below, all Layer 1.
2. Add a `data-testid` only where role and label locators are unclear.
3. Decide how to handle tests that expose real bugs: fix first, or mark them
   `test.fail()` with a ticket.

**Why:** they cover the journeys every user goes through and the routing work
that was never checked at runtime. They need no secrets and build the fixtures
every later test reuses.

### Phase 3: CI

1. Add the first GitHub Actions workflow (`e2e.yml`) for pull requests and
   pushes to `develop`.
2. Make it a required check after about two weeks of stable runs.

**Why:** tests that do not run on every change stop being trusted. The waiting
period avoids blocking pull requests on a new, possibly flaky suite.

### Phase 4: grow coverage based on risk

1. **Layer 2 setup:** docker-compose with PostGIS, seed SQL, a server
   `.env.example`, and Auth0 test tokens.
2. **Full-stack smoke tests:** returning-user landing (this checks the mocks
   against the real API), onboarding, a site from GeoJSON, an intervention, and
   invite acceptance with two users.
3. **Role tests:** once the intended observer and contributor behaviour is agreed.
4. **Lower-level tests:** Vitest for validation and payload logic, and Supertest
   for server guards. This keeps the E2E suite small.
5. **More browsers:** Firefox and WebKit smoke tests, if needed.

---

## First five tests

All five use Layer 1.

### 1. A user with no session is sent to login, and the return path is kept

- **Preconditions:** no token.
  - Stub the Auth0 `/authorize` request so the silent-login iframe ends
    quickly. Whether this works still needs checking; without it, every run
    waits the full 5s timeout.
- **Steps:**
  1. Open `/project/p_demo/settings?tab=features`.
  2. Click "Continue with email".
- **Assert:**
  - The URL is `/login?returnTo=%2Fproject%2Fp_demo%2Fsettings%3Ftab%3Dfeatures`
    (path and query, URI-encoded; confirmed in `DashboardClientLayout`).
  - The click requests `accounts.plant-for-the-planet.org/authorize` with:
    - `response_type=code`
    - `code_challenge_method=S256`
    - `audience=urn:plant-for-the-planet`
    - `redirect_uri=<origin>/api/auth/callback`

    Catch the request; do not follow it.
  - `sessionStorage.pkce_code_verifier` is set.

### 2. A returning user lands on their main project

- **Preconditions (mocks):**
  - `users/me`: `primaryWorkspaceUid` and `primaryProjectUid=p_main` set, and
    `image` set so the avatar `PUT` is skipped.
  - `projects`: two owner projects in one workspace.
  - `workspace/my` and `notifications`.
  - The overview endpoints: `analytics/project-kpis/p_main`,
    `analytics/recent-additions/p_main`, `interventions/p_main/map/all`,
    `projects/p_main/sites/map`.
- **Steps:** open `/`.
- **Assert:**
  - The URL becomes `/project/p_main/overview`.
  - The sidebar shows the project name and the owner menu.
  - A stats value from the test data is visible.
  - There is no `POST /projects/personal` call and no unmocked call.
- **Reliability:** wait for elements, not the network. Do not check the map canvas.

### 3. Deep links open the right project, and unknown ids are handled

- **Steps:**
  1. Open `/project/p_second/settings`.
  2. Open `/project/p_missing/overview`, then click "Go to dashboard".
- **Assert:**
  1. The settings page shows p_second's data, and the project switcher shows
     p_second.
  2. "Project not found" appears. The button goes to `/` and then on to
     `/project/p_main/overview`.

### 4. Old `/dashboard` links still work

- **Steps:** cold-load each of these:
  1. `/dashboard/overview`
  2. `/dashboard/settings`
  3. `/dashboard?project-invite=abc` (mock `projects/invites/abc/status`)
- **Assert:**
  1. Ends on `/project/p_main/overview`.
  2. Ends on `/project/p_main/settings`.
  3. Ends on `/?project-invite=abc`, and the invite modal opens.
- **Expected today:** cases 1 and 2 fail (see Known issues).

### 5. Onboarding a new user creates a project and lands on it

- **Preconditions:**
  - `users/me` returns no main workspace until `POST /users/onboarding` is
    called, then returns one. This needs a mock that changes state after a call.
  - `POST /projects` returns a new uid.
- **Steps:**
  1. Open `/`; expect to land on `/onboard`.
  2. Fill `#projectName` with a name that contains a space.
  3. Choose "Personal/Organization Use", then click Continue and Skip.
  4. On `/create-project`, check the name is filled in, pick a project type,
     set a target, and tick the terms box.
  5. Click "Update and Continue".
- **Assert:**
  - The `POST /users/onboarding` body has the expected fields.
  - The URL becomes `/create-project?name=...&type=private`.
  - `POST /projects` uses the private workspace's uid.
  - The test ends on `/project/<new>/overview`.
- **Reliability:**
  - The flow has two full page reloads, one of them after a 500ms timer.
  - The map point is optional, so no map clicks are needed.

---

## Known issues the tests are expected to surface

All are confirmed in the code and not yet seen in a browser.

- **Legacy `/dashboard/*` links show a spinner forever on a cold load.**
  `app/dashboard/layout.tsx` only passes its children through.
  `LegacyProjectRedirect` waits for store values that only
  `DashboardClientLayout` fills, and that layout is not mounted under
  `/dashboard`. For the same reason, logged-out users are never sent to login
  on these pages.
- **Onboarding likely creates two projects.** `POST /users/onboarding` inserts a
  project (`apps/server/src/users/users.service.ts`). Then `/create-project`
  sends `POST /projects` for a second one.
- **Onboarding does not URL-encode the project name** when it redirects to
  `/create-project?name=...` (`(standalone)/onboard/page.tsx`).
- **The bulk upload success link goes to `/project/undefined/intervention`.**
  `UploadSuccess.tsx` reads `selectedProject.uid`, but that object only has
  `name` and `id`.
- **`returnTo` drops `/workspace/...` and `/create-project` deep links.** After
  login these fall back to `/`, because `ALLOWED_REDIRECT_ROOTS` in
  `lib/types/auth.ts` does not include them.
- **Role gates differ between client and server.** For example:
  - Observers see Overview, but the server denies its stats and map.
  - Site Edit and Manage show for every role.
  - The site save is optimistic, so it reports success even when the server
    returns 403.

---

## Open questions

1. **Auth0 for Layer 2:**
   - Can we get one or two dedicated test users on the shared
     `accounts.plant-for-the-planet.org` tenant?
   - Can we get a way to mint tokens without the login page, for example a
     separate test client?

   Without this, Layer 2 must drive the Universal Login page, which is fragile.
2. **CI:** is GitHub Actions fine as this repo's first workflow? Who owns it,
   and what is the policy on Actions secrets for a public repo?
3. **Known bugs:** should they be fixed before the tests land, or should the
   tests land as `test.fail()` with tickets?
4. **Roles:** what should observers and contributors see? Role tests need the
   intended behaviour first.
5. **Browsers:** which browsers do dashboard users use? There is no analytics
   to check.
6. **`dev.treemapper.app`:** is a nightly read-only smoke test there allowed?
7. **Test ids:** is it fine to add a few `data-testid` attributes to app code?

---

## Rules of thumb for writing tests

- **Locators:** prefer `getByRole`, `getByLabel` and visible text. shadcn
  components carry useful roles and `data-slot` attributes. Add a `data-testid`
  only when those are unclear.
- **Waiting:** wait for elements or URLs, never for `networkidle`.
- **Mocks:** wrap responses in the server envelope, and set `statusCode` in the
  body too.
- **Maps:** do not check what is drawn on the map canvas. Check the controls
  and panels around it.
- **Invite links:** `POST /projects/:id/invites` returns the invite token in its
  response, so tests can accept an invite without reading email.
- **Committed artifacts:** never commit tokens, saved login state or real data.
