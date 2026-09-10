# CLAUDE.md

Project guidance for Claude Code. Keep this file accurate; update it when you
learn something non-obvious about how this codebase actually works.

## How to update this file

When you discover something during a session that future Claude sessions
should know -- a convention, a gotcha, a non-obvious build step, a
deprecated path, a place where the obvious approach is wrong -- add or
revise an entry below. Surface the suggested update to the user before
committing.

**This file is published with the repo.** Write it for a stranger reading it on
GitHub, not for an internal wiki.

Do **not** record:
- Things obvious from reading the code
- Temporary task state (use plans/tasks instead)
- Secrets, env values, or credentials
- The contents of a private `.env`, including a bare list of its key names --
  that is a map of the credential surface. Point at `.env.example` or say "ask
  a teammate" instead. `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` names are fine: they
  ship in the client bundle already.
- Security incident history: which secret was exposed, where it surfaced, or
  for how long. Record the forward-looking rule ("never log these headers")
  and leave the incident out.
- Internal hostnames, dashboards, log drains, or account and app identifiers
  that are not already in the committed code.

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
  shared-core/  Shared utilities consumed by web only
```

Inside `shared-core`, only `fetchApi/`, `store/`, `types/` and two files in
`utils/` are live. The parallel `api/` layer (`client.ts`, `queries.ts`,
`mutations.ts`, `endpoints.ts`) has **zero importers** and is dead; so are
`utils/error-handler.ts`, `reportHelper.ts`, `sortProjects.ts` and `auth.ts`.
`index.ts` is `export {}` -- everything is imported by subpath through the
`@shared-core/*` alias.

## Stack per app

- **mobile**: Expo SDK 55, React Native 0.83.6, React 19, Maplibre
  (`@maplibre/maplibre-react-native`), Auth0 (`react-native-auth0`), Realm for
  local storage, Redux Toolkit for state
- **web**: Next.js 16 (App Router), React 19, shadcn/ui on Radix, Tailwind 4,
  Maplibre (`maplibre-gl` + `react-map-gl`), recharts, Zustand
- **server**: NestJS 11, Fastify, Drizzle ORM, Postgres (`pg`), in-memory cache (cache-manager), AWS S3 / R2
- **shared-core**: Zustand stores, fetch helpers (`fetchApi`), shared types and
  utils. No data-fetching library: calls are plain `fetch` wrappers.

Two things here are easy to assume wrong:

- **Web auth is hand-rolled, not an SDK.** There is no `@auth0/nextjs-auth0`
  and no `middleware.ts`. The browser runs the Auth0 PKCE flow itself
  (`src/lib/auth/`), and the token lives in a Zustand store
  (`src/stores/auth-store.ts`) mirrored into `localStorage.access_token` --
  not in a server session. `AuthInitializer` (root layout) restores it, tries
  silent auth in a hidden iframe, or exchanges a `?code=`.
  `src/context/useTokenContext.tsx` is still there and widely imported, but it
  is only a provider fed from that store; `src/hooks/useAccessToken.ts` is a
  compat shim over the same store.
- **Both apps use Maplibre, not Mapbox.**

## Domain model

One Postgres schema file, `apps/server/src/database/schema/index.ts` (~2200
lines, 35 tables, 36 enums), is the source of truth. Migrations live in
`apps/server/drizzle/migrations` (currently 0000-0008; `0008_mushy_blue_blade`
adds the `user_device` telemetry columns).

The spine is **workspace -> project -> site -> intervention -> tree ->
tree_record**:

- **workspace** (`type`: platform / private / development / premium) holds
  projects and a `settings` jsonb (approval defaults, visibility, notification
  toggles). `workspace_member` roles are owner / admin / member.
- **project** belongs to one workspace and can move between them, which is why
  web URLs are `/project/:projectUid/...` and never nest the workspace.
  `project_member` roles are owner / admin / contributor / observer, plus
  `extraPermissions` (a granular array: `approve_intervention`,
  `approve_site`, `add_site`, `request_species`, `manage_form`) and per-member
  `siteAccess` / `restrictedSites`.
- **intervention** is the central record: 21 `type` values, a `discriminator`
  of `'intervention' | 'plot'` (monitoring plots are interventions with
  `discriminator = 'plot'` plus a `monitoring_plot` row), `captureMode`,
  `captureStatus`, a PostGIS `location`, and `totalTreeCount`. Species come
  through `intervention_species`; individual trees hang off `tree`
  (`treeType`: single / sample / plot) with measurement history in
  `tree_record`.
- **Approval board.** `project.approvalBoardEnabled` plus an
  `approvalSettings` jsonb gates interventions per **source**
  (`web` / `bulk` / `mobile`; `migration` is never gated) and sites by one
  toggle. Anything gated gets a `reviewStatus`, and everything user-facing
  filters on *published* = `reviewStatus IS NULL OR 'approved'`
  (`publishedInterventionFilter` / `publishedSiteFilter` in
  `approval-board/approval.util.ts`). `review_thread` / `review_comment` carry
  the conversation.
- **form** stores a whole builder tree in one `schema` jsonb, targeted by site
  (`all` / `none` / `specific`) and intervention type. The types mirror
  `apps/web/src/forms/types.ts` 1:1, and mobile renders them
  (`components/projectForm/FormFieldRenderer.tsx`).
- **Soft delete everywhere.** Almost every table has `deletedAt`; every read
  must filter `deleted_at IS NULL` (`database/soft-delete.ts` has
  `notDeleted()`). Uids are prefixed random ids from `util/uidGenerator.ts`;
  `hid` is a short human id from `util/hidGenerator.ts`.
- Capability rules per intervention type (allows species, requires tree
  registration, expected GeoJSON type) live in **code**, not a table:
  `database/schema/interventionConfig.ts`.

## Server surface

Global prefix `/api`. Every route is behind a global `JwtAuthGuard` unless
marked `@Public()`. Responses are wrapped by `ResponseInterceptor` into
`{ statusCode, message, error, data, code }` -- and **success is always
`statusCode: 200` in the body**, whatever the HTTP code. Errors keep the real
code and a stable `code` string (`HttpExceptionFilter`).

Auth is Auth0 RS256 verified against JWKS (`auth/jwt.strategy.ts`). It reads a
namespaced email claim, falls back to the standard one, accepts Apple's string
`"true"` for `email_verified`, and links or creates the local user by verified
email -- so the same person signing in through a different Auth0 connection
claims the same row.

Access checks, in the order you will meet them:

- `ProjectPermissionsGuard` + `@ProjectRoles(...)` on almost every
  project-scoped route. It resolves the project id from params, then body, then
  query, and **falls back to the workspace**: a workspace owner/admin with no
  `project_member` row is handed a synthesized `role: 'admin'` membership
  stamped `viaWorkspaceAdmin: true`.
- `TreeMatchAccessGuard` rejects exactly that synthesized case (see TreeMatch
  below). Guard order in `@UseGuards` is load-bearing.
- `WorkspaceMemberGuard` / `WorkspacePermissionsGuard`, `SuperAdminGuard`
  (`user.type === 'superadmin'`), `ApprovalDecisionGuard`,
  `WorkspaceSpeciesApprovalGuard`, `ImpersonationGuard`.
- **Impersonation** is a cache entry keyed to the admin's auth0Id with a 30-min
  TTL; `jwt.strategy.ts` swaps in the target's full identity. It is
  full-access and deliberately not scoped to the initiator's workspace (see
  the long NOTE in `auth/impersonation.guard.ts`). Web logout always exits it
  first.

Two separate public surfaces, easy to confuse:

- `/api/external/*` -- **no auth at all**, `@Public()`, IP-rate-limited to
  30/min, CORS `*`, and deliberately **not** wrapped in the response envelope.
  Returns legacy-shaped intervention data for a project.
- `/api/v1/public/*` -- per-project API key in `x-api-key`
  (sha256-hashed in `project_api_key`, one live key per project), additionally
  gated by `project.apiEnabled`. Envelope applies.

Other integration points: **R2/S3** presigned uploads (`common/services/r2.service.ts`,
raster mime types only, SVG deliberately excluded), **OneSignal** push targeted
by the `onesignal_id` alias on `user_device`, **SMTP/nodemailer** for invites,
and the **TTC** (old Plant-for-the-Planet backend) for site sync and TreeMatch
contributions. Rate limiting and caching are **in-memory per dyno** -- put
Cloudflare in front for a real ceiling.

## Common commands

Run from repo root unless noted. **Run `nvm use` first** (`.nvmrc` says 22):
the root and `apps/server` manifests pin `engines.node` to 22.x, and yarn 1
refuses *every* script under a newer Node with "The engine node is
incompatible". See the engines gotcha below for the no-nvm workaround.

```bash
yarn web:dev        # Next.js dev server
yarn server:dev     # NestJS watch mode
yarn native:dev     # Expo dev server (mobile)
yarn dev:fullstack  # Web + server concurrently

yarn build          # Turbo build (web + server only; mobile and shared-core
                    # define no build task)
yarn lint           # Turbo lint all -- note apps/server's lint runs --fix
yarn test           # Turbo test (only apps/server has tests)
yarn check:pins     # Validate exact pins + lock coverage in every workspace

# Server-specific (from apps/server)
yarn db:generate    # Drizzle migration generation (drizzle-kit)
yarn db:migrate     # Apply migrations (ts-node src/database/migrate.ts, not
                    # drizzle-kit; reads the same DATABASE_URL)
yarn db:studio      # Drizzle Studio
```

`yarn type-check` exists in the root manifest but **runs nothing**: no
workspace defines a `type-check` script, so turbo reports four
`<NONEXISTENT>` tasks and exits 0. Use `npx tsc --noEmit` in the workspace you
touched. `apps/web` also sets `typescript.ignoreBuildErrors: true`, so
`next build` does not check types either.

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

- **Yarn workspaces do not hoist everything to the root `node_modules`.**
  Packages that conflict with another workspace's version stay in
  `apps/*/node_modules`, and yarn 1 sometimes nests one even with no conflict.
  Today that includes the `next` and `nest` binaries plus `i18next` and
  `react-i18next`. The Docker build must copy `apps/web/node_modules` and
  `apps/server/node_modules` alongside the root tree, or the build fails with
  `Module not found: Can't resolve 'i18next'`. This only shows up on Heroku,
  never locally, because a local build context already has `node_modules` on
  disk. Run `ls apps/*/node_modules` after an install to see what is nested;
  the set changes whenever the lockfile is regenerated.
