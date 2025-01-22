import React from 'react'
import {NavigationContainer} from '@react-navigation/native'
import RootNavigator from './src/navigation/RootNavigator'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {Provider as ReduxProvider} from 'react-redux'
import store, {persister} from 'src/store'
import {PersistGate} from 'redux-persist/integration/react'
import MapLibreGL from '@maplibre/maplibre-react-native'
import {Auth0Provider} from 'react-native-auth0'
import {RealmProvider} from 'src/db/RealmProvider'
import 'src/utils/constants/mapboxLogger'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import 'react-native-get-random-values'
import {ToastProvider} from 'react-native-toast-notifications'
import {StatusBar} from 'expo-status-bar'
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet'
import Bugsnag from '@bugsnag/expo'
import BugSnagConfig from 'src/utils/bugsnag/bugsnag.config'
import {Dripsy} from 'dashboard/provider/dripsy'

Bugsnag.start(BugSnagConfig)
MapLibreGL.setAccessToken(null)

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar translucent />
      <Auth0Provider
        domain={process.env.EXPO_PUBLIC_AUTH0_DOMAIN}
        clientId={process.env.EXPO_PUBLIC_CLIENT_ID_AUTH0}>
        <RealmProvider>
          <ReduxProvider store={store}>
            <ToastProvider>
              <PersistGate loading={null} persistor={persister}>
                <GestureHandlerRootView style={{flex: 1}}>
                  <BottomSheetModalProvider>
                    <NavigationContainer>
                      <Dripsy>
                        <RootNavigator />
                      </Dripsy>
                    </NavigationContainer>
                  </BottomSheetModalProvider>
                </GestureHandlerRootView>
              </PersistGate>
            </ToastProvider>
          </ReduxProvider>
        </RealmProvider>
      </Auth0Provider>
    </SafeAreaProvider>
  )
}
