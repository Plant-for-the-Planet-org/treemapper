import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNetInfo } from '@react-native-community/netinfo';
import { NavigationContext } from '../../reducers/navigation';
import React, { useEffect, useContext } from 'react';
import { dailyLogUpdateCheck } from '../../utils/logs';
import InitialLoadingNavigator from './InitialLoadingNavigator';
import MainNavigator from './MainNavigator';
import { checkLoginAndSync } from '../../utils/checkLoginAndSync';
import { UserContext } from '../../reducers/user';
import { InventoryContext } from '../../reducers/inventory';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { state } = React.useContext(NavigationContext);
  const netInfo = useNetInfo();
  const { dispatch } = useContext(InventoryContext);
  const { dispatch: userDispatch } = useContext(UserContext);

  const autoSync = () => {
    console.log(netInfo.type, 'netInfo.type', netInfo.isConnected);
    if (netInfo.isConnected) {
      console.log('connected');
      checkLoginAndSync({
        sync: true,
        dispatch: dispatch,
        userDispatch: userDispatch,
        internet: netInfo.isConnected,
      });
    }
  };

  useEffect(() => {
    if (!state.showInitialStack) {
      checkLoginAndSync({ sync: false, internet: netInfo.isConnected });
      dailyLogUpdateCheck();
    }
  }, [state.showInitialStack]);

  useEffect(() => {
    if (!state.showInitialStack) {
      autoSync();
    }
  }, [netInfo]);

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