- `yarn.lock` is large (~21k lines, ~1000 packages) mostly because the mobile workspace pulls Expo/RN + transitive deps.
- The web app inlines `NEXT_PUBLIC_*` env vars at build time. Changing them requires a rebuild.
- The server uses Fastify, not Express. Some Nest examples assume Express -- adapt accordingly.
- **Recharts needs a pixel height.** Give `ResponsiveContainer` a number
  (`height={210}`), never `height="100%"`. Recharts 3 starts at height `-1` and
  only learns a percentage after its ResizeObserver fires, so `"100%"` logs a
  "width(-1) and height(-1)" warning on every first render. Set the height on
  the chart, not on a wrapper div, so it lives in one place.
- **Mobile sharing only works from the cache dir.** `react-native-share` 12.x
  dropped the catch-all `<root-path>` from its FileProvider config
  (`share_download_paths.xml`), leaving only `cache-path` as a usable root on
  Android. A `data:` base64 url lands in the *external* cache dir, and the
  document dir has no root at all, so in both cases `ShareFile.getURI()`
  returns null and `ClipData.newUri` throws `Uri.getScheme() on a null object
  reference`. iOS is unaffected, so this looks Android-only. Write the file to
  `Paths.cache` and share `file.uri`. Use `shareJSONFile` in
  `src/utils/helpers/fileManagementHelper.ts`. Never pass `'data:...'` to
  `Share.open`.
