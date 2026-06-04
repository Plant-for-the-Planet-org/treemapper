import store from 'src/store/index'
import {
  updateUserToken,
  updateUserLogin,
  logoutAppUser,
  updateNewIntervention,
} from 'src/store/slice/appStateSlice'
import { resetProjectState } from 'src/store/slice/projectStateSlice'
import { resetUserDetails } from 'src/store/slice/userStateSlice'
import { appRealm } from 'src/db/RealmProvider'
import { RealmSchema } from 'src/types/enum/db.enum'
import auth0 from './auth0Client'

// Wipe the local data a logout should clear. Mirrors the realm hooks
// (deleteAllSyncedIntervention / deleteAllProjects / deleteAllUserSpecies) but
// runs against the singleton `appRealm`, so it works outside React. Species
// rows are kept and just un-favorited, matching the hook behaviour.
const clearLocalRealmData = () => {
  try {
    appRealm.write(() => {
      appRealm.delete(
        appRealm.objects(RealmSchema.Intervention).filtered('status == "SYNCED"'),
      )
      appRealm.delete(appRealm.objects(RealmSchema.Projects))
      const userSpecies = appRealm
        .objects(RealmSchema.ScientificSpecies)
        .filtered('isUserSpecies == true')
      userSpecies.forEach((specie: any) => {
        specie.isUserSpecies = false
        specie.isUploaded = false
        specie.isUpdated = true
      })
    })
  } catch (err) {
    console.error('Realm cleanup during logout failed', err)
  }
}

// Full logout callable from anywhere (React or plain modules). Clears the
// stored Auth0 credentials silently (no browser round-trip), wipes local data,
// and resets Redux so the UI flips to logged-out. Redux is always reset even if
// an earlier step throws, so the app never gets stuck in a half-logged-in state.
export const forceLogout = async () => {
  try {
    await auth0.credentialsManager.clearCredentials()
  } catch (err) {
    console.error('Auth0 clearCredentials failed', err)
  }
  clearLocalRealmData()
  store.dispatch(resetProjectState())
  store.dispatch(updateUserLogin(false))
  store.dispatch(resetUserDetails())
  store.dispatch(logoutAppUser())
  store.dispatch(updateNewIntervention())
}

// Single shared token refresh used by BOTH the proactive expiry check
// (HomeHeader) and the reactive 401 handler (customFetch). The Auth0 SDK keeps
// the refresh token in its native store, so we never pass it in:
//   - minTtl: renew when fewer than this many seconds remain (proactive window).
//   - forceRefresh: renew now even if the local token still looks valid (used
//     after a 401, where the server has rejected the current token).
// On a failed refresh while still logged in, the dead session is logged out.
// Concurrent callers share one in-flight request so we only refresh once.
let refreshInFlight: Promise<string | null> | null = null

export const refreshSession = (
  opts: { minTtl?: number; forceRefresh?: boolean } = {},
): Promise<string | null> => {
  if (refreshInFlight) {
    return refreshInFlight
  }
  const { minTtl = 0, forceRefresh = false } = opts
  refreshInFlight = (async () => {
    try {
      const credentials = await auth0.credentialsManager.getCredentials(
        undefined, // scope: keep the existing grant
        minTtl,
        {},
        forceRefresh,
      )
      if (!credentials?.accessToken) {
        throw new Error('No access token returned from refresh')
      }
      store.dispatch(
        updateUserToken({
          idToken: credentials.idToken,
          accessToken: credentials.accessToken,
          expiringAt: credentials.expiresAt,
          refreshToken: credentials.refreshToken ?? '',
        }),
      )
      return credentials.accessToken
    } catch (err) {
      if (store.getState().appState.isLoggedIn) {
        await forceLogout()
      }
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}
