import 'src/utils/initializeServices'
import React, { useCallback, useMemo } from 'react'
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native'
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
import AnalyticsProvider from 'src/components/analytics/AnalyticsProvider'
import {
  getAnalyticsClient,
  resolveActiveRoute,
  trackScreenChange,
} from 'src/utils/analytics'



export default function App() {
  // useEffect(() => {
  //   applyStoredLanguage()
  // }, [])

  // The same instance non-React code uses (customFetch, sync, GPS). Handing
  // it to the provider keeps every event on one client and one session id.
  const posthogClient = useMemo(() => getAnalyticsClient(), [])
  const navigationRef = useNavigationContainerRef()

  // Screen views are sent by hand because PostHog's captureScreens autocapture
  // only supports @react-navigation/native v6 and below, and this app is on
  // v7. See src/utils/analytics/screenTracking.ts.
  const captureCurrentScreen = useCallback((state?: unknown) => {
    const route = resolveActiveRoute(state ?? navigationRef.getRootState())
    if (route) {
      trackScreenChange(route.name, route.depth)
    }
  }, [navigationRef])

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
                  <BottomSheetModalProvider>
                    <NavigationContainer
                      ref={navigationRef}
                      onReady={() => captureCurrentScreen()}
                      onStateChange={(state) => captureCurrentScreen(state)}>
                      <PostHogProvider
                        client={posthogClient}
                        debug={__DEV__}
                        autocapture={{
                          captureScreens: false,
                          captureTouches: true,
                        }}>
                        <AnalyticsProvider>
                          <RootNavigator />
                        </AnalyticsProvider>
                      </PostHogProvider>
                    </NavigationContainer>
                  </BottomSheetModalProvider>
                </GestureHandlerRootView>
              </PersistGate>
            </ToastProvider>
          </Provider>
        </RealmProvider>
      </Auth0Provider>
    </SafeAreaProvider>
  )
}