- **Head tags belong in `metadata`, not in `<head>`.** `src/app/layout.tsx`
  exports a Next `Metadata` object; hand-written `<meta>` tags there duplicate
  or contradict what Next emits. Next 16 maps `appleWebApp.capable` to the
  standard `mobile-web-app-capable`, so writing the old
  `apple-mobile-web-app-capable` by hand just brings back a Chrome deprecation
  warning. The manifest (`src/app/manifest.ts`) and favicon
  (`src/app/favicon.ico`) come from file conventions -- do not also list them
  in `metadata`.

- **A stale autolinking cache breaks the Android build after a package
  rename.** If `:app:compileDebugJavaWithJavac` fails with `package
  com.<something> does not exist` pointing at the generated
  `ReactNativeApplicationEntryPoint.java`, the culprit is
  `apps/mobile/android/build/generated/autolinking/autolinking.json`. RNGP's
  `GenerateEntryPointTask` stamps `project.android.packageName` from that file
  into `{{packageName}}.BuildConfig`, and the file can capture a package name
  from mid-prebuild rather than the final `namespace` in
  `android/app/build.gradle`. It then never refreshes:
  `ReactSettingsExtension.autolinkLibrariesFromCommand` regenerates it only when
  `yarn.lock`, `package-lock.json`, `package.json`, or `react-native.config.js`
  change (their SHAs sit next to it), and the Android namespace is not an input.
  `expo prebuild --clean` does not help, because the bad file is rewritten
  during prebuild. Fix with `rm -rf android/build/generated/autolinking
  android/app/build/generated/autolinking`, then rebuild.
