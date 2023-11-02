import React from 'react';
import 'react-native-gesture-handler';
import Config from 'react-native-config';
import MapLibreGL from '@maplibre/maplibre-react-native';

import '../../utils/ignoreWarnings';
import AppNavigator from '../Navigator';
import Provider from '../../reducers/provider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
MapLibreGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const App = () => {
  return (
    <SafeAreaProvider>
      <Provider>
        <AppNavigator />
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;
