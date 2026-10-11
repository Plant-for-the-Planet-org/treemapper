import 'src/utils/initializeServices'
import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { PostHogProvider } from 'posthog-react-native'
import { applyStoredLanguage } from 'src/locales'
import RootNavigator from './src/navigation/RootNavigator'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import store, { persister } from 'src/store'
import { PersistGate } from 'redux-persist/integration/react'
import { Auth0Provider } from 'react-native-auth0'
import { RealmProvider } from 'src/db/RealmProvider'
import 'src/utils/constants/mapboxLogger'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-get-random-values'
import { ToastProvider } from 'react-native-toast-notifications'
import { StatusBar } from 'expo-status-bar'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { useKeepAwake } from 'expo-keep-awake'
import { TourGuideProvider, TourGuideOverlay } from '@wrack/react-native-tour-guide'
import AnalyticsConsentGate from 'src/components/analytics/AnalyticsConsentGate'
import AppRatingGate from 'src/components/rating/AppRatingGate'


// PostHog is controlled entirely by env. There is no build-type fallback, so
// nothing is inferred from debug vs release:
//   EXPO_PUBLIC_POSTHOG_ENABLED=true  sends events to the dashboard
//   EXPO_PUBLIC_POSTHOG_DEBUG=true    logs every capture to the console
//
// Both fail closed: anything other than 'true', including unset, means off.
// Over-collecting by accident is worse than under-collecting, and an empty
// dashboard gets noticed while silent extra collection does not.
//
// The cost of that choice: a release build with ENABLED unset ships with
// analytics off and looks healthy. Setting it is part of the release checklist.
//
// EXPO_PUBLIC_* values are inlined at build time, so a change needs a restart
// with the cache cleared (`npx expo start -c`), not just a reload. Read each
// name directly: Expo cannot inline a computed or destructured key.
const analyticsDisabled = process.env.EXPO_PUBLIC_POSTHOG_ENABLED !== 'true'
const analyticsDebug = process.env.EXPO_PUBLIC_POSTHOG_DEBUG === 'true'


export default function App() {
  // Keeps the screen on for as long as the app is in the foreground, so a
  // long field session (mapping, recording trees) is never cut short by
  // auto-lock. The OS drops the lock on its own when the app backgrounds.
  useKeepAwake()
  // useEffect(() => {
  //   applyStoredLanguage()
  // }, [])

  return (
    <SafeAreaProvider>
      <StatusBar translucent />
      <Auth0Provider
        domain={process.env.EXPO_PUBLIC_AUTH0_DOMAIN}
        clientId={process.env.EXPO_PUBLIC_CLIENT_ID_AUTH0}>
        <RealmProvider>
          <Provider store={store}>
            <ToastProvider>
              <PersistGate loading={null} persistor={persister}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <TourGuideProvider>
                    <BottomSheetModalProvider>
                      <NavigationContainer>
                        <PostHogProvider
                          apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY}
                          debug={analyticsDebug}
                          options={{
                            host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
                            disabled: analyticsDisabled,
                          }}
                          autocapture={{
                            captureScreens: false,
                            captureTouches: true,
                          }}>
                          <RootNavigator />
                          {/* Needs PostHog and the rehydrated store, so it sits here. */}
                          <AnalyticsConsentGate />
                          <AppRatingGate />
                        </PostHogProvider>
                      </NavigationContainer>
                    </BottomSheetModalProvider>
                    <TourGuideOverlay />
                  </TourGuideProvider>
                </GestureHandlerRootView>
              </PersistGate>
            </ToastProvider>
          </Provider>
        </RealmProvider>
      </Auth0Provider>
    </SafeAreaProvider>
  )
}