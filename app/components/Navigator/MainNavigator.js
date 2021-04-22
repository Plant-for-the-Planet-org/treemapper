import {
  createStackNavigator,
  HeaderStyleInterpolators,
  TransitionSpecs,
} from '@react-navigation/stack';
import React from 'react';
import 'react-native-gesture-handler';
import {
  CreatePolygon,
  DownloadMap,
  InventoryOverview,
  Legals,
  LocateTree,
  Logs,
  MainScreen,
  ManageSpecies,
  ManageUsers,
  RegisterSingleTree,
  RegisterTree,
  SavedAreas,
  SelectCoordinates,
  SelectProject,
  SelectSpecies,
  SignUp,
  SingleTreeOverview,
  TreeInventory,
  UploadedInventory,
  SampleTreesCount,
  RecordSampleTrees,
  TotalTreesSpecies,
  LogoutWarning,
} from '../';
import SpecieInfo from '../ManageSpecies/SpecieInfo';

const Stack = createStackNavigator();

const MyTransition = {
  gestureDirection: 'vertical',
  transitionSpec: {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
  },
  headerStyleInterpolator: HeaderStyleInterpolators.forFade,
  cardStyleInterpolator: ({ current, layouts }) => {
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

export default function MainNavigator() {
  return (
    <Stack.Navigator initialRouteName="MainScreen" headerMode="none">
      <Stack.Screen name="MainScreen" component={MainScreen} options={MyTransition} />
      <Stack.Screen name="TreeInventory" component={TreeInventory} options={MyTransition} />
      <Stack.Screen name="RegisterTree" component={RegisterTree} options={MyTransition} />
      <Stack.Screen name="SelectProject" component={SelectProject} options={MyTransition} />
      <Stack.Screen name="LocateTree" component={LocateTree} options={MyTransition} />
      <Stack.Screen name="CreatePolygon" component={CreatePolygon} options={MyTransition} />
      <Stack.Screen name="InventoryOverview" component={InventoryOverview} options={MyTransition} />
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
      <Stack.Screen name="SelectCoordinates" component={SelectCoordinates} options={MyTransition} />
      <Stack.Screen name="ManageUsers" component={ManageUsers} options={MyTransition} />
      <Stack.Screen name="SignUp" component={SignUp} options={MyTransition} />
      <Stack.Screen name="UploadedInventory" component={UploadedInventory} options={MyTransition} />
      <Stack.Screen name="SelectSpecies" component={SelectSpecies} options={MyTransition} />
      <Stack.Screen name="Logs" component={Logs} options={MyTransition} />
      <Stack.Screen name="ManageSpecies" component={ManageSpecies} option={MyTransition} />
      <Stack.Screen name="SpecieInfo" component={SpecieInfo} option={MyTransition} />
      <Stack.Screen name="Legals" component={Legals} options={MyTransition} />
      <Stack.Screen name="SampleTreesCount" component={SampleTreesCount} options={MyTransition} />
      <Stack.Screen name="RecordSampleTrees" component={RecordSampleTrees} options={MyTransition} />
      <Stack.Screen name="TotalTreesSpecies" component={TotalTreesSpecies} options={MyTransition} />
      <Stack.Screen name="LogoutWarning" component={LogoutWarning} options={MyTransition} />
    </Stack.Navigator>
  );
}
