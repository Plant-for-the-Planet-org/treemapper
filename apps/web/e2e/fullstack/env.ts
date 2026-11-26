import fs from 'node:fs'
import path from 'node:path'
import { parseEnv } from 'node:util'

// Layer 2 (full stack): real Auth0 login, real Nest server, real local
// Postgres. See docs/e2e-testing-plan.md, "Layer 2: full stack".

const WEB_DIR = path.resolve(__dirname, '../..')
const SERVER_DIR = path.resolve(WEB_DIR, '../server')
const REPO_DIR = path.resolve(WEB_DIR, '../..')

/** Credentials and nothing else. Gitignored (`.env*`), and Next never loads it. */
export const CREDENTIALS_FILE = path.join(WEB_DIR, '.env.e2e')

/**
 * The logged-in browser state the setup project saves. It holds a real access
 * token, so it lives under `.auth/`, which is gitignored.
 */
export const AUTH_FILE = path.join(WEB_DIR, 'e2e/.auth/user.json')

/**
 * The access token AUTH_FILE holds for `origin`. Undefined when there is no
 * file yet, it is not JSON, or it has no token for that origin.
 */
export function readSavedToken(origin: string): string | undefined {
  try {
    const state = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'))
    return state.origins
      ?.find((o: { origin: string }) => o.origin === origin)
      ?.localStorage?.find(
        (item: { name: string }) => item.name === 'access_token',
      )?.value
  } catch {
    return undefined
  }
}

/**
 * The test account. Read from CREDENTIALS_FILE on each call and never put in
 * `process.env`, so a dev server Playwright starts does not inherit the
 * password. A value already in the shell wins, as it would with dotenv.
 */
export function credentials() {
  const file = readEnvFile(CREDENTIALS_FILE)
  const email = process.env.E2E_USER_EMAIL ?? file.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD ?? file.E2E_USER_PASSWORD
  if (!email || !password) {
    throw new Error(
      `Set E2E_USER_EMAIL and E2E_USER_PASSWORD in ${CREDENTIALS_FILE}.`,
    )
  }
  return { email, password }
}

// Parses a dotenv file without loading it into `process.env`, so its values
// (server secrets, the test password) never leak into the test process or a
// server it starts. Same parser as `process.loadEnvFile`. Empty when the file
// does not exist.
function readEnvFile(file: string): NodeJS.Dict<string> {
  if (!fs.existsSync(file)) return {}
  return parseEnv(fs.readFileSync(file, 'utf8'))
}

// Where `next dev` reads its env from, highest priority first. A value in the
// shell beats every file, and among the files the first one that sets a key
// wins. `.env.test*` is left out: Next only reads it when NODE_ENV=test.
const WEB_ENV_FILES = [
  '.env.development.local',
  '.env.local',
  '.env.development',
  '.env',
]

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

/**
 * Layer 2 reads and writes through a real server, so make sure that server is
 * this machine's, on this machine's database. The usual server `.env` points at
 * shared staging (see CLAUDE.md), and the web `.env` can point at
 * dev.treemapper.app.
 *
 * It checks the same sources the servers read, in the same order: the shell
 * running the tests, then the env files. It cannot see the env of a server
 * that is already running, so this matches what that server got only if it was
 * started from a shell like this one, from files nobody has edited since.
 */
export function assertLocalBackend() {
  const backendApi = firstSet('NEXT_PUBLIC_BACKEND_API', WEB_DIR, WEB_ENV_FILES)
  if (backendApi?.value === 'true') {
    throw new Error(
      `NEXT_PUBLIC_BACKEND_API=true (from ${backendApi.source}) makes the web ` +
        'app talk to dev.treemapper.app. Layer 2 runs against the local server ' +
        'only: set it to false and restart the web dev server.',
    )
  }

  // Nest's ConfigModule reads only `.env`, and never overrides a value the
  // shell already set.
  const dbUrl = firstSet('DATABASE_URL', SERVER_DIR, ['.env'])
  if (!dbUrl) {
    throw new Error('apps/server/.env has no DATABASE_URL.')
  }
  const host = new URL(dbUrl.value).hostname.replace(/^\[|\]$/g, '')
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `DATABASE_URL (from ${dbUrl.source}) points at "${host}", not a local ` +
        'database. Layer 2 must never run against shared staging.',
    )
  }
}

/**
 * The value of `key` that wins: the shell's, else the first of `files` (in
 * `dir`) that sets it. `source` names where it came from, for error messages.
 */
function firstSet(
  key: string,
  dir: string,
  files: string[],
): { value: string; source: string } | undefined {
  const fromShell = process.env[key]
  if (fromShell !== undefined) return { value: fromShell, source: 'your shell' }
  for (const file of files) {
    const value = readEnvFile(path.join(dir, file))[key]
    if (value !== undefined) {
      return { value, source: path.relative(REPO_DIR, path.join(dir, file)) }
    }
  }
  return undefined
}
