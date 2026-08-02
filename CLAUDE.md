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
- Jest cannot resolve the absolute `src/...` imports that some server files use
  (`projects.service.ts` and others): `rootDir` is `src` and there is no
  `moduleNameMapper`. Specs that only import leaf modules are fine, which is why
  the suite passes; the moment a spec imports a service that pulls in the DI
  graph it dies with "Cannot find module 'src/util/uidGenerator'". Workaround
  without touching the config:
  `npx jest <path> --moduleNameMapper '{"^src/(.*)$":"<rootDir>/$1"}'`.
- `npx eslint` reports hundreds of prettier errors on files nobody has touched
  (78-line `match-math.ts` gives 26), so a large error count on a file you just
  edited does not mean you introduced it. Compare against a neighbouring file
  before reacting, and do not run `--fix` on a file you only partly changed: it
  reformats the whole thing and buries the real diff.
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

Deliberately not built: unmatch (a `DELETE` plus the same derived write-back)
and any reconciliation job -- the absolute derived write-back is the
convergence mechanism. The TTC ignore endpoint is not project-scoped, so the
proxy cannot verify the contribution belongs to the project in the path.

## TreeMatch auto-match (server)

Rebuilt 2026-07-31 (migration 0007) on top of the write path above, not beside
it. `apps/server/src/treematch/automatch/`. Backend only so far; the web editor
(`RulesDialog.tsx`) is still parked and unimported.

Two tables, both pure additions. `treematch_rule` is the ordered per-project
rule list: `position`, `enabled`, `label`, and the whole rule body in a
`definition` jsonb. Jsonb rather than a column per field because the condition
catalogue keeps growing (see `docs/treematch-automatch-rules.md`) and the
database never queries inside it; the old table needed a migration and a CHECK
edit for every new condition. Saving replaces the whole list, so rows are
hard-deleted and reinserted at positions 0..n-1 and rule uids churn -- safe,
because nothing points at a rule row. No `deleted_at` and no `created_by_id` on
purpose. `treematch_automatch_run` holds one row per run with both the plan and
the outcome; the partial unique index on `(project_id) WHERE status IN
('planning','planned','applying')` is the concurrency guard and the "one open
plan per project" rule at once. `treematch_allocation` is untouched: no
`source` column and no run id, so rows a run wrote are indistinguishable from
hand-made ones.

**A run plans, then stops.** `POST .../automatch/runs` returns 202 with a run
uid and nothing has reached TTC; the client polls the run until its status
leaves `planning`, then `POST .../runs/:runUid/apply` writes. Apply is
literally `TreeMatchService.createMatches(...)` -- same advisory locks, same
lock order, same capacity check, same derived totals, same in-transaction TTC
PUT. Auto-match adds no second way to write an allocation, which is also why
`MAX_PLAN_PAIRS` is defined as `MAX_MATCH_PAIRS`: a plan is always appliable in
one request, so the all-or-nothing guarantee survives. A 409 on apply means
capacity moved; the run is marked failed and the user runs again.

The apply body may carry `pairs`, a subset of the stored plan, which is how the
review dialog drops links before writing. Only the (contributionId,
interventionUid) key is matched; **tree amounts always come from the stored
plan**, so the request can narrow the write but never widen it or change an
amount. An entry naming no stored pair is a 400 and the run goes back to
`planned` rather than losing the plan.

**`MAX_MATCH_PAIRS` is 2000, raised from 200 on 2026-08-02.** That was only safe
because the write path stopped issuing a round trip per pair: the advisory locks
are now one statement over `unnest($1::bigint[])` (ordered in-query, so the lock
order that prevents deadlocks is unchanged) and the allocation upsert is one
multi-row insert using `excluded.units`. Both were a loop before, so 2000 pairs
meant ~4000 sequential round trips with every row lock already held. Two things
are still unverified at this size: TTC's own request limit (nothing in the
contract states one) and how long the transaction holds locks while waiting on
that PUT. If matching starts timing out under load, this is the first place to
look.

