# E2E testing plan (Playwright)

Plan for adding browser end-to-end tests to the web dashboard (`apps/web`).

**Status:** in progress. Proposed 2026-10-15. Phase 1 is done, and so is step 1
of Phase 3 (the `e2e.yml` workflow). Phase 2 has started: `auth.spec.ts` covers
test 1 below, the full login round trip, the login callback errors and logout
(scenarios 1 and 13). See [Open questions](#open-questions) before starting
Phase 4. It also covers silent login, expired tokens, open redirects through
`returnTo` and `redirectTo`, logout from the collapsed sidebar, and logout while
impersonating.

F2 is written in Layer 1 (2026-11-11): `landing.spec.ts` covers tests 3 and
4 below and scenario 12, except the switch across workspaces. See F2 in
[e2e-user-flows.md](./e2e-user-flows.md#f2-deep-links-unknown-projects-and-the-project-switcher).

Layer 2 has started too, locally only: a real Auth0 login, F1 scenario 1
(`fullstack/landing.spec.ts`, 2026-11-05) and F2 scenario 1
(`fullstack/deep-link.spec.ts`, 2026-11-12), against a local server and
database. Since 2026-11-12 the setup reuses a saved login while its token is
still good, so most runs skip the Auth0 page. It is not in CI. See [Layer 2: full stack](#layer-2-full-stack-a-few-smoke-tests).

**Which flows come next, and in what order:** see
[e2e-user-flows.md](./e2e-user-flows.md). It lists twelve user flows (F1 to
F12) with their pages, API calls, scenarios and prerequisites, and it replaces
the order in [Phase 2](#phase-2-the-most-valuable-tests). This file stays the
home of the strategy, the harness and CI.

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
  - **Layer 2, full stack.** A few smoke tests with a real Auth0 test user, a
    real server and a real database. Today it runs locally only, against the
    developer's own server and database. Running it in CI (a throwaway
    Postgres + PostGIS) is still blocked on the Auth0 questions below.
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
| `(dashboard)` | `/project/:uid/` + `overview`, `sites`, `newsite`, `species`, `team`, `intervention`, `new-intervention`, `monitoring-plots`, `bulkupload`, `approvals`, `forms`, `forms/:formId`, `dataexplore`, `leaderboard`, `settings`, `treematch`, `monitoring-plots/create`, `bulkupload/custom-format`, `device-management` | The uid in the URL picks the project. An unknown uid shows "Project not found". `treematch` and `device-management` are not in the sidebar; reachable by URL only |
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
| Avatar fallback (`avatar.iran.liara.run`) | Profile page, when the user has no image |
| `PUT /api/upload-image?uploadUrl=...` (same origin) | Every image upload. A Next route handler, not under `/api/server`, so the API mock does not catch it and `blockedHosts` does not block it. Unmocked, the Next server fetches `uploadUrl` itself. Route it in any test that uploads |
| TTC (donations) | Never from the browser. The server calls it for TreeMatch only |

No analytics or error tracking is wired into the web app.

---

## Test layers

### Layer 1: mocked API (most tests)

- **Auth:** an unsigned, fake JWT with a future `exp`, set in
  `localStorage.access_token` with `addInitScript` before app code runs. The
  server never sees it. The token is seeded once per tab, on the app origin
  and in the top frame only, so a reload after logout stays logged out.
- **API:** `page.route('<app origin>/api/server/**')` serves typed test data in
  the server envelope. Any call without a mock gets a 501 and **fails the
  test**, so new calls cannot slip by unnoticed or reach a real backend.
- **Auth0:** stubbed, so the app's own side of the login runs for real: the
  `/authorize` params, `/api/auth/callback`, `/redirecting`, the token exchange
  and the logout return trip. The stub keeps an Auth0 session like the real
  one: a `loggedIn` test starts with one, an interactive login starts one, and
  `/v2/logout` ends it. A silent login (`prompt=none`) gets a code while there
  is a session and `error=login_required` when there is not, both at once, so no
  test waits the 5s timeout. This is what lets the logout test prove that a
  reload stays logged out. Any Auth0 path the stub does not know fails the
  test.
- **Other hosts:** every other origin (map tiles, the CDN and the rest) is
  blocked and listed in `blockedHosts`. This does not fail the test, unless the
  path starts with `/api/`: the app only calls its own API, so an endpoint sent
  to another host fails the test even though the API mock never sees it.
- **Test data:** small, made up and typed. Never copy real responses into the
  repo: it is public.

### Layer 2: full stack (a few smoke tests)

#### What exists today (local only)

Opt in, and never part of `yarn test:e2e` or CI. The Playwright projects
`fullstack-setup` and `fullstack` only exist when `E2E_FULLSTACK` is set.

- **Login:** `fullstack/auth.setup.ts` runs before the specs on every run, in
  this order:
  1. The safety checks (see **Safety** below), and a check that the local API
     server answers (`401` on `/api/server/users/me` with no token). These
     always run first: a good saved token never skips them.
  2. It reuses the token in `e2e/.auth/user.json` (gitignored) when it is for
     this app's origin and for the account in `.env.e2e`, has more than an
     hour left, and the local server accepts it (`200` on `users/me`). The
     report shows which check decided, as an `auth` annotation, without the
     email or the token. A reuse never starts a browser: the setup is two
     serial tests, and the login test, the only one that asks for `page`, is
     skipped.
  3. Otherwise it logs in through the real Auth0 Universal Login page:
     "Continue with email", then the email page, then the password page, and
     Accept on the consent screen if Auth0 shows one. A rejected password
     fails at once and is never retried, because Auth0 locks an account after
     repeated failures.
  4. After a new login it saves **only** `localStorage.access_token`, readable
     by the current user only (`0600`). The full browser state would also keep
     Auth0's session cookies, which last 100 days and can get new tokens
     without a password, and no spec needs them.

  Every spec starts from that file. To force a new login, delete it.
- **The login is never recorded.** The `fullstack-setup` project sets
  `trace`, `screenshot` and `video` to `off`. Checked on 2026-11-06: a trace of
  the login keeps the typed password in plain text (in the `fill` action, the
  page snapshot and the form post to Auth0), and the email in more places. Do
  not pass `--trace on` to a Layer 2 run: the command line overrides the
  project setting. To debug a failed login, run it with `--headed` instead.
- **Credentials:** `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` in
  `apps/web/.env.e2e`. It is gitignored (`.env*`), Next does not load it, and
  the config only reads it when `E2E_FULLSTACK` is set. The account needs a
  password on the tenant: an account made with Google or another social login
  gets "Wrong email or password".
- **Safety:** before logging in, `assertLocalBackend()` (`fullstack/env.ts`)
  stops the run if `apps/web/.env` has `NEXT_PUBLIC_BACKEND_API=true`
  (dev.treemapper.app) or if `apps/server/.env` `DATABASE_URL` is not on
  `localhost`, `127.0.0.1` or `::1`. It reads those two keys only, so server
  secrets never reach the tests. It checks the files, not the running
  processes, so restart a server after editing its `.env`.
- **Fixtures:** specs import `test` and `expect` from `fullstack/fixtures.ts`,
  never from `fixtures/test.ts` (Layer 1 mocks the API and stubs Auth0). It
  gives:
  - `token`: the saved access token.
  - `backend.get(path)`: reads the real API as the same user, so specs learn
    the expected values at run time. No real data is written into the repo.
  - `apiCalls`: every `/api/server/` call the page made. Automatic for every
    test, and any 5xx fails the test.
- **Data:** whatever the test account has in the local database. Specs must
  not hardcode it, and must not write unless the user agrees.
  `deep-link.spec.ts` shows one way to make that hold: it routes every non-GET
  `/api/server/` request, aborts it and fails the test. A spec that needs data
  the account may not have (a second project in the same workspace) skips
  with a reason instead of failing.
- **Empty values pass on a failed load.** Many widgets start at 0 or empty and
  stay that way when their call fails with a 4xx, which the 5xx guard does not
  catch. On a project with no data, also check that the page's own request
  returned `statusCode: 200` (see `landing.spec.ts` and the KPI request).

#### For CI later (not built)

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

`fullstack/landing.spec.ts` does that. Drift it has found so far:

- `USER` in `fixtures/data/session.ts` has a `name` field. The real `users/me`
  has no `name`; it sends `displayName`, and `firstName` / `lastName` can be
  `null`. That is why Layer 1 never showed the blank sidebar name (#1137, see
  [Known issues](#known-issues-the-tests-are-expected-to-surface)). When F1 is
  written for Layer 1, give the mock user the real fields.

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

- Desktop Chromium with the "Desktop Chrome" preset viewport, 1280x720. The
  sidebar opens by default at 1280px or wider, so do not go narrower.
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
| 1 | Open a protected page with no session | any route, `DashboardClientLayout`, `login/components/LoginContent.tsx` | Redirect to `/login?returnTo=...`; login starts PKCE with the right parameters | The login gate runs in the browser only | High | M. **Done** (`auth.spec.ts`) |
| 1b | Login callback errors | `GET /api/auth/callback`, `/login` | Unverified email opens the verify dialog; other errors go back to login with no token | Users get stuck here when it breaks | Medium | M. **Done** (`auth.spec.ts`) |
| 2 | Returning user opens the app | `/`, project layout, `Overview` | Lands on `/project/<main>/overview`; sidebar and stats show | Every visit goes through this | High | M, plus one F smoke test. F **done** (`fullstack/landing.spec.ts`, local only) |
| 3 | Open a shared deep link | `(dashboard)/project/[projectUid]/layout.tsx` | The right project loads; an unknown uid shows "Project not found" | Unchecked runtime item in `URL-ROUTING-MIGRATION.md` | High | M. **Done** (`landing.spec.ts`). F **done** for the deep link (`fullstack/deep-link.spec.ts`, local only) |
| 4 | Use an old `/dashboard/*` bookmark | `component/LegacyProjectRedirect.tsx` | Goes to `/project/<uid>/...`; invite query string is kept | Real bookmarks; broken (see Known issues) | High | M. **Done** (`landing.spec.ts`; two cases are `test.fail()`) |
| 5 | New user, first run | `/onboard`, `/create-project` | Project created; lands on its overview | Every new user; likely creates two projects | High | M, then F |
| 6 | Accept a project invite | `/?project-invite=T`, `ProjectInviteModal` | Joins the project, skips onboarding | How teams grow | High | M; F needs two users |
| 7 | Record a single-tree intervention | `/project/:uid/new-intervention` | Shows in the interventions list | Core purpose of the product | High value, complex | M first: latitude and longitude can be typed in Point mode, so no map click is needed. Then one F smoke test. See F4 in `e2e-user-flows.md` |
| 8 | Create a site from a GeoJSON/KML file | `/newsite`, `GeoJSONfileupload` | Site appears in the list | Core setup step; a file upload avoids drawing on the map | Med-High | M first (`setInputFiles`), then F. See F6 |
| 9 | Bulk upload a CSV | `/bulkupload` (4 steps) | Success screen; link opens interventions | Large data path | Medium | Happy path and main errors: M, then one F. Validation rules: U. See F7 |
| 10 | Sidebar and access per role | `DashboardSidebar`, `ProjectRoleGate` | Each role sees the right items | Client and server gates disagree today | Medium | M |
| 11 | Session error screens | `DashboardClientLayout` | `email_not_verified` shows "Verify your email"; 5xx retries, then "Error Occurred" | Users get stuck here when it breaks | Medium | M (use `page.clock`) |
| 12 | Switch project, stay on the same section | sidebar project switcher | `/project/<new>/<same section>` | Routing migration item | Medium | M. **Done** within one workspace (`landing.spec.ts`); across workspaces not written |
| 13 | Log out | `lib/logout.ts` | Token cleared; goes to Auth0 `/v2/logout`; after a reload, Auth0 refuses the silent login, so you stay logged out | Shared machines in the field | Medium | M. **Done** (`auth.spec.ts`) |
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
- `apps/web/e2e/specs/auth.spec.ts`: the Layer 1 auth tests (added on this
  branch).
- `apps/web/e2e/fullstack/landing.spec.ts` and `deep-link.spec.ts`: the
  Layer 2 tests (F1 scenario 1, F2 scenario 1), behind a real login in
  `fullstack/auth.setup.ts`. Local only.
- `apps/web/e2e/specs/landing.spec.ts`: the Layer 1 F2 tests (deep links,
  unknown projects, the switcher, legacy links).
- No other tests in `apps/web`, and none in `apps/mobile` or
  `packages/shared-core`.

| Gap | What it means for Playwright |
|---|---|
| No CI; no `.github/` folder on `develop` | **Fixed:** `e2e.yml` is the first workflow |
| Root `yarn test` runs `turbo test`, but `turbo.json` has no `test` task | **Fixed:** `test` and `test:e2e` tasks added; the failing placeholder `test` script in `shared-core` was removed |
| No `data-testid` in `apps/web` | Find elements by role, label and text; add test ids only where needed |
| `next lint` no longer exists in Next 16 | `yarn lint` is broken for web; separate cleanup |
| No server `.env.example`, no docker-compose, no seed script | Needed for Layer 2 in CI. Locally, Layer 2 uses the developer's own server and database |
| Repo pins Node 22.x with `engine-strict=true` | Use Node 22 (`.nvmrc`), or `yarn add` will refuse |
| `.gitignore` lacks `test-results/`, `playwright-report/`, `blob-report/`, saved login state | **Fixed.** Saved login state (`.auth/`) holds tokens, and the repo is public |
| Nothing type-checks the e2e code: `next.config.ts` sets `ignoreBuildErrors: true`, and web has no `type-check` script | A type error in a spec or fixture only shows up when that code runs. Type-check by hand for now |

---

## Layout and config

```
apps/web/
  playwright.config.ts
  e2e/
    fixtures/
      test.ts        # extended test: `loggedIn` option, plus blockedHosts,
                     # api and auth0 (all auto, so every spec gets the guards)
      api-mock.ts    # route handler; fails on any unmocked call
      data/
        session.ts   # made-up user, two projects, workspace; mockSession(api)
        overview.ts  # KPIs, recent additions, map data; mockOverview(api)
        invites.ts   # a pending invite; mockInviteStatus(api)
    helpers/
      auth.ts        # fake JWT builder, localStorage seeding
      auth0.ts       # Auth0 stub: /authorize, /oauth/token, /v2/logout
      envelope.ts    # ok(data) / fail(status, code) helpers
      devtools.ts    # hideNextDevTools(page), shared by both layers
    specs/           # Layer 1
      auth.spec.ts     # login, silent login, callback errors, logout
      landing.spec.ts  # F2: deep links, switcher, legacy links
    fullstack/       # Layer 2: projects `fullstack-setup` and `fullstack`,
                     # only when E2E_FULLSTACK is set
      env.ts         # file paths, credentials(), assertLocalBackend()
      auth.setup.ts  # safety checks, then reuse the saved token or log in
                     # through Auth0; saves only the token to .auth/user.json
      fixtures.ts    # test: token, backend, apiCalls (auto, fails on 5xx)
      landing.spec.ts    # F1 scenario 1
      deep-link.spec.ts  # F2 scenario 1, blocks every write
    .auth/           # saved login state, gitignored (holds a real token)
apps/web/.env.e2e    # E2E_USER_EMAIL, E2E_USER_PASSWORD; gitignored
```

The tests live inside `apps/web` so they can reuse the `@/` and
`@shared-core/` import paths, with one pinned dev dependency
(`@playwright/test`). Which browser to install differs locally and in CI: see
"Running locally and in CI".

Config notes:

- `webServer` runs from `apps/web`, never from the repo root (see `CLAUDE.md`).
  - **CI:** `next build && next start`. Dev mode compiles each page on first
    visit, which is slow and flaky.
  - **Locally:** `reuseExistingServer: true`, so a running `npm run dev` is
    reused, with its own `.env`. Next allows one `next dev` per folder, so set
    `E2E_PORT` to that server's port (default 3000).
- When Playwright starts the server itself, it sets dummy env values: a fake
  `NEXT_PUBLIC_AUTH0_CLIENT_ID` (without one the login button throws), and
  `NEXT_PUBLIC_BACKEND_API=false` so a call that slips past the mocks goes to a
  local server, never to `dev.treemapper.app`. A reused dev server keeps its own
  values, so there the fail-on-unmocked check is the only guard.
- No retries locally, 2 in CI. Trace the first attempt and keep it only if it
  fails (`retain-on-first-failure`), and take a screenshot on failure. For a
  flaky test that keeps the failing run, not the retry that passed.
- Never wait for "network idle". The overview polls every 30s, so it never goes idle.

---

## Running locally and in CI

- **Locally:** first install the browser once with `yarn playwright install
  chromium` from `apps/web`. This installs full Chromium as well as the headless
  shell, so headed runs (`--headed`) and debugging (`--debug`, `--ui`) work.
  Then run `yarn test:e2e` from `apps/web`, or `yarn web:e2e` from the repo
  root.
  - Against a reused `next dev` server, add `--workers=1`. Dev mode compiles and
    hydrates slowly, and with 4 workers the auth tests can miss their 5s
    waits. `CI=1 E2E_PORT=3100 yarn test:e2e` runs the CI way instead (a
    production build on its own port) and is the fair check before a push.
  - The fixture hides Next's dev tools button (`nextjs-portal`). In dev it
    sits in the bottom-left corner, on top of the collapsed sidebar's account
    button.
- **Locally, Layer 2:**
  1. Create `apps/web/.env.e2e` with `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`
     for an Auth0 account that has a password. Check it by logging in by hand
     first: every wrong attempt counts toward Auth0's lockout.
  2. Point `apps/server/.env` `DATABASE_URL` at a local database, and set
     `NEXT_PUBLIC_BACKEND_API=false` in `apps/web/.env`.
  3. Start `apps/server` (port 3001) and the web dev server (`npm run dev` in
     `apps/web`). Playwright reuses the web server and never starts the API
     server; the setup fails with "Start apps/server first" if it is down.
  4. From `apps/web`: `E2E_FULLSTACK=1 npx playwright test --project=fullstack`.
     That runs the setup first, then the specs. The setup reuses the saved
     login while it is good (see [Layer 2](#what-exists-today-local-only));
     delete `apps/web/e2e/.auth/user.json` to force a new one.
     `deep-link.spec.ts` skips unless the account has a second project in the
     same workspace as its main project.
  - **VS Code Playwright extension:** it loads the config without
    `E2E_FULLSTACK`, so it does not show the Layer 2 tests. Add
    `"playwright.env": { "E2E_FULLSTACK": "1" }` to `.vscode/settings.json`
    (gitignored), reload, and tick `fullstack-setup` and `fullstack` under
    Projects.
  - Traces and screenshots of the specs (not the login) hold the real bearer
    token in every API request, and the test email. They stay in the
    gitignored `test-results/` and `playwright-report/`. Never attach them to a
    ticket, a PR or a chat.
- **CI (Layer 1):** `.github/workflows/e2e.yml`, on pull requests, pushes to
  `develop` and manual runs. A new commit cancels the older run of the same pull
  request; `develop` runs always finish.
  1. Node from `.nvmrc`, Yarn cache, `yarn install --frozen-lockfile
     --ignore-scripts`. No dependency runs code at install time, and none of
     their install scripts are needed for the web app.
  2. `yarn playwright install --with-deps --only-shell chromium`: the Chromium
     headless shell only, cached by Playwright version. CI runs headless and
     never debugs, so full Chromium is not needed. On a cache hit, the system
     libraries are still installed.
  3. `yarn test:e2e`. With `CI` set, the config builds the app and serves it with
     `next start`.
  4. Upload the report and traces on every run that was not cancelled, kept 14
     days. A test that passes on retry leaves the job green, so this is the
     only record of a flake, and the evidence for "two weeks of stable runs".

  Actions are pinned to commit SHAs. The token is read-only, and the workflow
  uses `pull_request`, never `pull_request_target`, so it is safe for forks.
- **CI (Layer 2):** not built, and `e2e.yml` does not run it: without
  `E2E_FULLSTACK` its projects do not exist. The plan is a PostGIS service
  container, run only on pushes to `develop` or nightly, because pull requests
  from forks get no secrets. Before that it also needs:
  - the seeded database, migrations and server env from
    [Layer 2](#layer-2-full-stack-a-few-smoke-tests);
  - a test user in that database that matches the Auth0 account;
  - an agreed policy for a real password as an Actions secret (open question 2);
  - **its own job, with no artifact upload.** Do not clean the artifacts
    instead: the secrets sit in action titles, action values, the network log,
    page snapshots and saved resources, and a cleaner that misses one fails
    silently. Report results as text (the `github` and `list` reporters), and
    debug a failure by rerunning it locally.

  These rules are not optional, because `e2e.yml` uploads `playwright-report/`
  and `test-results/` after every run, for 14 days, and anyone signed in to
  GitHub can download a public repo's artifacts:
  - **No Layer 2 in the existing job.** `playwright.config.ts` throws when `CI`
    and `E2E_FULLSTACK` are both set. The Layer 2 job opts out by also setting
    `E2E_FULLSTACK_CI_NO_ARTIFACTS=1`, which states that it uploads nothing.
  - **A dedicated CI Auth0 user**, with no real data and in no real project, so
    a leak does little harm. Not a developer's own test account.
  - **The login is never traced** (see
    [What exists today](#what-exists-today-local-only)). This already holds.
  - Layer 1 uploads stay as they are: the token is a fake unsigned JWT, the
    email is `example.com`, the data is made up, and Auth0 and all other hosts
    are stubbed or blocked.
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
5. Add one trivial test: `/login` renders. (Not kept on its own: the
   `auth.spec.ts` tests cover it.)

**Why:** prove the harness boots the app and blocks external hosts before any
real test depends on it.

### Phase 2: the most valuable tests

1. Write the five tests below, all Layer 1. Then carry on with the mocked
   flows in [e2e-user-flows.md](./e2e-user-flows.md), in its phase order (A
   to D). Tests 2 to 5 are part of its Phase A and of F10.
2. Add a `data-testid` only where role and label locators are unclear. So far
   none was needed: the sidebar account menu got `aria-label="Account menu"`
   instead, which also fixes what screen readers announce.
3. Decide how to handle tests that expose real bugs: fix first, or mark them
   `test.fail()` with a ticket. `auth.spec.ts` uses `test.fail()` for #1124,
   `landing.spec.ts` for #1142 and #1143.
   A `test.fail()` test passes on any failure, so keep it to the one check
   that shows the bug, and pair it with a normal test for everything else on
   that page.

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
   against the real API; **done locally**, ahead of its mocked version),
   onboarding, a site from GeoJSON, an intervention, and
   invite acceptance with two users.
   Write each one after its mocked version (F1, F10, F6, F4, F8 in
   `e2e-user-flows.md`), so the mocked test has already settled the locators.
3. **Role tests:** once the intended observer and contributor behaviour is
   agreed. F12 in `e2e-user-flows.md` lists what the code does today.
4. **Lower-level tests:** Vitest for validation and payload logic, and Supertest
   for server guards. This keeps the E2E suite small.
5. **More browsers:** Firefox and WebKit smoke tests, if needed.

---

## First five tests

All five use Layer 1.

### 1. A user with no session is sent to login, and the return path is kept

**Done** in `auth.spec.ts`, as two tests. The Auth0 stub answers the silent
login at once, so neither waits the 5s timeout.

**1a. No session**

- **Preconditions:** no token.
- **Steps:** open `/project/p_main/settings?tab=features`.
- **Assert:**
  - The URL is `/login?returnTo=%2Fproject%2Fp_main%2Fsettings%3Ftab%3Dfeatures`
    (path and query, URI-encoded; confirmed in `DashboardClientLayout`).
  - The app tried one silent login (`prompt=none`) first.
  - No token is stored.

**1b. Full login round trip**

The stubbed Auth0 is followed, not caught, so the app's own
`/api/auth/callback`, `/redirecting` and token exchange all run.

- **Steps:** open the same deep link, then click "Continue with email".
- **Assert:**
  - The test ends back on the deep link, logged in.
  - The `/authorize` request has:
    - `response_type=code`
    - `code_challenge_method=S256`
    - `audience=urn:plant-for-the-planet`
    - `scope=openid profile email`
    - `redirect_uri=<origin>/api/auth/callback`
    - a `state`
  - The token exchange sends a `code_verifier` whose SHA-256 matches the
    `code_challenge`. This is the check PKCE exists for.
  - The new token is stored and sent as the bearer token, and the PKCE verifier
    and `state` are cleared from `sessionStorage`.

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

**Done** in `landing.spec.ts`. It also checks that the main project's settings
are never fetched behind the p_second URL. Step 1 also has a Layer 2 version,
`fullstack/deep-link.spec.ts`, which runs the same checks on the test
account's real projects, plus the slug and the role in the sidebar.

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

**Done** in `landing.spec.ts`. Cases 1 and 2 are `test.fail()`: the page stays on
`/dashboard/...` and never redirects (#1142). Case 3 passes, because `/dashboard` itself
is a server redirect that does not need the stores.

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

More issues, found while planning the user flows, are listed per flow in
[e2e-user-flows.md](./e2e-user-flows.md#bugs-these-flows-are-expected-to-surface).

All issues below are confirmed in the code. #1124 (the first) and #1137
(the blank sidebar name) have been seen in a browser, and the legacy
`/dashboard/*` spinner is proven by a `test.fail()` test (2026-11-11).

- **A logged-in user who opens `/login` is not sent on** (#1124). `LoginContent`
  only redirects once the user profile is in the store, and only
  `DashboardClientLayout` loads it, which `/login` is not under. `auth.spec.ts`
  marks the redirect test `test.fail()`. Since `test.fail()` passes on any
  failure, a second, normal test covers the rest of the page: no crash, the
  token is kept, no silent login and no unmocked call. It passes both before
  and after the fix.
- **Login callback errors show no message.** The callback sets
  `error=authentication_failed` (`app/api/auth/callback/route.ts`), but
  `AuthInitializer` checks for `auth_failed`. `/login` shows nothing for
  `authentication_failed` or `no_code`. The fix will make `AuthInitializer`
  strip `error` and `reason` from the URL, so the callback tests check where
  the redirect went on the navigation response, not on the page URL.
- **The user type does not match the API.** The sidebar reads `firstName` and
  `lastName`, but `UserInterface` declares `firstname` and `lastname`. Test data
  sets the camelCase names the sidebar reads.
- **The sidebar shows a blank user name** when the user has no first or last
  name (#1137). **Seen in a browser** (Layer 2, 2026-11-05).
  `DashboardSidebar` builds the name from `firstName` and `lastName`, then
  falls back to `user.name`. The
  real `users/me` never sends `name`; it sends `displayName`, and
  `firstName` / `lastName` can be `null`. For the same reason the avatar
  initials, shown when the user has no image, fall back to "U". Likely fix: fall back to `displayName`.
  `fullstack/landing.spec.ts` skips the name check for such a user and adds a
  "known issue" annotation to the report; once fixed, it should check for
  `displayName` instead.
- **Legacy `/dashboard/*` links show a spinner forever on a cold load**
  (#1142).
  **Seen in a test** (`landing.spec.ts`, as `test.fail()`).
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
   That is what the local Layer 2 does today, with a personal test account.
   It works, but it depends on the login page's labels and on the account
   having a password.
2. **CI:** `e2e.yml` is now this repo's first workflow. Who owns it, and what
   is the policy on Actions secrets for a public repo?
3. **Known bugs:** should they be fixed before the tests land, or should the
   tests land as `test.fail()` with tickets? #1124 went the `test.fail()` way;
   #1137 has a ticket and a skipped check with a report note; the rest are
   still open.
4. **Roles:** what should observers and contributors see? Role tests need the
   intended behaviour first.
5. **Browsers:** which browsers do dashboard users use? There is no analytics
   to check.
6. **`dev.treemapper.app`:** is a nightly read-only smoke test there allowed?
7. **Test ids:** is it fine to add a few `data-testid` attributes to app code?

---

## Rules of thumb for writing tests

- **Imports:** import `test` and `expect` from `e2e/fixtures/test`, not from
  `@playwright/test`. That is how every spec gets the API, Auth0 and host
  guards.
- **Locators:** prefer `getByRole`, `getByLabel` and visible text. shadcn
  components carry useful roles and `data-slot` attributes. Add a `data-testid`
  only when those are unclear.
- **Waiting:** wait for elements or URLs, never for `networkidle`.
- **Mocks:** build responses with `ok()` and `fail()` from
  `helpers/envelope.ts`. They set `statusCode` in the body, and the mock sends
  the same value as the HTTP status. The newest handler wins, so a test can
  override a default from `mockSession`.
- **Maps:** do not check what is drawn on the map canvas. Check the controls
  and panels around it.
- **Invite links:** `POST /projects/:id/invites` returns the invite token in its
  response, so tests can accept an invite without reading email.
- **Committed artifacts:** never commit tokens, saved login state or real data.
