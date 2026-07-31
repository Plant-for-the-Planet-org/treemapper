# CLAUDE.md

Project guidance for Claude Code. Keep this file accurate; update it when you
learn something non-obvious about how this codebase actually works.

## How to update this file

When you discover something during a session that future Claude sessions
should know -- a convention, a gotcha, a non-obvious build step, a
deprecated path, a place where the obvious approach is wrong -- add or
revise an entry below. Surface the suggested update to the user before
committing.

Do **not** record:
- Things obvious from reading the code
- Temporary task state (use plans/tasks instead)
- Secrets, env values, or credentials

## Project overview

TreeMapper is one of many Plant-for-the-Planet products on the
ForestCloud platform. It is used to record interventions (planting,
restoration, and other field activities) and the trees associated
with them.

Monorepo managed with **Turborepo** + **Yarn 1 workspaces**.

> ⚠️ **This repo is public / open source.** Every commit, file, and PR is
> visible to the world. Never commit secrets, credentials, internal URLs,
> customer data, or anything that would be embarrassing or exploitable if
> read by a stranger. When in doubt, ask before committing.

## Structure

```
apps/
  mobile/    React Native + Expo app (independent, no shared code with web/server)
  web/       Next.js dashboard (uses shared-core, shadcn/ui)
  server/    NestJS + Fastify backend (Drizzle ORM + Postgres)
packages/
  shared-core/  Shared utilities consumed by web (and potentially mobile)
```

## Stack per app

- **mobile**: Expo SDK, React Native 0.83.6, Maplibre, Auth0
- **web**: Next.js 15, React 18, shadcn/ui, Tailwind, Mapbox, Auth0 (@auth0/nextjs-auth0 v3.8)
- **server**: NestJS 11, Fastify, Drizzle ORM, Postgres (`pg`), Redis (ioredis), Bull, AWS S3 / R2
- **shared-core**: TanStack Query, Zustand

## Common commands

Run from repo root unless noted.

```bash
yarn web:dev        # Next.js dev server
yarn server:dev     # NestJS watch mode
yarn native:dev     # Expo dev server (mobile)
yarn dev:fullstack  # Web + server concurrently

yarn build          # Turbo build all
yarn type-check     # Turbo type-check all
yarn lint           # Turbo lint all

# Server-specific (from apps/server)
yarn db:generate    # Drizzle migration generation
yarn db:migrate     # Apply migrations
yarn db:studio      # Drizzle Studio
```

## Conventions

- **Design system**: shadcn/ui. Keep UI clean. Avoid em dashes in user-facing text.
- **English**: prefer simple English, shorter words in copy.
- **Naming**: the organization is "Plant-for-the-Planet". The platform is "ForestCloud".
- **Mobile is independent**: `apps/mobile` does not import from `shared-core`, `web`, or `server`. Treat it as a separate project that happens to live in the same repo.

## Dependency pinning

All dependencies are pinned to **exact** versions on purpose: supply-chain
safety and byte-for-byte reproducible installs. A plain `yarn install` never
auto-upgrades anything.

- **Manifests**: every `package.json` uses exact versions (no `^`). The
  exceptions are `expo-*` / React Native packages in `apps/mobile`, which keep
  `~` (patch-only) so Expo tooling (`expo install`, `expo-doctor`) stays happy.
  Root `overrides` / `resolutions` are pinned exact too.
- **New deps must stay pinned**: root `.yarnrc` sets `save-prefix ""` and
  `.npmrc` sets `save-exact=true`, so `yarn add` / `npm install` write exact
  versions. Do not reintroduce `^`.
- **Lockfile is the real freeze**: `yarn.lock` is committed; CI/build uses
  `yarn install --frozen-lockfile`, which fails if the lock would change.
- **Pre-commit guard**: `.githooks/pre-commit` blocks any commit that touches a
  dependency file (`package.json`, `yarn.lock`, `.yarnrc`, `.npmrc`) and prints
  a "rethink before upgrading" notice. It is auto-enabled for everyone via the
  root `prepare` script (`git config core.hooksPath .githooks`), which runs on
  `yarn install`. To land an intended dependency change, re-run with
  `ALLOW_DEP_CHANGE=1 git commit ...` (never `--no-verify`).
