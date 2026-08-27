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

- **mobile**: Expo SDK 55, React Native 0.83.6, React 19, Maplibre
  (`@maplibre/maplibre-react-native`), Auth0 (`react-native-auth0`), Realm for
  local storage, Redux Toolkit for state
- **web**: Next.js 16 (App Router), React 19, shadcn/ui on Radix, Tailwind 4,
  Maplibre (`maplibre-gl` + `react-map-gl`), recharts, Zustand
- **server**: NestJS 11, Fastify, Drizzle ORM, Postgres (`pg`), in-memory cache (cache-manager), AWS S3 / R2
- **shared-core**: Zustand stores, fetch helpers (`fetchApi`), shared types and
  utils. No data-fetching library: calls are plain `fetch` wrappers.

Two things here are easy to assume wrong:

- **Web auth is hand-rolled, not an SDK.** There is no `@auth0/nextjs-auth0`.
  The browser runs the Auth0 PKCE flow itself (`src/lib/auth/`), and the access
  token lives in a React context (`useTokenContext`), not in a server session.
- **Both apps use Maplibre, not Mapbox.**

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

## What NOT to do

- Do not commit secrets or `.env` files.
- Do not share live customer or production data in chat.
- Do not use `--no-verify` to bypass hooks.
- Do not commit unless explicitly asked.
- Do not remove `TODO` comments without asking first -- they mark known gaps that need future work.
- Do not remove commented-out code that describes a planned or stubbed feature extension without asking first -- it carries intent that may not be obvious from context.
