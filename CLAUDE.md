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