- **To upgrade a package**: do it deliberately (`yarn upgrade <pkg>` or edit the
  exact version), keep it pinned, review for breaking/vulnerable versions, and
  tell the team.

## Gotchas

- `yarn.lock` is large (~21k lines, ~1000 packages) mostly because the mobile workspace pulls Expo/RN + transitive deps.
- The web app inlines `NEXT_PUBLIC_*` env vars at build time. Changing them requires a rebuild.
- The server uses Fastify, not Express. Some Nest examples assume Express -- adapt accordingly.
- `engines.node` is pinned to `22.x`. On a machine running a newer Node, every
  `yarn <script>` in `apps/server` aborts with "The engine node is incompatible"
  before the script runs. Call the tool directly instead (`npx jest`,
  `npx tsc --noEmit`, `npx drizzle-kit generate|migrate`, `npx nest start`).
- `drizzle.config.ts` reads `DATABASE_URL` (not the `DB_*` vars), and in this
  repo's `.env` it points at a **shared staging** database, not localhost. Check
  where it aims before running `drizzle-kit migrate`.
- `drizzle-kit generate` prompts interactively when a table keeps its name but
  its columns change (it cannot tell a rename from a drop-plus-add), and the
  prompt cannot be answered without a TTY. To replace a table cleanly, generate
  two migrations: remove it from the schema and generate the drop, then add the
  new definition and generate the create.

## Running the web app for preview

Run the web dev server **from `apps/web`, not the repo root**:
`cd apps/web && npm run dev`. The `.claude/launch.json` "web" config does exactly
this. Running it from root (e.g. `yarn web:dev` via turbo) is wrong: it writes a
`.next` build that then breaks a later `apps/web` run with
`MODULE_UNPARSABLE: next/document.js` and other stale-cache weirdness. If the
preview misbehaves after a bad run, delete `apps/web/.next` and restart clean.

The web app talks to the hosted dev backend (`dev.treemapper.app`) when
`NEXT_PUBLIC_BACKEND_API=true` is set in `apps/web/.env` (see `.env.example`) --
this is the rewrite target in `next.config.ts`. Without it, `/api/server/*`
rewrites to a local server on `SERVER_PORT` (default 3001), and every API call
500s if that server isn't running. Since it's a `NEXT_PUBLIC_*` var, changing it
requires restarting the dev server, not just a reload.

The TreeMatch screens load real data through the local server
(`/api/treematch/projects/:uid/...`), so previewing them needs `apps/server`
running on :3001 (the `mobile` app is never needed). The donations pane proxies
the TTC contributions API: the server reads `TREEMATCH_TTC_URL` +
`TREEMATCH_TTC_API_KEY` (falling back to `OLD_BACKEND_URL` + `API_KEY`), and
review-app TTC deploys (`*.startplanting.org`) may additionally need a
Cloudflare Access service token in `TREEMATCH_TTC_CF_CLIENT_ID` /
`TREEMATCH_TTC_CF_CLIENT_SECRET` -- when the edge is gated, it returns a 403
HTML page before the API is ever reached. If the donation backend is unreachable the pane
shows an error banner; the plant-locations pane still works from the local DB.

## TreeMatch server architecture

Rewritten 2026-07-30 (migrations 0008 + 0009) against the 2026-07-28 TTC
contract. **Ownership is the whole design**: TTC owns contributions, their
absolute `unitsAllocated` totals, and the `ignored` / `ignoreReason` flags.
TreeMapper owns trees and interventions. Nothing from TTC is mirrored here.

One table, `treematch_allocation`: one row per (`ttc_contribution_id`,
`intervention_id`) pair holding `units` in centi-units (100 = 1 tree, TTC's
scale; convert only at the API boundary, via `treematch/match-math.ts`). No FK
on the contribution id -- there is nothing local to point at. No `project_id`
(join `intervention`), no `created_by_id`, no `deleted_at`: there is no
allocation history and no audit trail by design. It exists for one reason, so
TreeMapper knows how many of its own trees are already claimed.

