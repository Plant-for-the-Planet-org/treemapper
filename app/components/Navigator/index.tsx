import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useNetInfo} from '@react-native-community/netinfo';
import {NavigationContext} from '../../reducers/navigation';
import React, {useEffect, useContext} from 'react';
import {dailyLogUpdateCheck} from '../../utils/logs';
import InitialLoadingNavigator from './InitialLoadingNavigator';
import MainNavigator from './MainNavigator';
import {checkLoginAndSync} from '../../utils/checkLoginAndSync';
import {UserContext} from '../../reducers/user';
import {InventoryContext} from '../../reducers/inventory';
import {StatusBar, Platform} from 'react-native';
import {Colors} from '../../styles';

const Stack = createStackNavigator();
const isAndroid = Platform.OS === 'android';

export default function AppNavigator() {
  const {showInitialStack} = React.useContext(NavigationContext);
  const netInfo = useNetInfo();
  const {state: inventoryState, dispatch} = useContext(InventoryContext);
  const {dispatch: userDispatch} = useContext(UserContext);

  const autoSync = () => {
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      checkLoginAndSync({
        sync: true,
        inventoryState,
        dispatch: dispatch,
        userDispatch: userDispatch,
        connected: netInfo.isConnected,
        internet: netInfo.isInternetReachable,
      });
    }
  };

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
  }, [showInitialStack, inventoryState.fetchNecessaryInventoryFlag]);

  useEffect(() => {
    if (!showInitialStack) {
      autoSync();
    }
  }, [netInfo, inventoryState.fetchNecessaryInventoryFlag]);

  return (
    <NavigationContainer>
      <StatusBar
        backgroundColor={Colors.PRIMARY}
        barStyle={isAndroid ? 'light-content' : 'dark-content'}
      />
      <Stack.Navigator headerMode="none">
        {showInitialStack ? (
          <Stack.Screen name="InitialLoading" component={InitialLoadingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
