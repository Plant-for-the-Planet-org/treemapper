import React from 'react';
import 'react-native-gesture-handler';
import Config from 'react-native-config';
import MapboxGL from '@react-native-mapbox-gl/maps';

import '../../utils/ignoreWarnings';
import AppNavigator from '../Navigator';
import Provider from '../../reducers/provider';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const App = () => {
  return (
    <Provider>
      <AppNavigator />
    </Provider>
  );
};

export default App;
