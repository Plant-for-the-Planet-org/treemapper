import React from 'react'
import {NavigationContainer} from '@react-navigation/native'
import RootNavigator from './src/navigation/RootNavigator'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {Provider} from 'react-redux'
import store, { persistor } from 'src/store'
import { PersistGate } from 'redux-persist/integration/react'

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  )
}
