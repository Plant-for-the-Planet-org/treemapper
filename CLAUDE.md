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

- **mobile**: Expo SDK, React Native 0.81, Maplibre, Auth0
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

## Gotchas

- `yarn.lock` is large (~21k lines, ~1000 packages) mostly because the mobile workspace pulls Expo/RN + transitive deps.
- The web app inlines `NEXT_PUBLIC_*` env vars at build time. Changing them requires a rebuild.
- The server uses Fastify, not Express. Some Nest examples assume Express -- adapt accordingly.

## What NOT to do

- Do not commit secrets or `.env` files.
- Do not share live customer or production data in chat.
- Do not use `--no-verify` to bypass hooks.
- Do not commit unless explicitly asked.
- Do not remove `TODO` comments without asking first -- they mark known gaps that need future work.
- Do not remove commented-out code that describes a planned or stubbed feature extension without asking first -- it carries intent that may not be obvious from context.
