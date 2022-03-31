import MapboxGL from '@react-native-mapbox-gl/maps';
import React from 'react';
import Config from 'react-native-config';
import 'react-native-gesture-handler';
import ReducerProvider from '../../reducers/provider';
import AppNavigator from '../Navigator';
import { store } from '../../redux/store';
import { Provider } from 'react-redux';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const App = () => {
  return (
    <Provider store={store}>
      <ReducerProvider>
        <AppNavigator />
      </ReducerProvider>
    </Provider>
  );
};

export default App;