Four routes, all owner/admin: `GET .../interventions`, `GET .../contributions`
(thin TTC proxy, passes `ignored` through), `POST .../matches`,
`PATCH .../contributions/:contributionId/ignore` (proxy of the TTC endpoint).

`POST .../matches` takes pairs only -- `{ matches: [{ contributionId,
interventionUid, trees }] }`. It never receives absolute totals: the server
derives each contribution's new total as `SUM(units)` over its own rows, so the
client cannot be stale and there is no 409 staleness check. One transaction:
`pg_advisory_xact_lock` per contribution (ascending) -> `SELECT ... FOR UPDATE`
on the locations (ascending; same eligibility rule as the read, so a plot or an
incomplete capture is a 404) -> capacity check against `total_tree_count * 100`
-> upsert the pairs -> derive the totals -> TTC `PUT`. The TTC call is inside the
transaction on purpose: any failure rolls the whole thing back, so TreeMapper
never claims trees TTC has not accepted, and that removes all sync state, pending
rows and compensation logic.

**Cross-project matching is allowed**: TTC only cares that a contribution's total
is right, not which project holds the trees, so the locations in a `POST
.../matches` body may live in any project. The route guard only proves
owner/admin on the project in the path (the contributions side), so
`TreeMatchService.authorizeSourceProjects` checks every other project the target
locations belong to, using the same resolution the guard uses (`project_member`,
then the workspace-admin fallback). It runs *before* the transaction on purpose:
those lookups need their own pool connection, and taking one while holding the
row locks could starve the pool. The in-transaction filter then trusts only that
pre-authorized set, so a soft-deleted project's locations read as not found.

**TTC serializes the contributions endpoint**, so plan reads around it. Measured
against `app-development.plant-for-the-planet.org`: ~700ms sequentially, and four
concurrent requests complete in ~450ms steps for a 2.7s wall time. Separate curl
processes on separate TCP connections queue the same way, so this is upstream,
not our axios agent, the Nest server or the Next dev rewrite (the interventions
route, which is local Postgres, stays at 20-60ms while interleaved with it). The
practical rule: extra contributions calls do not overlap, they stack, so call
count multiplies latency roughly linearly. Anything that fans out over pages is
not viable here, and a short-TTL server-side cache is the obvious next lever if
this endpoint gets busier.

Deliberately not built: unmatch (a `DELETE` plus the same derived write-back),
auto-match and rules (removed from the backend; to be reintroduced), and any
reconciliation job -- the absolute derived write-back is the convergence
mechanism. The TTC ignore endpoint is not project-scoped, so the proxy cannot
verify the contribution belongs to the project in the path.

## TreeMatch client (apps/web)

Updated 2026-07-30 for the rewrite above. `apps/web/src/app/(dashboard)/project/
[projectUid]/treematch/` plus `overview/component/GlobalMap.tsx` and the
ForestCloud tab of `settings/page.tsx`. Plain `useState` + the shared fetchers,
no TanStack Query on this screen.

- **Ignored donations are a second server view**, not a client filter: the tab
  fetches `?ignored=true` with its own pagination, and the default view never
  contains ignored rows. It is loaded when the tab is first opened, never on
  mount, because every contributions call is a serialized ~700ms TTC round trip
  (see the server section) and an eager fetch doubled time-to-first-paint for a
  pane nobody was looking at. The tab therefore shows no count until it has been
  opened once. Ignoring drops the row from the list it leaves and marks the list
  it joins stale; that one reloads on the next visit, not immediately.
- **Only three of the five donation filters are server-side.** Sort, donor type
  and country map to TTC parameters and cover the whole project. The donation
  reference search and the match-state filter are client-side over the loaded
  pages *only*, because TTC's contributions endpoint has no reference search and
  no allocation-state filter. This is a real limitation, not a stopgap that can
  be closed locally: fetching every page to filter properly is impossible at
  scale (one project has 172k contributions, and TTC serves ~1 page per 700ms
  serialized). The UI states the scope inline and the empty state distinguishes
  "no match in what is loaded" from "nothing here"; fixing it for real needs a
  TTC-side `search` plus allocation-state filter.
