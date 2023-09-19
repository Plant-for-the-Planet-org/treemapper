import React from 'react';
import 'react-native-gesture-handler';
import Config from 'react-native-config';
import MapLibreGL from '@maplibre/maplibre-react-native';

import '../../utils/ignoreWarnings';
import AppNavigator from '../Navigator';
import Provider from '../../reducers/provider';

MapLibreGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const App = () => {
  return (
    <Provider>
      <AppNavigator />
    </Provider>
  );
};

export default App;
