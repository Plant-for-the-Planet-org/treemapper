import fs from 'node:fs'
import path from 'node:path'

// Layer 2 (full stack): real Auth0 login, real Nest server, real local
// Postgres. See docs/e2e-testing-plan.md, "Layer 2: full stack".

const WEB_DIR = path.resolve(__dirname, '../..')
const SERVER_DIR = path.resolve(WEB_DIR, '../server')

/** Credentials and nothing else. Gitignored (`.env*`), and Next never loads it. */
export const CREDENTIALS_FILE = path.join(WEB_DIR, '.env.e2e')

/**
 * The logged-in browser state the setup project saves. It holds a real access
 * token, so it lives under `.auth/`, which is gitignored.
 */
export const AUTH_FILE = path.join(WEB_DIR, 'e2e/.auth/user.json')

export function credentials() {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD
  if (!email || !password) {
    throw new Error(
      `Set E2E_USER_EMAIL and E2E_USER_PASSWORD in ${CREDENTIALS_FILE}.`,
    )
  }
  return { email, password }
}

// Reads one key from a dotenv file without loading the rest of it, so server
// secrets never reach the test process.
function readEnvKey(file: string, key: string): string | undefined {
  if (!fs.existsSync(file)) return undefined
  const line = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .find(l => l.startsWith(`${key}=`))
  return line
    ?.slice(key.length + 1)
    .trim()
    .replace(/^["']|["']$/g, '')
}

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1']

/**
 * Layer 2 reads and writes through a real server, so make sure that server is
 * this machine's, on this machine's database. The usual server `.env` points at
 * shared staging (see CLAUDE.md), and the web `.env` can point at
 * dev.treemapper.app. These check the files, which is what a reused dev server
 * was started with as long as nobody edited them since.
 */
export function assertLocalBackend() {
  const backendApi = readEnvKey(
    path.join(WEB_DIR, '.env'),
    'NEXT_PUBLIC_BACKEND_API',
  )
  if (backendApi === 'true') {
    throw new Error(
      'apps/web/.env sets NEXT_PUBLIC_BACKEND_API=true, so the web app talks to ' +
        'dev.treemapper.app. Layer 2 runs against the local server only: set it ' +
        'to false and restart the web dev server.',
    )
  }

  const dbUrl = readEnvKey(path.join(SERVER_DIR, '.env'), 'DATABASE_URL')
  if (!dbUrl) {
    throw new Error('apps/server/.env has no DATABASE_URL.')
  }
  const host = new URL(dbUrl).hostname.replace(/^\[|\]$/g, '')
  if (!LOCAL_HOSTS.includes(host)) {
    throw new Error(
      `apps/server/.env DATABASE_URL points at "${host}", not a local database. ` +
        'Layer 2 must never run against shared staging.',
    )
  }
}
