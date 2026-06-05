# TreeMapper

TreeMapper is an open-source forest monitoring platform built by [Plant-for-the-Planet](https://www.plant-for-the-planet.org). It helps organizations record, track, and review tree planting and restoration activities in the field.

TreeMapper is part of the **ForestCloud** platform -- a suite of tools for managing large-scale planting programs.

**Documentation:** [docs.treemapper.app](https://docs.treemapper.app/en)

---

## What TreeMapper does

TreeMapper lets field teams and project managers:

- Record planting interventions and tree measurements in the field
- Track tree growth, health, and remeasurements over time
- Manage projects, sites, and species data
- Upload bulk data and build custom data collection forms
- Review and approve data through a built-in approval workflow
- Explore data through maps and analytics dashboards
- Collaborate across teams and workspaces

---

## Apps in this repo

This is a monorepo managed with [Turborepo](https://turbo.build) and Yarn workspaces.

```
apps/
  mobile/    React Native + Expo field app (iOS and Android)
  web/       Next.js management dashboard
  server/    NestJS + Fastify API server
packages/
  shared-core/  Shared utilities used by the web app
```

### Mobile app

The field app runs on iOS and Android. Field teams use it to:

- Create and manage planting plots (point and polygon)
- Record tree measurements and remeasurements
- Capture photos and fill out custom survey forms
- Browse projects and sites
- Work with offline maps

### Web dashboard

The web app is the management interface. It covers:

- Project and site management
- Team and workspace management
- Bulk data upload
- Custom form builder
- Data exploration and map visualization
- Intervention planning and approval tracking
- Species management
- Analytics and leaderboards
- Onboarding workflows

### API server

The NestJS server powers both the mobile and web apps. Key areas:

- Authentication via Auth0
- Project, site, tree, and intervention management
- Species data
- Approval board workflow
- Notifications and audit logging
- File storage via AWS S3 / Cloudflare R2
- Background jobs via Bull + Redis
- Public API for third-party access

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.83, Expo SDK, Maplibre |
| Web | Next.js 15, React 18, shadcn/ui, Tailwind, Mapbox |
| Server | NestJS 11, Fastify, Drizzle ORM, PostgreSQL |
| Auth | Auth0 |
| Cache / Queue | Redis, Bull |
| Storage | AWS S3, Cloudflare R2 |
| Shared | TanStack Query, Zustand |
| Language | TypeScript throughout |

---

## Getting started

### Requirements

- Node.js >= 18
- Yarn 1 (classic)
- PostgreSQL
- Redis

### Install

```bash
yarn install
```

### Development

```bash
yarn web:dev          # Start the Next.js dev server
yarn server:dev       # Start the NestJS server in watch mode
yarn native:dev       # Start the Expo dev server (mobile)
yarn dev:fullstack    # Start web + server together
```

### Database (server)

```bash
cd apps/server
yarn db:generate      # Generate Drizzle migrations
yarn db:migrate       # Apply migrations
yarn db:studio        # Open Drizzle Studio
```

### Other commands

```bash
yarn build            # Build all apps
yarn type-check       # Type-check all apps
yarn lint             # Lint all apps
```

---

## Environment variables

Each app has its own `.env` file. Copy the `.env.example` in each app directory and fill in the values.

- `apps/server/.env`
- `apps/web/.env.local`
- `apps/mobile/.env`

Never commit `.env` files. See the [documentation](https://docs.treemapper.app/en) for required variables.

---

## Verify the Android APK

Every Android release on [GitHub Releases](https://github.com/Plant-for-the-Planet-org/treemapper/releases) is signed with Plant-for-the-Planet's PGP key. You can verify that the APK you downloaded is genuine and was not tampered with.

Each release includes three files:

- `TreeMapper_v1.0.0.apk` -- the Android app
- `SHA256SUM.asc` -- PGP-signed checksum of the APK
- `TREEMAPPER_DETACHED_SIGN.sign` -- detached PGP signature of the APK

Download all three and keep them in the same folder.

### Step 1 -- Get the Plant-for-the-Planet public key

```bash
gpg --keyserver hkps://keys.openpgp.org --recv-key "994D 147D 19D0 DFA4 38DA 99F3 A83D 08B1 7DA1 D37F"
```

### Step 2 -- Verify the APK certificate

Rename a copy of the APK from `.apk` to `.zip` and extract `META-INF/TREECOUN.RSA`. Then run:

```bash
keytool -printcert -file TREECOUN.RSA
```

The certificate fingerprints should match exactly:

```
SHA1:   C6:6D:10:EF:C1:89:26:89:C3:93:81:C3:24:59:DA:08:31:BE:06:A2
SHA256: 33:F3:D2:3E:5D:82:AF:5D:4B:26:51:68:94:31:C4:DC:46:AB:7B:19:E3:13:E4:7E:F6:E7:2D:70:D9:D9:CA:6E
```

### Step 3 -- Verify the APK checksum

```bash
shasum -a 256 --check SHA256SUM.asc
```

The output should show the APK filename followed by `OK`:

```
TreeMapper_v1.0.0.apk: OK
```

### Step 4 -- Verify the checksum is signed by Plant-for-the-Planet

```bash
gpg --verify SHA256SUM.asc
```

Expected output:

```
using RSA key 994D147D19D0DFA438DA99F3A83D08B17DA1D37F
issuer "shyam.bhongle@plant-for-the-planet.org"
Good signature from "Plant-for-the-Planet (TreeMapper Release Key) <shyam.bhongle@plant-for-the-planet.org>"
```

### Step 5 -- Alternate: verify using the detached signature

```bash
gpg --verify TREEMAPPER_DETACHED_SIGN.sign TreeMapper_v1.0.0.apk
```

Expected output:

```
using RSA key 994D147D19D0DFA438DA99F3A83D08B17DA1D37F
issuer "shyam.bhongle@plant-for-the-planet.org"
Good signature from "Plant-for-the-Planet (TreeMapper Release Key) <shyam.bhongle@plant-for-the-planet.org>"
```

---

## Signing a release (maintainers only)

Before uploading an APK to GitHub Releases, sign it with the Plant-for-the-Planet PGP key. You will need the passphrase you set when generating the key.

### Step 1 -- Generate the signed checksum

```bash
shasum -a 256 TreeMapper_v1.0.0.apk > SHA256SUM.asc
gpg --clearsign --output SHA256SUM.asc SHA256SUM.asc
```

### Step 2 -- Generate the detached signature

```bash
gpg --detach-sign --armor --output TREEMAPPER_DETACHED_SIGN.sign TreeMapper_v1.0.0.apk
```

### Step 3 -- Upload to GitHub Releases

Attach all three files to the GitHub release:

- `TreeMapper_v1.0.0.apk`
- `SHA256SUM.asc`
- `TREEMAPPER_DETACHED_SIGN.sign`

### Notes

- The PGP key fingerprint is `994D 147D 19D0 DFA4 38DA 99F3 A83D 08B1 7DA1 D37F`.
- If you are on a new machine, import your private key first: `gpg --import your-private-key.asc`
- Keep the private key and its passphrase secure. Never commit or share them.
- Store a backup of the private key offline (e.g. encrypted USB drive).

---

## Contributing

We welcome contributions. Please open an issue before starting work on a large change so we can discuss the approach first.

A few things to keep in mind:

- This repo is public. Never commit secrets, credentials, or production data.
- All dependencies are pinned to exact versions on purpose (supply-chain safety). Use `yarn add <pkg>@<exact-version>` and do not introduce `^` ranges.
- The pre-commit hook will block commits that change dependency files unless you set `ALLOW_DEP_CHANGE=1`.
- The mobile app (`apps/mobile`) is independent and does not share code with `apps/web` or `apps/server`.

---

## Links

- [Documentation](https://docs.treemapper.app/en)
- [Plant-for-the-Planet](https://www.plant-for-the-planet.org)
- [ForestCloud platform](https://www.plant-for-the-planet.org)
- [Issues](https://github.com/Plant-for-the-Planet-org/treemapper/issues)
