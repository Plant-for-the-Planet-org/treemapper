import { exitImpersonationWork } from '@shared-core/fetchApi/api.fetch'
import { AUTH0_CONFIG } from '@/lib/auth/auth0-config'
import { DEFAULT_REDIRECT_PATH } from '@/lib/constants/auth'
import { getSafeRedirectPath, isProtectedRoute } from '@/lib/utils/auth'
import { useAuthStore } from '@/stores/auth-store'

// Always end impersonation before logging out. Impersonation is a server-side
// key keyed to the admin's auth0Id with a 30-min TTL, so logging out while
// impersonating (without exiting first) would resume impersonation on the next
// login. Clearing it here makes logout a clean exit regardless.
export async function logout(opts?: { accessToken?: string | null; impersonating?: boolean; returnTo?: string }) {
  if (opts?.impersonating && opts.accessToken) {
    try {
      await exitImpersonationWork(opts.accessToken)
    } catch {
      // Best effort; proceed to logout even if the clear fails.
    }
  }

  // Clear local auth state immediately so the store is empty even if the
  // Auth0 redirect hangs or is blocked.
  useAuthStore.getState().clearAuth()

  const currentPage = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : DEFAULT_REDIRECT_PATH
  const redirectAfterLogout = opts?.returnTo || currentPage

  const uncheckedRedirect = isProtectedRoute(redirectAfterLogout)
    ? DEFAULT_REDIRECT_PATH
    : redirectAfterLogout
  const safeRedirect = getSafeRedirectPath(uncheckedRedirect)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const logoutSuccessUrl = `${baseUrl}/redirecting?logoutSuccess=true&redirectTo=${encodeURIComponent(safeRedirect)}`

  const logoutUrl = new URL(`https://${AUTH0_CONFIG.domain}/v2/logout`)
  logoutUrl.searchParams.set('client_id', AUTH0_CONFIG.clientId!)
  logoutUrl.searchParams.set('returnTo', logoutSuccessUrl)

  if (typeof window !== 'undefined') {
    window.location.href = logoutUrl.toString()
  }
}
