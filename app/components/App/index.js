import MapboxGL from '@react-native-mapbox-gl/maps';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  HeaderStyleInterpolators,
  TransitionSpecs,
} from '@react-navigation/stack';
import React from 'react';
import Config from 'react-native-config';
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
} from '../';
import { auth0Logout, getNewAccessToken, getUserDetailsFromServer } from '../../actions/user';
import SpecieInfo from '../ManageSpecies/SpecieInfo';
import MigratingDB from '../MigratingDB';
import SpeciesLoading from '../SpeciesLoading';
import Provider from '../../reducers/provider';
import { getUserDetails } from '../../repositories/user';
import { dailyLogUpdateCheck } from '../../utils/logs';
import updateAndSyncLocalSpecies from '../../utils/updateAndSyncLocalSpecies';
import { migrateRealm } from '../../repositories/default';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../../utils/constants';
import { checkAndAddUserSpecies } from '../../utils/addUserSpecies';

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
  const [isDBMigrating, setIsDBMigrating] = React.useState(true);
  const [areSpeciesLoading, setAreSpeciesLoading] = React.useState(false);

  const checkIsUserLogin = async () => {
    const dbUserDetails = await getUserDetails();

    if (dbUserDetails && dbUserDetails.refreshToken) {
      const newAccessToken = await getNewAccessToken(dbUserDetails.refreshToken);
      if (newAccessToken) {
        // fetches the user details from server by passing the accessToken which is used while requesting the API
        getUserDetailsFromServer(newAccessToken);
        checkAndAddUserSpecies();
      } else {
        auth0Logout();
      }
    }
  };

  React.useEffect(() => {
    // calls the migration function to migrate the realm with [setIsDBMigrating]
    // as callback param which changes the [isDBMigrating] state.
    migrateRealm(setIsDBMigrating)
      .then(() => {
        // logs success in DB
        dbLog.info({
          logType: LogTypes.OTHER,
          message: 'DB migration successfully done',
        });

        // calls this function to update the species in the realm DB with [setAreSpeciesLoading]
        // as callback param which changes the [areSpeciesLoading] state
        updateAndSyncLocalSpecies((isLoading) => {
          // sets [isDBMigrating = false] to hide the MigratingDB screen
          setAreSpeciesLoading(isLoading);
          setIsDBMigrating(false);
        })
          .then(() => {
            // sets [isDBMigrating = false] to hide the MigratingDB screen
            setIsDBMigrating(false);
            setAreSpeciesLoading(false);
            checkIsUserLogin();
            dailyLogUpdateCheck();
          })
          .catch((err) => {
            // sets [isDBMigrating = false] to hide the MigratingDB screen
            setIsDBMigrating(false);
            setAreSpeciesLoading(false);
            checkIsUserLogin();
            dailyLogUpdateCheck();
          });
      })
      .catch((err) => {
        // sets [isDBMigrating = false] to hide the MigratingDB screen
        setIsDBMigrating(false);
        console.error(`Error while setting up realm connection - App, ${JSON.stringify(err)}`);
      });
  }, []);

  return (
    <Provider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={
            isDBMigrating ? 'MigratingDB' : areSpeciesLoading ? 'SpeciesLoading' : 'MainScreen'
          }
          headerMode={'none'}>
          {isDBMigrating ? (
            <Stack.Screen name="MigratingDB" component={MigratingDB} />
          ) : areSpeciesLoading ? (
            <Stack.Screen name="SpeciesLoading" component={SpeciesLoading} />
          ) : (
            <>
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
              <Stack.Screen name="Logs" component={Logs} options={MyTransition} />
              <Stack.Screen name="ManageSpecies" component={ManageSpecies} option={MyTransition} />
              <Stack.Screen name="SpecieInfo" component={SpecieInfo} option={MyTransition} />
              <Stack.Screen name="Legals" component={Legals} options={MyTransition} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;
