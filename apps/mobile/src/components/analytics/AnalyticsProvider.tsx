import React, { useCallback, useEffect, useRef } from 'react'
import {
  AppState,
  AppStateStatus,
  BackHandler,
  GestureResponderEvent,
  Platform,
  View,
} from 'react-native'
import { useSelector } from 'react-redux'
import { useNetInfo } from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Application from 'expo-application'
import * as Device from 'expo-device'
import * as Localization from 'expo-localization'
import i18next from 'src/locales'
import { RootState } from 'src/store'
import {
  AnalyticsEvents,
  endAnalyticsSession,
  getCurrentScreen,
  handleScreenTrackingBackgrounded,
  handleScreenTrackingForegrounded,
  identifyAnalyticsUser,
  markSessionWentOffline,
  notifyHardwareBackPressed,
  recordTouchEnd,
  recordTouchStart,
  registerAnalyticsSuperProperties,
  resetAnalyticsUser,
  resetScreenVisitCounts,
  setAnalyticsContext,
  startAnalyticsSession,
  trackEvent,
} from 'src/utils/analytics'

/**
 * Everything about analytics that is app-wide rather than screen-specific:
 *
 * 1. Segmentation (section 1) - super properties on every event, and
 *    identify() when someone signs in so a device's events attach to a person.
 * 2. Online vs offline (sections 1 and 8) - the single most important
 *    property for this app. A field worker is usually offline, and a funnel
 *    that ignores that will read as broken when it is only remote.
 * 3. Sessions (section 10) - a session is one foreground period; its totals
 *    are flushed when the app goes to the background.
 * 4. Friction (section 7) - one capture-phase touch listener for the whole
 *    app. Capture phase sees every touch without ever taking the responder,
 *    so gestures, the map and scrolling are untouched.
 *
 * Mount it inside PostHogProvider and inside the Redux Provider.
 */

/**
 * Records whether the last run ended cleanly. If the app was still "active"
 * when the process died, it did not go to the background first, which means
 * it crashed or was killed outright. PostHog's own $exception covers JS
 * errors; this is what catches a native crash or an OS kill.
 */
const APP_STATE_KEY = 'analytics-last-app-state'

const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const user = useSelector((state: RootState) => state.userState)
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn)
  const { isConnected, type: connectionType } = useNetInfo()

  const identifiedUserId = useRef<string | null>(null)
  const appState = useRef<AppStateStatus>(AppState.currentState)

  /* ---- 1. Super properties: true for every event this install sends ---- */
  useEffect(() => {
    registerAnalyticsSuperProperties({
      app_version: Application.nativeApplicationVersion ?? undefined,
      app_build: Application.nativeBuildVersion ?? undefined,
      // The brief lists Web as a platform. This is the mobile app, so the
      // value is only ever ios or android; the web dashboard reports its own.
      platform: Platform.OS,
      device_model: Device.modelName ?? undefined,
      os_version: Device.osVersion ?? undefined,
      // Two different things, both worth having: the phone's locale, and the
      // language the app is actually rendering in. They disagree whenever
      // someone picks a language by hand, and it is the second one that
      // decides which words a field worker reads.
      device_locale: Localization.getLocales()[0]?.languageTag ?? undefined,
      app_language: i18next.language?.split('-')[0] ?? undefined,
      is_emulator: Device.isDevice === false ? true : undefined,
    })
    startAnalyticsSession()
    resetScreenVisitCounts()
  }, [])

  /* ---- 2. Identity: who is doing this ---- */
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      if (identifiedUserId.current === user.id) {
        return
      }
      identifiedUserId.current = user.id
      identifyAnalyticsUser({
        id: user.id,
        country: user.country,
        type: user.type,
        locale: user.locale,
        isPrivate: user.isPrivate,
        showPlotFeature: user.showPlotFeature,
        created: user.created,
      })
      setAnalyticsContext({ is_logged_in: true })
      return
    }

    if (!isLoggedIn && identifiedUserId.current) {
      // Shared devices are normal in the field, so the link to the previous
      // person has to be cut or their profile keeps collecting a stranger's
      // events.
      identifiedUserId.current = null
      resetAnalyticsUser()
      setAnalyticsContext({ is_logged_in: false })
    }
  }, [isLoggedIn, user])

  /* ---- 3. Connectivity ---- */
  useEffect(() => {
    // null means NetInfo has not answered yet. Guessing here would tag the
    // first events of every launch as offline.
    if (isConnected === null) {
      return
    }
    setAnalyticsContext({
      is_offline: !isConnected,
      network_type: connectionType,
    })
    if (!isConnected) {
      markSessionWentOffline()
    }
    trackEvent(AnalyticsEvents.NETWORK_STATE_CHANGED, {
      is_online: isConnected,
      network_type: connectionType,
    })
  }, [isConnected, connectionType])

  /* ---- 4. Sessions and crash detection ---- */
  useEffect(() => {
    const detectPreviousCrash = async () => {
      try {
        const previous = await AsyncStorage.getItem(APP_STATE_KEY)
        if (previous === 'active') {
          trackEvent(AnalyticsEvents.APP_CRASHED, {
            detected_on: 'next_launch',
            // No stack: this is inferred from the app never reaching the
            // background, not caught. Bugsnag has the detail.
            source: 'unclean_shutdown',
          })
        }
        await AsyncStorage.setItem(APP_STATE_KEY, 'active')
      } catch {
        // ignore
      }
    }
    detectPreviousCrash()

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasActive = appState.current === 'active'
      const isActive = nextState === 'active'
      appState.current = nextState

      if (wasActive && !isActive) {
        handleScreenTrackingBackgrounded()
        endAnalyticsSession(getCurrentScreen())
        AsyncStorage.setItem(APP_STATE_KEY, 'background').catch(() => undefined)
        return
      }

      if (!wasActive && isActive) {
        startAnalyticsSession()
        resetScreenVisitCounts()
        handleScreenTrackingForegrounded()
        AsyncStorage.setItem(APP_STATE_KEY, 'active').catch(() => undefined)
      }
    })

    return () => subscription.remove()
  }, [])

  /* ---- 5. Hardware back ---- */
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return
    }
    // Only notes that the press happened; the back event itself is emitted by
    // the screen tracker once it knows where the user landed. Returning false
    // keeps the app's own back handling exactly as it was.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      notifyHardwareBackPressed()
      return false
    })
    return () => subscription.remove()
  }, [])

  /* ---- 6. Friction: one listener, whole app ---- */
  const onTouchStart = useCallback((event: GestureResponderEvent) => {
    recordTouchStart(event.nativeEvent.pageX, event.nativeEvent.pageY)
  }, [])

  const onTouchEnd = useCallback((event: GestureResponderEvent) => {
    recordTouchEnd(event.nativeEvent.pageX, event.nativeEvent.pageY)
  }, [])

  // onTouchStart bubbles up from whatever was touched; onTouchEndCapture is
  // the same hook PostHog's own autocapture uses. Neither takes the responder,
  // so the map, gestures and scrolling behave exactly as before. If a start is
  // ever missed the matching end is simply dropped, which loses a data point
  // and nothing else.
  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={onTouchStart}
      onTouchEndCapture={onTouchEnd}>
      {children}
    </View>
  )
}

export default AnalyticsProvider
