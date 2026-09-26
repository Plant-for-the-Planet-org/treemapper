import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { usePostHog } from 'posthog-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { RootState } from 'src/store'
import useAnalyticsConsent from 'src/hooks/useAnalyticsConsent'
import AnalyticsConsentModal from './AnalyticsConsentModal'

// The TreeMapper user id PostHog is currently identified as, if any. Kept on
// disk because by the time we learn about a logout, userState is already
// wiped, and a crash between identify() and a later reset() must not leave
// the next person's anonymous events attached to the previous account.
const LINKED_ID_KEY = 'analytics_linked_user_id'

/**
 * Asks for analytics consent on first launch and keeps PostHog's identity in
 * step with the answer:
 *
 * - consent granted and signed in -> identify() with the TreeMapper user id
 * - anything else                 -> stay anonymous; reset() if we had linked
 *
 * It watches the store rather than hooking into each login and logout path,
 * because there are several (sidebar, delete account, forced logout on a
 * failed token refresh) and a missed one would keep sending linked events.
 *
 * Mount inside both the Redux provider (after PersistGate) and PostHogProvider.
 */
const AnalyticsConsentGate = () => {
  const posthog = usePostHog()
  const { consent, updateConsent } = useAnalyticsConsent()
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn)
  const { id, country, type, locale } = useSelector((state: RootState) => state.userState)

  useEffect(() => {
    if (!posthog) return
    const shouldLink = consent === 'granted' && isLoggedIn && !!id
    // A newer run supersedes this one. Without this, an older run that was
    // waiting on AsyncStorage could reset() right after a newer identify().
    let stale = false

    const sync = async () => {
      try {
        if (shouldLink) {
          // Record the link before making it, so a newer run that has to
          // unlink always finds the key, whatever order the two finish in.
          await AsyncStorage.setItem(LINKED_ID_KEY, id)
          if (stale) return
          if (posthog.getDistinctId() !== id) {
            // Person properties are the same coarse fields login_succeeded
            // already sends. No name, email or anything typed in the field.
            posthog.identify(id, {
              country: country || null,
              user_type: type || null,
              locale: locale || null,
            })
          }
          return
        }
        const linkedId = await AsyncStorage.getItem(LINKED_ID_KEY)
        if (linkedId && !stale) {
          // New anonymous id: nothing from here on joins the old profile.
          posthog.reset()
          await AsyncStorage.removeItem(LINKED_ID_KEY)
        }
      } catch {
        // Analytics must never affect app behaviour.
      }
    }
    sync()
    return () => {
      stale = true
    }
  }, [posthog, consent, isLoggedIn, id, country, type, locale])

  return (
    <AnalyticsConsentModal
      isVisible={consent === 'unset'}
      consent={consent}
      dismissible={false}
      onChoose={choice => updateConsent(choice, 'first_launch')}
    />
  )
}

export default AnalyticsConsentGate
