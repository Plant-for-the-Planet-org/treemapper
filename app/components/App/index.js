import MapboxGL from '@react-native-mapbox-gl/maps';
import React from 'react';
import Config from 'react-native-config';
import 'react-native-gesture-handler';
import Provider from '../../reducers/provider';
import AppNavigator from '../Navigator';
import { Auth0Provider } from 'react-native-auth0';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const App = () => {
  return (
    <Auth0Provider domain={Config.AUTH0_DOMAIN} clientId={Config.AUTH0_CLIENT_ID}>
      <Provider>
        <AppNavigator />
      </Provider>
    </Auth0Provider>
  );
};

export default App;
