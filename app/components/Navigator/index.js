import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContext } from '../../reducers/navigation';
import React from 'react';
import { auth0Logout, getNewAccessToken, getUserDetailsFromServer } from '../../actions/user';
import { getUserDetails } from '../../repositories/user';
import { checkAndAddUserSpecies } from '../../utils/addUserSpecies';
import { dailyLogUpdateCheck } from '../../utils/logs';
import InitialLoadingNavigator from './InitialLoadingNavigator';
import MainNavigator from './MainNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { state } = React.useContext(NavigationContext);

  const checkIsUserLogin = async () => {
    const dbUserDetails = await getUserDetails();
    console.log(dbUserDetails, 'dbUserDetails');
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
    if (!state.showInitialStack) {
      checkIsUserLogin();
      dailyLogUpdateCheck();
    }
  }, [state.showInitialStack]);

  return (
    <NavigationContainer>
      <Stack.Navigator headerMode="none">
        {state.showInitialStack ? (
          <Stack.Screen name="InitialLoading" component={InitialLoadingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
