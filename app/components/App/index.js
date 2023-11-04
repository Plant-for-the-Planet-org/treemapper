import React from 'react';
import 'react-native-gesture-handler';
import Config from 'react-native-config';
import MapLibreGL from '@maplibre/maplibre-react-native';

import '../../utils/ignoreWarnings';
import AppNavigator from '../Navigator';
import Provider from '../../reducers/provider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Realm, RealmProvider, useRealm, useQuery } from '@realm/react';
import { getSchema } from '../../repositories/default';

MapLibreGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const App = () => {
  console.log(getSchema().schema);
  return (
    <SafeAreaProvider>
      <RealmProvider schema={getSchema().schema}>
        <Provider>
          <AppNavigator />
        </Provider>
      </RealmProvider>
    </SafeAreaProvider>
  );
};

export default App;