- `engines.node` is pinned in **both** the root manifest (`22.x.x`) and
  `apps/server` (`22.x`). On a machine running a newer Node, yarn 1 refuses
  every script in either -- so `yarn build`, `yarn web:dev`, `yarn lint` and
  `yarn check:pins` at the root fail too, not just the server ones. Best fix is
  `nvm use` (`.nvmrc` says 22). Otherwise call the tool directly: `npx turbo
  <task>`, `npx jest`, `npx tsc --noEmit`,
  `npx drizzle-kit generate|migrate`, `npx nest start`. `npm run` works in
  `apps/web` and `apps/mobile` because neither declares `engines`.
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
- **The server's prettier errors are a config mismatch, not your code.** Root
  `.prettierrc.js` sets `semi: false`, `apps/server` has no prettier config of
  its own, and its eslint config loads
  `eslint-plugin-prettier/recommended` -- so every semicolon in the server is
  an error (78-line `match-math.ts` gives 24, nearly all `Delete ';'`). A large
  count on a file you just edited does not mean you introduced it: compare
  against a neighbouring file first. Do **not** `--fix` a file you only partly
  changed (it reformats the whole thing and buries the real diff), and note
  that `apps/server`'s own `yarn lint` *is* `eslint --fix`. The root
  `yarn format` would strip semicolons across server and web in one sweep.
  `apps/web` eslint extends only the Next presets, no prettier plugin, so web
  lint is clean.
- `drizzle-kit generate` prompts interactively when a table keeps its name but
  its columns change (it cannot tell a rename from a drop-plus-add), and the
  prompt cannot be answered without a TTY. To replace a table cleanly, generate
  two migrations: remove it from the schema and generate the drop, then add the
  new definition and generate the create.
- **`query-check.note` at the repo root is a named pipe, not a file.** `cat`,
  `head` or `grep` on it blocks forever. It is untracked and absent from
  `.gitignore`, and `git status` stays silent because git skips non-regular
  files, so nothing warns you. `ls -la` or `file` an unfamiliar root file
  before reading it.
- **`--radius` is `0` in `apps/web`.** `globals.css` sets `:root { --radius: 0 }`
  and the shadcn scale derives from it, so `rounded-lg` renders 0px,
  `rounded-md`/`-sm` clamp to 0, and `rounded-xl` is only 4px. Every shadcn
  component is square by default. Reach for `rounded-xl` or a literal
  `rounded-[8px]` when a corner needs to show.
- **Open Sans is declared but never applied.** `layout.tsx` builds the
  `Open_Sans` font with `variable: '--font-open-sans'` but never puts
  `openSans.variable` on `<html>` or `<body>` (only Inter and the two Geist
  variables are attached). `@theme inline` then self-references
  `--font-open-sans: var(--font-open-sans)`, so
  `body { font-family: var(--font-open-sans), Arial, ... }` falls through to
  Arial. The dashboard is not rendering Open Sans today.
- **Two nav entries are switched off in `DashboardSidebar.tsx`.**
  `const showTreeMatch = false` hides the whole "Matching" group, and the
  Devices entry is commented out until migration `0008` is applied everywhere
  (the page 500s without its `user_device` telemetry columns). Both pages and
  their APIs still work by direct URL. Each is a one-line restore.
- **The web dashboard is effectively English-only.** `src/lib/i18n.ts` inlines
  a handful of login strings and nothing else, despite `i18next` /
  `react-i18next` being installed. Only `apps/mobile` has real translations
  (`src/locales/languages`: de, en, es, fr, it, mg, pt-BR).

## Known issues, not yet fixed

Found in a full-codebase review on 2026-09-10 and left deliberately, to be
picked up later. Do not treat any of these as a surprise or "discover" them
again; do not fix one as a drive-by inside unrelated work. Delete an entry when
it is genuinely closed.

**Correctness / behaviour**

- **Cache TTL constants are 3-170x their own comments**
  (`src/cache/cache-keys.ts`). `SHORT` is 20 min not 5, `MEDIUM` is 50 min not
  15, `LONG` is ~7 days not 1 hour, `VERY_LONG` ~28 days, `FOREVER` ~7.6 years.
  `MEDIUM` is the TTL on the cached `project_member` row that
  `ProjectPermissionsGuard` reads, so **a role change or a removed membership
  can stay live for ~50 minutes**. Explicit invalidation goes through
  `ProjectCacheService` / `UserCacheService` or the superadmin
  `POST /workspace/cache/clear`. Fixing the numbers changes real
  behaviour, so decide the intended values rather than just correcting the
  comments.