> ⚠️ Passing a bare JS array into a drizzle `sql` template does **not** produce a
> Postgres array: it expands to a row constructor, `($1, $2, $3)`, so
> `unnest(${ids}::bigint[])` is invalid SQL and fails at runtime, not at
> compile time. Use `sql.param(ids)`, which binds the whole list as one
> parameter. Check any new raw `sql` with `new PgDialect().sqlToQuery(...)` or
> `.toSQL()` before trusting it.

**The sweep is bounded by local capacity, not by TTC.** Free trees are summed
locally first; if the total is zero the run finishes with an empty plan and
makes no TTC call at all. Otherwise it pages TTC only until the open donations
it has collected cover that capacity, with a **100-page ceiling per signature**
(10,000 donations, ~70s; raised from 20 on 2026-08-02).

Reading everything is still not on offer and cannot be: 172k contributions is
~1,720 pages, ~20 minutes, and every extra rule signature stacks another sweep.
What replaced the short cap is visibility and control -- the run row carries a
`progress` jsonb rewritten after every page (per-list page counts, donations
read, usable count), and `stop_requested` lets the user cut the sweep short and
plan with what it has. The flag is read between pages, so a stop lands within
about one page. Both are pure additions (migration 0008). A full sweep is not an option: 172k contributions at ~700ms per
serialized page is ~20 minutes, and each distinct `when.sweep` stacks on top.
Sweep direction defaults to `+paymentDate` (true FIFO); `scan: 'newest'` on the
run body is the escape hatch for a project whose oldest pages are all matched
already, where oldest-first would spend the whole page budget skipping them.
The single upstream ask that would make this cheap is an "unallocated only"
filter on TTC's contributions endpoint.

`automatch-planner.ts` is pure -- no DI, no DB, no clock (`now` is passed in) --
and covered by `automatch-planner.spec.ts`. Consumption state is shared across
rules, so a donation selected by two rules can never be spent twice. A rule with
`action: 'skip'` is the exclusion rule: it claims its donations and places
nothing. A preferred site that has been deleted makes the rule match nothing and
fall through rather than failing the run.

**`allocationPriority` is a rule condition, not a gate (changed 2026-08-02).**
Until then the planner refused any donation whose priority was not `automatic`
or `first`, an allowlist inherited from the original design so `manual` stayed
under human control. It was the wrong gate: **every** contribution sampled on
`app-development` came back `manual` (four projects, 100 each on 2026-07-31, and
a 371-donation individual sweep on 2026-08-02 in which not one was anything
else), so the allowlist excluded the entire backend and auto-match was
structurally unable to place anything. A run reading 371 donations that manual
matching happily lists is the symptom.

It is now an ordinary entry in `RULE_FILTER_FIELDS`, so a project that wants the
old behaviour writes it as a rule: an exclusion rule with
`{ field: 'allocationPriority', op: 'eq', value: 'manual' }` and `action: 'skip'`
holds those donations back from every later rule including the catch-all. The
value is deliberately **not** validated against TTC's three known values -- that
narrowing is exactly the mistake the allowlist made, and a priority TTC adds
later must not break a stored rule or a running plan.

Consequence worth stating plainly: auto-match will now consume `manual`
donations, and **there is no unmatch route**, so a wrong plan cannot be undone
in the app. The plan review dialog is the only stop before the write.

**Not on a queue, on purpose.** Bull is installed but its only processor
(`analytics`) is commented out, the Redis config is wired through one module,
and local dev has no Redis and no `REDIS_URL`. Planning runs in-process as a
floating promise; the run row is the coordination point. A crashed process
leaves a stale row that the next run takes over (`planning` after 5 min,
`applying` after 10, `planned` after its `expires_at`).

**A run narrates itself in the server log.** Every line is prefixed with the run
uid (`[tmar_...]`), because planning is async and runs from different projects
interleave. The default level is the whole story, about a dozen lines: the rules
it loaded, local capacity, one line per TTC list swept (pages, donations, open
trees, why it stopped), one line per rule, and the outcome. An empty plan always
ends in a `warn` that names the reason. `filteredOut` also prints the priority
histogram, because a rule filtering on `allocationPriority` is the easiest way
to reject everything by accident and is invisible otherwise.

