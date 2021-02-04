import MapboxGL from '@react-native-mapbox-gl/maps';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import {
  createStackNavigator,
  HeaderStyleInterpolators,
  TransitionSpecs,
} from '@react-navigation/stack';
import React, { useContext } from 'react';
import Config from 'react-native-config';
import 'react-native-gesture-handler';
import {
  AddSpecies,
  CreatePolygon,
  DownloadMap,
  InventoryOverview,
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
} from '../';
import {
  checkErrorCode,
  clearUserDetails,
  getUserDetailsFromServer,
  setUserDetails,
  getNewAccessToken,
  auth0Logout,
} from '../../actions/user';
import Provider from '../../reducers/provider';
import { UserContext } from '../../reducers/user';
import { getUserDetails } from '../../repositories/user';
import { dailyLogUpdateCheck } from '../../utils/logs';
import updateLocalSpecies from '../../utils/updateLocalSpecies';

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
  const checkIsUserLogin = async () => {
    console.log('checkIsUserLogin =>');

    const dbUserDetails = await getUserDetails();
    console.log('dbUserDetails =>', dbUserDetails);
    if (dbUserDetails && dbUserDetails.refreshToken) {
      const newAccessToken = await getNewAccessToken(dbUserDetails.refreshToken);
      if (newAccessToken) {
        // fetches the user details from server by passing the accessToken which is used while requesting the API
        getUserDetailsFromServer(newAccessToken);
      } else {
        auth0Logout();
      }
    }
  };
  React.useEffect(() => {
    checkIsUserLogin();
    updateLocalSpecies();
    dailyLogUpdateCheck();
  }, []);
  return (
    <Provider>
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
          <Stack.Screen name="SelectSpecies" component={SelectSpecies} options={MyTransition} />
          <Stack.Screen name="AddSpecies" component={AddSpecies} options={MyTransition} />
          <Stack.Screen name="Logs" component={Logs} options={MyTransition} />
          <Stack.Screen name="ManageSpecies" component={ManageSpecies} option={MyTransition} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;