- **`geometryWithGeoJSON` cannot serialise a geometry on its own**
  (`schema/index.ts`). Its `toDriver` returns the *string*
  `ST_GeomFromGeoJSON('...')`, which drizzle binds as a parameter, not as SQL.
  Nothing is broken today because every write goes through an explicit `sql`
  fragment in the services, but the custom type reads as if it works.
- **`DatabaseConfig.ssl` is typed `boolean` but returns an object**
  (`database/database.config.ts` over `database-url.parser.ts`, which yields
  `{ rejectUnauthorized: false }`). Correct at runtime, a lie to TypeScript.

**Hygiene**

- **`apps/mobile/.env.sample` is missing `EXPO_PUBLIC_API_ENDPOINT_MOBILE`**,
  the TreeMapper API base URL that nearly every mobile route is built from, so
  a fresh clone silently posts to `undefined/mobile/project`. Also missing
  `EXPO_PUBLIC_ONESIGNAL_APP_ID` and `EXPO_PUBLIC_V3_CDN_URL`. `apps/server`
  has no `.env.example` at all; ask a teammate for the current set rather than
  listing it here.
- **Placeholder shipped in `<head>`**: `src/app/layout.tsx` sets
  `'apple-itunes-app': 'app-id=YOUR_APP_ID, app-argument=.../dashboard'`. The
  id is unfilled and the argument points at what is now a redirect stub.
- **`src/sites/ttc-sync.service.ts:184`** logs the whole TTC create-site
  response with `console.log` on every sync. Noisy, and response bodies are
  exactly the kind of thing that quietly grows to hold something you did not
  mean to publish. Prefer the injected `Logger` at debug level.
- **No tests outside the server's two TreeMatch suites** (47 tests total).
  `apps/web` and `apps/mobile` have none, and see the jest `moduleNameMapper`
  gotcha before adding a server spec that touches the DI graph.

**Dead code, ask before deleting**

- `src/organization/` is unreferenced: `OrganizationModule` is imported
  nowhere and its controller is fully commented out. `WorkspaceModule`
  replaced it, and `src/workspace/` still carries near-identical copies of its
  DTOs.
- `ProjectRoles` exists in **six** copies (`projects/`, `workspace/`,
  `organization/`, `mobile/`, `species/`, `sites/`). All set the same
  `'projectRoles'` metadata key so they are interchangeable; four are typed
  `ProjectRole`, three take bare `string[]`. New code should use the
  `projects/` one.
- `src/migrate/migrate.module.ts.ts` has a real double extension, and
  `app.module.ts` imports `'./migrate/migrate.module.ts'` to match. Renaming
  the file means fixing that import.
- `src/database/schema/userSchema.ts` is 0 bytes; `src/bulk-migrate.js` is a
  253-line loose script inside `src/` that nothing imports.
- In `packages/shared-core`: the whole `api/` layer plus
  `utils/error-handler.ts`, `reportHelper.ts`, `sortProjects.ts` and `auth.ts`
  (see Structure).

Already written up elsewhere in this file, listed here so the set is in one
place: `yarn type-check` runs nothing, the prettier `semi: false` mismatch,
the `query-check.note` FIFO, `--radius: 0`, Open Sans never applied, the two
sidebar entries switched off, and the web app being English-only.

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
requires restarting the dev server, not just a reload. **The default is the
local server**, so check whether your `.env` actually sets this before assuming
a preview can reach data.

The TreeMatch screens load real data through the local server
(`/api/treematch/projects/:uid/...`), so previewing them needs `apps/server`
running on :3001 (the `mobile` app is never needed). The donations pane proxies
the TTC contributions API, which needs server-side credentials that are not in
any example file -- ask a teammate for the current set. A TTC deploy sitting
behind an access gate returns a 403 HTML page before the API is ever reached,
which reads as a broken proxy; that case needs an extra service token. If the
donation backend is unreachable the pane
shows an error banner; the plant-locations pane still works from the local DB.

## Web routing and layout

`URL-ROUTING-MIGRATION.md` at the repo root is the full plan and is accurate;
the migration has landed. Shape of `apps/web/src/app`:

