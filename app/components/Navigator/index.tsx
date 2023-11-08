import { StatusBar, Platform, View } from 'react-native';
import React, { useEffect, useContext } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { Colors } from '../../styles';
import MainNavigator from './MainNavigator';
import { UserContext } from '../../reducers/user';
import { dailyLogUpdateCheck } from '../../utils/logs';
import { InventoryContext } from '../../reducers/inventory';
import { NavigationContext } from '../../reducers/navigation';
import InitialLoadingNavigator from './InitialLoadingNavigator';
import { checkLoginAndSync } from '../../utils/checkLoginAndSync';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Stack = createStackNavigator();
const isAndroid = Platform.OS === 'android';
const screenOptions = { headerShown: false };

export default function AppNavigator() {
  const { showInitialStack } = useContext(NavigationContext);
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();
  const { state: inventoryState, dispatch } = useContext(InventoryContext);
  const { state: userState, dispatch: userDispatch } = useContext(UserContext);

  // const autoSync = () => {
  //   if (netInfo.isConnected && netInfo.isInternetReachable) {
  //     checkLoginAndSync({
  //       sync: true,
  //       inventoryState,
  //       dispatch: dispatch,
  //       userDispatch: userDispatch,
  //       connected: netInfo.isConnected,
  //       internet: netInfo.isInternetReachable,
  //     });
  //   }
  // };

  useEffect(() => {
    if (!showInitialStack) {
      checkLoginAndSync({
        sync: false,
        inventoryState,
        dispatch: dispatch,
        userDispatch: userDispatch,
        connected: netInfo.isConnected,
        internet: netInfo.isInternetReachable,
      });
      dailyLogUpdateCheck();
    }
  }, [showInitialStack, inventoryState.fetchNecessaryInventoryFlag, userState.accessToken]);

  // useEffect(() => {
  //   if (!showInitialStack) {
  //     autoSync();
  //   }
  // }, [netInfo, inventoryState.fetchNecessaryInventoryFlag, userState.accessToken]);

  return (
    <NavigationContainer>
      <StatusBar barStyle={'dark-content'} backgroundColor={Colors.WHITE} />
      <Stack.Navigator screenOptions={screenOptions}>
        {showInitialStack ? (
          <Stack.Screen name="InitialLoading" component={InitialLoadingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