The reason counting lives in the planner, not the service: `planAutomatch`
returns a `diagnostics` block (per-rule drop counts by reason, priority
histogram, capacity) because the planner is pure and cannot log. Nothing reads
`diagnostics` to make a decision, so adding to it is always safe.

**The sweep reports every page at the default level**, with its own timing and a
running "collected / target". It looks noisy for a phase that is mostly waiting,
and that is the point: the sweep is the slow part (TTC serializes pages at
~0.7s, and a list runs to 20 of them), so two lists means half a minute in which
a quieter log shows nothing at all and the run reads as frozen. Putting these
behind a flag was the first version and it was wrong.

Set `TREEMATCH_AUTOMATCH_DEBUG=true` in `apps/server/.env` for the extra tier: a
per-page `allocationPriority` histogram, which shows the spread at source rather
than only in the summary.

A project can have more free trees than any sweep could ever cover (816 has 7.6M
across 1760 locations). `wantedCenti` is then unreachable, so every list burns
its full 20-page budget and the run always costs the worst case. The page-cap
warn fires for each list; it is a design limit, not a fault.

**An empty plan carries a reason code.** `TreematchAutomatchPlan.empty` is set
whenever a run places nothing: a `reason` from `TreematchAutomatchEmptyReason`
plus the counts behind it. A code, not a sentence, because the server log and
the review dialog word it for different readers -- `describeEmptyReason` for the
log, `explainEmpty` in `AutomatchPlanDialog.tsx` for the user, where each reason
also carries what to do next. No migration was needed: `plan` is jsonb, which is
the point of storing it that way.

There is no sweep cursor. A run always starts at page 1, oldest first, so
**re-running reads exactly the same donations** -- TTC has no "unallocated only"
filter, so matching or ignoring what it found does not move the window either.
The truncation notice in the dialog used to promise a re-run would "pick up
where the free trees run out", which was never true. Only `scan: 'newest'` reads
different pages, and the web client never sends it.

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
- **Auto-match is live again** (2026-07-31). An "Auto-match" button in the
  shared top bar opens `RulesDialog.tsx`; running it opens
  `AutomatchPlanDialog.tsx`, which is deliberately built like
  `MatchConfirmDialog` because applying a plan is the same write. The button
  reads "Review plan" instead when a run is left open, since a planned run holds
  the project's only run slot until it is applied or discarded. The rule types
  moved from `RulesDialog.tsx` into `types.ts` now that they describe live API.
  - **The rules dialog can be closed while a run is planning.** Planning is
    server-side and took 60s on the 172k-donation project, so trapping the user
    behind a spinner is wrong; the page keeps polling and opens the plan when it
    is ready. Only a save holds the dialog.
  - **The plan list is editable before it is applied.** `AutomatchPlanDialog`
    keeps a set of removed pair keys (keyed, not indexed, so it survives
    re-ordering) and sends only what is left. Removing a whole donation takes
    all of its links, because one donation can be split across locations. The
    per-rule breakdown is deliberately *not* adjusted by removals: it describes
    what the planner decided, not what the user kept.
  - **Progress while reading is a component, not a spinner.**
    `AutomatchProgressPanel` draws a bar per donation list from the run's
    `progress` field, which the existing 1.5s poll already fetches. The elapsed
    counter ticks locally, because progress only moves when a page lands (~0.7s)
    and a frozen counter reads as a stall.
  - **The editor writes at most one condition per rule**, though the API accepts
    ten. A deeper editor needs no server change.
  - A rule's preferred site must belong to the *donations'* project, not the
    left pane's: auto-match fills this project's locations only, while the left
    pane can be pointed at another project. `ruleSites` is fetched separately
    for that reason; do not reuse `sites`.
  - **Every success arrives as envelope `statusCode: 200`**, whatever the HTTP
    code. `POST .../automatch/runs` answers 202 on the wire but 200 in the body
    (`ResponseInterceptor`), and only failures carry the real code. Check for
    200, not 202.
  - Refs that stop background work must be set true on mount, not only cleared
    on unmount: StrictMode's mount/cleanup/mount left the run poller's
    `pollAlive` false for the whole session and every poll gave up silently.
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