- **`donation.amount` is in minor units** (100 = one euro/dollar/peso), the same
  hundredths scale as `units`, despite reading like a plain amount. Render it
  through `toMajorAmount` in `component/types.ts`, never raw. Getting this wrong
  showed a €14,013 donation as €1,401,300. Every currency seen on this endpoint
  (EUR, USD, GBP, CHF, MXN, PLN, CZK, RUB, AED) has two decimals; a zero-decimal
  currency such as JPY would need TTC's scale confirmed first.
- **Requests are deduplicated by key while in flight** (`inFlight` ref in
  `page.tsx`). React StrictMode double-invokes every mount effect in dev, and
  each duplicate costs another serialized TTC round trip. Refetches that follow
  a write pass `force = true` so they are never swallowed.
- **The match write sends pairs only** and takes the response's `applied` map
  (TTC's accepted absolute totals) as truth for the donation side. The location
  side has no per-location number in the response, so it is bumped optimistically
  and corrected by the next fetch. A 409 means a location no longer has that many
  trees free (refetch the left pane); anything else came from TTC (refetch the
  right). `MAX_MATCH_PAIRS` (200) is enforced in the confirm dialog rather than
  split across requests, which would give up the all-or-nothing guarantee.
- **Auto-match and rules are hidden, not deleted.** `RulesDialog.tsx` stays on
  disk, unimported and self-contained (it carries its own rule types, since
  `types.ts` describes only the live API), and the three fetchers are commented
  out in `api.fetch.ts`. Restoring them also needs `putUrlApi.treematchRules`
  back in `api.url.ts`.
- Gone from the UI, all of it data the API does not have: the donation
  `status` (public/private) badge, the `allocationPriority` chip (an auto-match
  concept), the `blocked` and `legacy` intervention badges plus the map's
  "Blocked" legend entry, the plant-location private badge and the
  public/private filter, and the overview map's "supporting donations" list
  (donation refs live only in TTC and there is no per-intervention donor read).
- `treematchStore` is deleted. The TreeMatch page no longer has an on/off gate;
  the ForestCloud settings toggle is local state until a real per-project flag
  exists on the server.
- Unit numbers can be fractional (TTC works in hundredths), so tree quantities
  render through `fmtTrees` (decimals only when there are any) and counts
  through `fmtNum`.

## Token injection (previewing the authed app)

The web dashboard is auth-gated behind Auth0. A normal `npm run dev` login works,
but **Claude Code's preview browser cannot complete the Auth0 redirect flow**, so
authed pages bounce to login.

"Inject the token" (in this repo) means: seed a bearer token into the preview
browser so the app behaves as if the user is logged in. `localStorage.access_token`
is the only thing that gates "logged in" -- `AuthInitializer` reads it via
`getValidStoredToken()`, puts it in the Zustand auth store, and every backend call
then sends `Authorization: Bearer <token>`
(`packages/shared-core/fetchApi/customFetch.ts`). Seeding that one key = logged in.

Workflow when previewing an authed page:

1. Check auth in the preview (is `localStorage.access_token` empty / is the page
   on login?).
2. If auth is empty **and** `BEARER_TOKEN` is set in `apps/web/.env`: tell the
   user you are injecting the token, then in the preview run
   `localStorage.setItem('access_token', '<token from .env>')` and reload.
3. If auth is empty **and** `BEARER_TOKEN` is not in `apps/web/.env`: ask the user
   to add a valid `BEARER_TOKEN` to `apps/web/.env` (do not invent one). This is
   a Claude-preview-only convenience -- `BEARER_TOKEN` is not a normal dev
   dependency and is intentionally left out of `apps/web/.env.example`.
4. If auth is already present, do nothing.

`BEARER_TOKEN` is a valid Auth0 access token for the backend -- never commit it,
never print it in chat. No app or auth code changes; the token only lives in the
browser session. Do **not** commit an in-app token seeder or a route that serves
the token -- injection is a preview-time action only.

## What NOT to do

- Do not commit secrets or `.env` files.
- Do not share live customer or production data in chat.
- Do not use `--no-verify` to bypass hooks.
- Do not commit unless explicitly asked.
- Do not remove `TODO` comments without asking first -- they mark known gaps that need future work.
- Do not remove commented-out code that describes a planned or stubbed feature extension without asking first -- it carries intent that may not be obvious from context.