- **`(dashboard)/project/[projectUid]/*`** -- the real project pages (overview,
  sites, species, team, intervention, new-intervention, monitoring-plots,
  bulkupload, forms, approvals, dataexplore, leaderboard, settings, treematch,
  device-management, newsite). The `[projectUid]/layout.tsx` reads
  `useParams()` and hydrates `useProjectStore` from the URL -- **the URL is the
  source of truth and the store is a derived cache**, which is what let the ~34
  existing `selectedProject` readers stay unchanged. It renders a spinner until
  the store matches the URL and a "Project not found" panel for an id the user
  cannot access.
- **`(workspace)/workspace/[workspaceUid]/*`** -- general, members, projects,
  approvals, activity.
- **`(standalone)/*`** -- the landing `/`, `/onboard`, `/create-project`,
  `/profile`. All three route groups check `MAINTENANCE_MODE` in their layout.
- **`app/dashboard/*` is two things at once.** Most files are 1-line permanent
  redirect stubs, kept on purpose because real users have bookmarks and shared
  links (bare `/dashboard` preserves the query string so invite params still
  reach the modal). But the same folder still holds **live shared modules the
  new routes import**: `DashboardClientLayout.tsx` and the whole
  `dashboard/workspace/components/` set. Do not delete `app/dashboard`.
  `app/dashboard/productpage` is the product-page POC, behind sign-in on
  purpose; `/login` still serves the real login screen.
- There is **no `middleware.ts`**. `localStorage('project')` is gone; landings
  resolve through `selectedProject`, then `user.primaryProjectUid`.
- Link with `projectHref(uid, subpage)` from `src/lib/projectRoutes.ts`, and
  gate UI with `isProjectAdmin` / `canWriteToProject` from
  `src/lib/projectAccess.ts` -- those constants are the client half of the
  server's `@ProjectRoles(...)` and must be kept in step. They are UX gates
  only.

Two checklist items in the migration doc are still open, both needing a browser
with real auth: confirming the 34 store readers against URL hydration, and the
end-to-end runtime verify (deep links, invite join, not-found/no-access,
impersonation exit).

## Mobile app architecture

`apps/mobile` is the largest workspace (~750 files) and shares nothing with
web or server. Expo 55 / RN 0.83, bare workflow (checked-in `android/` and
`ios/`), app version in `app.json` (3.0.6), bundle id `org.pftp.treemapper`.

- **Realm is the primary store, not a cache.** `src/db/schema/` (~40 object
  schemas) is the local model; `schemaVersion` is **28** in
  `src/db/RealmProvider.tsx`, and `src/db/migrations.ts` holds the hand-written
  migrations (v24, v27 both backfill a new `sync_status`). Bumping a schema
  means bumping that version. `appRealm` is a module-level singleton so
  non-React code (sync helpers, session manager) can write without a hook.
- **Redux Toolkit holds session and UI state only** (`src/store/slice/*`:
  app, user, project, gps, map bounds, sample tree, sync, take-picture, temp),
  persisted with redux-persist. Field data lives in Realm.
- **Sync is a derived priority queue, not a diff.**
  `utils/helpers/syncHelper.ts` walks unsynced Realm interventions and emits
  typed ops (`intervention`, `singleTree`, `sampleTree`, `treeImage`,
  `remeasurementData`, `remeasurementStatus`, `skipRemeasurement`,
  `plannedTree`) with a priority, and each record walks a status machine
  (`PENDING_DATA_UPLOAD` -> `PENDING_SAMPLE_TREE` -> `PENDING_TREE_IMAGE` ->
  `SYNCED`). `components/intervention/SyncIntervention.tsx` drives it;
  monitoring plots have their own pair
  (`SyncMonitoringPlot.tsx` + `monitoringPlotSyncHelper.ts`).
- **Failures are triaged, and that distinction matters.** A 4xx other than
  401/408/429 means the server read the payload and rejected it, so retrying
  the same bytes can never work: the record is **quarantined** by setting
  `fix_required`, dropped from the sync queue, and shown as "Fix Required"
  until the user edits it (editing resets it to `"NO"`). 5xx and network
  errors -- which `customFetch` reports as status 500 -- stay queued.
- **Two backends.** `EXPO_PUBLIC_API_ENDPOINT_MOBILE` is the TreeMapper server
  and serves nearly everything; `EXPO_PUBLIC_API_ENDPOINT` is the **old**
  Plant-for-the-Planet backend and is used for only three things (species
  read/write, delete account). `.env.sample` documents the second but not the
  first, so a fresh clone silently posts to `undefined/...`.
