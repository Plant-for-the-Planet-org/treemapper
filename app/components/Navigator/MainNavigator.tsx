import React from 'react';
import {
  TransitionSpecs,
  createStackNavigator,
  StackNavigationOptions,
  HeaderStyleInterpolators,
} from '@react-navigation/stack';
import 'react-native-gesture-handler';

import {
  Logs,
  Legals,
  SignUp,
  MainScreen,
  SavedAreas,
  LocateTree,
  ManageUsers,
  DownloadMap,
  RegisterTree,
  CreatePolygon,
  SelectProject,
  ManageSpecies,
  SelectSpecies,
  TreeInventory,
  LogoutWarning,
  ManageProjects,
  SampleTreesCount,
  SpecieSampleTree,
  UploadedInventory,
  SelectCoordinates,
  TotalTreesSpecies,
  InventoryOverview,
  RecordSampleTrees,
  RegisterSingleTree,
  SingleTreeOverview,
} from '../';
import AdditionalData from '../AdditionalData';
import SpecieInfo from '../ManageSpecies/SpecieInfo';
import AddMetadata from '../AdditionalData/AddMetadata';
import EditPolygon from '../InventoryOverview/EditPolygon';
import SelectElement from '../AdditionalData/SelectElement';
import AddEditElement from '../AdditionalData/AddEditElement';
import { AddMeasurements } from '../SelectSpecies/AddMeasurements';
import AdditionalDataForm from '../AdditionalData/AdditionalDataForm';
import AdditionalDataSettings from '../AdditionalData/AdditionalDataSettings';

const Stack = createStackNavigator();
const screenOptions = { headerShown: false };

const MyTransition: StackNavigationOptions = {
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
    <Stack.Navigator initialRouteName="MainScreen" screenOptions={screenOptions}>
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
      <Stack.Screen name="ManageSpecies" component={ManageSpecies} options={MyTransition} />
      <Stack.Screen name="SpecieInfo" component={SpecieInfo} options={MyTransition} />
      <Stack.Screen name="Legals" component={Legals} options={MyTransition} />
      <Stack.Screen name="SampleTreesCount" component={SampleTreesCount} options={MyTransition} />
      <Stack.Screen name="RecordSampleTrees" component={RecordSampleTrees} options={MyTransition} />
      <Stack.Screen name="TotalTreesSpecies" component={TotalTreesSpecies} options={MyTransition} />
      <Stack.Screen name="LogoutWarning" component={LogoutWarning} options={MyTransition} />
      <Stack.Screen name="AdditionalData" component={AdditionalData} options={MyTransition} />
      <Stack.Screen name="AddEditElement" component={AddEditElement} options={MyTransition} />
      <Stack.Screen name="ManageProjects" component={ManageProjects} options={MyTransition} />
      <Stack.Screen name="SelectElement" component={SelectElement} options={MyTransition} />
      <Stack.Screen
        name="AdditionalDataForm"
        component={AdditionalDataForm}
        options={MyTransition}
      />
      <Stack.Screen name="AddMetadata" component={AddMetadata} options={MyTransition} />
      <Stack.Screen
        name="AdditionalDataSettings"
        component={AdditionalDataSettings}
        options={MyTransition}
      />
      <Stack.Screen name="SpecieSampleTree" component={SpecieSampleTree} options={MyTransition} />
      <Stack.Screen name="AddMeasurements" component={AddMeasurements} options={MyTransition} />
      <Stack.Screen name="EditPolygon" component={EditPolygon} options={MyTransition} />
    </Stack.Navigator>
  );
}
