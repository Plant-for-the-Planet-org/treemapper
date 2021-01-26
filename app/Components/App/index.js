import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { StateProvider } from '../../Actions/store';
import { TransitionSpecs, HeaderStyleInterpolators } from '@react-navigation/stack';
import 'react-native-gesture-handler';
import {
  RegisterTree,
  SelectProject,
  LocateTree,
  CreatePolygon,
  TreeInventory,
  InventoryOverview,
  MainScreen,
  SavedAreas,
  DownloadMap,
  RegisterSingleTree,
  SingleTreeOverview,
  SelectCoordinates,
  ManageUsers,
  SignUp,
  UploadedInventory,
  SelectSpecies,
  AddSpecies,
  ManageSpecies
} from '../';
import Config from 'react-native-config';
import MapboxGL from '@react-native-mapbox-gl/maps';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

const Stack = createStackNavigator();

const MyTransition = {
  gestureDirection: 'vertical',
  transitionSpec: {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
  },
  headerStyleInterpolator: HeaderStyleInterpolators.forFade,
  cardStyleInterpolator: ({ current, next, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
};

const App = () => {
  return (
    <StateProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MainScreen" headerMode={'none'}>
          <Stack.Screen name="MainScreen" component={MainScreen} options={MyTransition} />
          <Stack.Screen name="TreeInventory" component={TreeInventory} options={MyTransition} />
          <Stack.Screen name="RegisterTree" component={RegisterTree} options={MyTransition} />
          <Stack.Screen name="SelectProject" component={SelectProject} options={MyTransition} />
          <Stack.Screen name="LocateTree" component={LocateTree} options={MyTransition} />
          <Stack.Screen name="CreatePolygon" component={CreatePolygon} options={MyTransition} />
          <Stack.Screen
            name="InventoryOverview"
            component={InventoryOverview}
            options={MyTransition}
          />
          <Stack.Screen name="SavedAreas" component={SavedAreas} options={MyTransition} />
          <Stack.Screen name="DownloadMap" component={DownloadMap} options={MyTransition} />
          <Stack.Screen
            name="RegisterSingleTree"
            component={RegisterSingleTree}
            options={MyTransition}
          />
          <Stack.Screen
            name="SingleTreeOverview"
            component={SingleTreeOverview}
            options={MyTransition}
          />
          <Stack.Screen
            name="SelectCoordinates"
            component={SelectCoordinates}
            options={MyTransition}
          />
          <Stack.Screen name="ManageUsers" component={ManageUsers} options={MyTransition} />
          <Stack.Screen name="SignUp" component={SignUp} options={MyTransition} />
          <Stack.Screen
            name="UploadedInventory"
            component={UploadedInventory}
            options={MyTransition}
          />
          <Stack.Screen name='SelectSpecies' component={SelectSpecies} options={MyTransition} />
          <Stack.Screen
            name="AddSpecies"
            component={AddSpecies}
            options={MyTransition}
          />
          <Stack.Screen name='ManageSpecies' component={ManageSpecies} option={MyTransition}/>
        </Stack.Navigator>
      </NavigationContainer>
    </StateProvider>
  );
};

export default App;
