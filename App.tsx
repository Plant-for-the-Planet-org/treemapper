import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import RootNavigator from './src/navigation/RootNavigator'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import store, { persistor } from 'src/store'
import { PersistGate } from 'redux-persist/integration/react'
import 'react-native-gesture-handler'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { Auth0Provider } from 'react-native-auth0'
import { RealmProvider } from 'src/db/RealmProvider'
import 'src/utils/constants/mapboxLogger'
import 'react-native-gesture-handler'
import 'react-native-get-random-values'

MapLibreGL.setAccessToken(null)

export default function App() {
  return (
    <SafeAreaProvider>
      <Auth0Provider
        domain={process.env.EXPO_PUBLIC_AUTH0_DOMAIN}
        clientId={process.env.EXPO_PUBLIC_CLIENT_ID_AUTH0}>
        <RealmProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </PersistGate>
          </Provider>
        </RealmProvider>
      </Auth0Provider>
    </SafeAreaProvider>
  )
}