- Auth is `react-native-auth0` with the credentials kept in the native store.
  `api/sessionManager.ts` owns one shared `refreshSession()` used by both the
  proactive expiry check and the reactive 401 retry in `customFetch`, with an
  in-flight promise so concurrent callers refresh once; a failed refresh force-
  logs-out and wipes synced local data.
- Navigation is one big `createNativeStackNavigator` (`src/navigation/
  RootNavigator.tsx`, ~60 screens) over a bottom-tab home. Deep links come in
  through `applinks:treemapper.app` / `dev.treemapper.app`.
- 7 languages under `src/locales/languages` (de, en, es, fr, it, mg, pt-BR) --
  unlike web, which is English-only.
- Crash reporting is Bugsnag; analytics is PostHog; push is OneSignal.

## Deployment

Heroku, **container stack**, one dyno running **both** apps. `heroku.yml`
builds `Dockerfile` and the release runs `yarn start`, which is `concurrently`
starting `next start` on `$PORT` and the Nest server on `3001`. That is why the
browser calls the relative `/api/server/*` and `next.config.ts` rewrites it to
the local Nest process -- never point the client at an absolute API origin.

- `NEXT_PUBLIC_*` vars are **hardcoded in `heroku.yml`**, not set with
  `heroku config:set`. On the container stack Heroku config vars are not
  available during `docker build`, and `heroku.yml` has no variable
  substitution, so a `config:set` value never reaches the client bundle. Only
  three are live: `NEXT_PUBLIC_AUTH0_CLIENT_ID`, `NEXT_PUBLIC_CDN_BASE`,
  `NEXT_PUBLIC_MODE`.
- `apps/mobile` is excluded from both the slug (`.slugignore`) and the image
  (`.dockerignore`), and the Dockerfile `rm -rf`s it. Mobile ships through Expo,
  not Heroku.
- The deps stage runs `node scripts/check-pinned-deps.js` **before**
  `yarn install --frozen-lockfile`, because yarn 1 only validates the root
  manifest against the lockfile (see Dependency pinning).
- Swagger is served at `/api/docs` in non-production only, and non-production
  responses carry `X-Robots-Tag: noindex`.

## TreeMatch server architecture

Rewritten 2026-07-30 against the 2026-07-28 TTC contract. All three TreeMatch
tables land in one migration here, `0007_overrated_colleen_wing`. The 0006-0009
numbers in the original write-up belong to `feature/treematch`, which kept its
own migration folder and does not line up with this branch.

**Ownership is the whole design**: TTC owns contributions, their absolute
`unitsAllocated` totals, and the `ignored` / `ignoreReason` flags. TreeMapper
owns trees and interventions. Nothing from TTC is mirrored here.

One table, `treematch_allocation`: one row per (`ttc_contribution_id`,
`intervention_id`) pair holding `units` in centi-units (100 = 1 tree, TTC's
scale; convert only at the API boundary, via `treematch/match-math.ts`). No FK
on the contribution id -- there is nothing local to point at. No `project_id`
(join `intervention`), no `created_by_id`, no `deleted_at`: there is no
allocation history and no audit trail by design. It exists for one reason, so
TreeMapper knows how many of its own trees are already claimed.

Four routes, all **owner or admin of the project** (see below): `GET .../interventions`,
`GET .../contributions` (thin TTC proxy, passes `ignored` through),
`POST .../matches`, `PATCH .../contributions/:contributionId/ignore` (proxy of
the TTC endpoint).

**Owner or admin, but the membership has to be real (changed 2026-09-07).**
Every route carries `@ProjectRoles('owner', 'admin')` and `MATCHER_ROLES` is
`['owner', 'admin']`, so the role rule now matches the rest of the app. It was
owner-only between 2026-08-03 and 2026-09-07.

The part that stays narrower is *where the role comes from*.
`ProjectPermissionsGuard` falls back to the workspace: someone who owns or
admins the workspace but holds no `project_member` row gets a synthesized
membership with `role: 'admin'`. Right for most of the app, wrong here, because
matching claims trees and writes absolute totals to TTC and **there is no
unmatch route**. So the guard now stamps `viaWorkspaceAdmin: true` on that
synthesized membership (`ProjectGuardResponse`, an optional field nothing else
reads), and `TreeMatchAccessGuard` -- listed after `ProjectPermissionsGuard` in
every `@UseGuards` on the controller -- rejects it with a 403.

