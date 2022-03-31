import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNetInfo } from '@react-native-community/netinfo';
import { NavigationContext } from '../../reducers/navigation';
import React, { useEffect, useContext, useRef, useState } from 'react';
import { dailyLogUpdateCheck } from '../../utils/logs';
import InitialLoadingNavigator from './InitialLoadingNavigator';
import MainNavigator from './MainNavigator';
import { checkLoginAndSync } from '../../utils/checkLoginAndSync';
import { UserContext } from '../../reducers/user';
import { InventoryContext } from '../../reducers/inventory';
import { StatusBar, Platform } from 'react-native';
import { Colors } from '../../styles';
import Geolocation from 'react-native-geolocation-service';
import { useDispatch } from 'react-redux';
import { setGPSAccuracy, setPosition } from '../../redux/deviceDetailsSlice';
import { closeModal, openModal } from '../../redux/modalSlice';
import i18next from 'i18next';
import { callWatchPositionOnScreens } from '../../utils/navigation';
import { watchPositionOptions } from '../../utils/maps';

const Stack = createStackNavigator();
const isAndroid = Platform.OS === 'android';

export default function AppNavigator() {
  const [currentRouteName, setCurrentRouteName] = useState('');
  const [watchId, setWatchId] = useState<number | null>(null);

  const { showInitialStack } = React.useContext(NavigationContext);
  const netInfo = useNetInfo();
  const { dispatch: inventoryDispatch } = useContext(InventoryContext);
  const { dispatch: userDispatch } = useContext(UserContext);
  const dispatch = useDispatch();

  const navigationRef = useRef();

  const autoSync = () => {
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      checkLoginAndSync({
        sync: true,
        dispatch: inventoryDispatch,
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
        dispatch: inventoryDispatch,
        userDispatch: userDispatch,
        connected: netInfo.isConnected,
        internet: netInfo.isInternetReachable,
      });
      dailyLogUpdateCheck();
    }
  }, [showInitialStack]);

  useEffect(() => {
    if (!showInitialStack) {
      autoSync();
    }
  }, [netInfo]);

  const watchPosition = () => {
    return Geolocation.watchPosition(
      position => {
        dispatch(setGPSAccuracy(position.coords.accuracy));
        dispatch(setPosition(position));
      },
      err => {
        dispatch(
          openModal({
            heading: i18next.t('label.location_service'),
            message: i18next.t('label.location_service_message'),
            primaryButtonText: isAndroid ? i18next.t('label.ok') : i18next.t('label.open_settings'),
            showSecondaryButton: true,
            secondaryButtonText: i18next.t('label.back'),
          }),
        );
      },
      watchPositionOptions,
    );
  };

  // on every route change it checks if [watchPosition] needs to be called or not
  // [callWatchPositionOnScreens] array is used to determine the screens on
  // which watchPosition needs to be called.
  // It clears the watchPosition if the current route is not in the array
  // useEffect(() => {
  //   if (callWatchPositionOnScreens.includes(currentRouteName)) {
  //     setWatchId(watchPosition());
  //   } else if (watchId !== null && watchId !== undefined) {
  //     Geolocation.clearWatch(watchId);
  //     setWatchId(null);
  //   }

  //   return () => {
  //     if (watchId !== null && watchId !== undefined) {
  //       Geolocation.clearWatch(watchId);
  //       setWatchId(null);
  //     }
  //   };
  // }, [currentRouteName]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={async () => {
        const routeName = navigationRef?.current?.getCurrentRoute().name;
        setCurrentRouteName(routeName || '');
      }}>
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
