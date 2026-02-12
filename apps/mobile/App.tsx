import 'src/utils/initializeServices'
import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
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



export default function App() {
  useEffect(() => {
    applyStoredLanguage()
  }, [])

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
                    <NavigationContainer>
                      <RootNavigator />
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