The two halves must move together. `TreeMatchAccessGuard` covers the project in
the path; `assertCanMatchFrom` covers the other projects a cross-project match
reads trees from, and it excludes workspace roles for free, because neither
`getUserProject` nor `getMemberRoleFromUid` reads `workspace_member`. Widening
one without the other opens a hole.

Guard order is load-bearing: `TreeMatchAccessGuard` reads `request.membership`,
so it throws rather than passing if it ever runs first.

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
.../matches` body may live in any project. The route guards only clear the
project in the path (the contributions side), so
`TreeMatchService.authorizeSourceProjects` checks every other project the target
locations belong to, using the same membership resolution the guard uses
(`project_member`) and the same owner-or-admin rule. It runs *before* the transaction on purpose:
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

Rebuilt 2026-07-31 on top of the write path above, not beside it (same
migration, `0007_overrated_colleen_wing`). `apps/server/src/treematch/automatch/`. Backend only so far; the web editor
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
about one page. Both are pure additions. A full sweep is not an option: 172k contributions at ~700ms per
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

> ⚠️ **Currently hidden from the nav.** `DashboardSidebar.tsx` has
> `const showTreeMatch = false`, so the whole "Matching" group is gone from the
> sidebar. Everything below still works and a direct URL still reaches the
> page; flip that one line to bring the entry back. The other gate on the
> entry, `isPlatformProjectWorkspace` (workspace slug `platform-projects`), is
> unreachable while the flag is false.

**Split into hooks and panes on 2026-08-03** (`page.tsx` was 1553 lines and 32
`useState` calls). `page.tsx` is now the role gate plus a composition root:
`component/hooks/useTreematchLocations` and `useTreematchDonations` own one pane
of data each, `useMatchSelection` reads both and hands each pane back what is
ticked and what may not be ticked, `useAutomatchRun` holds the rules and the run,
and `useFeedback` holds the two page-level message lines. `StatsRibbon`,
`LocationsPane`, `MatchConnector` and `DonationsPane` are the markup.

**Owner or admin since 2026-09-07**, matching the server. Three places carry the
gate and all three use `isProjectAdmin` from `@/lib/projectAccess`: the sidebar
entry, the page's own check (so a direct URL gets the same answer), and the
source-project picker in `useTreematchLocations`, which lists every project the
user owns or admins rather than only the ones they own. All three are UX gates.
The server is stricter in one way the client cannot see: a project reached only
through a workspace role can still appear in the picker, and the write refuses
it.

Two seams are worth knowing before changing any of it:

- **The panes never reference each other.** They meet only in
  `useMatchSelection`. Each pane exposes a `generation` counter that changes when
  its list is *replaced* rather than appended to; the selection clears itself off
  that signal, and the map refits its bounds off the same one. Do not add a
  direct call from one pane's hook into the other.
- **The client-side donation filters live in `DonationsPane`, not the data
  hook**, because they need the selection (selected rows stay in view), and the
  selection is derived from the very list the hook owns. Putting them in the hook
  makes the dependency circular.

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
  right). `MAX_MATCH_PAIRS` (2000, mirrored in `component/types.ts`) is enforced in
  the confirm dialog rather than split across requests, which would give up the
  all-or-nothing guarantee.
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

The way to do it is the **`/dev-token` page**, not an env var:

1. Check auth in the preview (is `localStorage.access_token` empty / is the page
   on login?). If it is already present, do nothing.
2. If it is empty, open `http://localhost:3000/dev-token`, paste a valid Auth0
   access token, and press save. The page validates the JWT shape and its
   expiry, writes `localStorage.access_token`, and redirects to `/`.
3. Ask the user for a fresh token when you need one. Never invent one, and
   never print one in chat.

`apps/web/src/app/dev-token/page.tsx` is deliberately **untracked** (listed in
`.git/info/exclude`) and calls `notFound()` unless `NODE_ENV=development`, so it
cannot ship. Do not commit it, and do not add a route that serves a token.

An older `BEARER_TOKEN` env-var flow is gone: there is no such key in
`apps/web/.env` and nothing reads it.

## What NOT to do

- Do not commit secrets or `.env` files.
- Do not share live customer or production data in chat.
- Do not use `--no-verify` to bypass hooks.
- Do not commit unless explicitly asked.
- Do not remove `TODO` comments without asking first -- they mark known gaps that need future work.
- Do not remove commented-out code that describes a planned or stubbed feature extension without asking first -- it carries intent that may not be obvious from context.
