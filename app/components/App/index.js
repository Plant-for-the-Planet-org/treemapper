import MapboxGL from '@rnmapbox/maps';
import React from 'react';
import Config from 'react-native-config';
import 'react-native-gesture-handler';
import Provider from '../../reducers/provider';
import AppNavigator from '../Navigator';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const App = () => {
  return (
    <Provider>
      <AppNavigator />
    </Provider>
  );
};

export default App;
