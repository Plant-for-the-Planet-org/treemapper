import { useDispatch, useSelector } from 'react-redux'
import { usePostHog } from 'posthog-react-native'
import { RootState } from 'src/store'
import { setAnalyticsConsent } from 'src/store/slice/appStateSlice'
import { AnalyticsConsent } from 'src/types/interface/slice.interface'
import { captureAnalyticsEvent, AnalyticsEvents } from 'src/utils/analytics'

export type ConsentSource = 'first_launch' | 'settings'

/**
 * Reads and changes whether analytics may be linked to the signed-in account.
 *
 * Only records the choice. Linking and unlinking happen in
 * AnalyticsConsentGate, which watches this value together with the login
 * state, so every way of signing in or out is covered in one place.
 */
const useAnalyticsConsent = () => {
  const dispatch = useDispatch()
  const posthog = usePostHog()
  // Installs that persisted appState before this field existed rehydrate
  // without it, so treat a missing value as "not asked yet".
  const consent: AnalyticsConsent = useSelector(
    (state: RootState) => state.appState.analyticsConsent ?? 'unset',
  )

  const updateConsent = (next: 'granted' | 'denied', source: ConsentSource) => {
    // Going from "no" to "yes": start a fresh anonymous id first. Otherwise
    // identify() would merge everything captured while they had said no into
    // their person profile, which is exactly what they declined.
    if (consent === 'denied' && next === 'granted') {
      try {
        posthog?.reset()
      } catch {
        // Analytics must never block the settings change.
      }
    }
    dispatch(setAnalyticsConsent(next))
    captureAnalyticsEvent(posthog, AnalyticsEvents.ANALYTICS_CONSENT_UPDATED, {
      granted: next === 'granted',
      previous: consent,
      source,
    })
  }

  return { consent, updateConsent }
}

export default useAnalyticsConsent
