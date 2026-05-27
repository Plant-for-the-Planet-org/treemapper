import { exitImpersonationWork } from '@shared-core/fetchApi/api.fetch'

// Always end impersonation before logging out. Impersonation is a server-side
// key keyed to the admin's auth0Id with a 30-min TTL, so logging out while
// impersonating (without exiting first) would resume impersonation on the next
// login. Clearing it here makes logout a clean exit regardless.
export async function logout(opts?: { accessToken?: string | null; impersonating?: boolean }) {
  if (opts?.impersonating && opts.accessToken) {
    try {
      await exitImpersonationWork(opts.accessToken)
    } catch {
      // Best effort; proceed to logout even if the clear fails.
    }
  }
  window.location.href = '/api/auth/logout'
}
