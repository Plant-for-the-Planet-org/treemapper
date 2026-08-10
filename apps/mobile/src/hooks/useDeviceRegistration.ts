import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuid } from 'uuid';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Localization from 'expo-localization';
import { OneSignal } from 'react-native-onesignal';
import NetInfo from '@react-native-community/netinfo';
import Bugsnag from '@bugsnag/expo';
import { registerUserDevice } from '../api/api.fetch';
import { DeviceRegistrationParams } from '../types/type/device.type';
import { RootState } from 'src/store';

const DEVICE_ID_KEY = 'device-id';

const getOrCreateDeviceId = async (): Promise<string> => {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuid();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

const getOneSignalData = async (): Promise<{ oneSignalId: string | null; hasPermission: boolean }> => {
  try {
    const oneSignalId = await OneSignal.User.getOnesignalId();
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();
    return { oneSignalId, hasPermission };
  } catch (error) {
    return { oneSignalId: null, hasPermission: false };
  }
};

const useDeviceRegistration = () => {
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn);
  // Prevents overlapping calls when login and foreground events fire close together.
  const inFlightRef = useRef(false);

  const registerDevice = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) {
      return false;
    }
    inFlightRef.current = true;
    try {
      // No internet: skip silently. The next app-open will retry.
      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        return false;
      }

      const deviceId = await getOrCreateDeviceId();
      const { oneSignalId, hasPermission } = await getOneSignalData();

      const params: DeviceRegistrationParams = {
        deviceId,
        oneSignalId: oneSignalId || undefined,
        deviceOs: Device.osName || undefined,
        deviceName: Device.deviceName || undefined,
        deviceModel: Device.modelName || undefined,
        osVersion: Device.osVersion || undefined,
        appVersion: Application.nativeApplicationVersion || undefined,
        locale: Localization.getLocales()[0]?.languageTag || undefined,
        timezone: Localization.getCalendars()[0]?.timeZone || undefined,
        notificationPermission: hasPermission,
        isActive: true,
      };

      const { success } = await registerUserDevice(params);
      return success;
    } catch (error) {
      // Silent for the user; reported for us.
      Bugsnag.notify(error as Error);
      return false;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Run once after login (and on a cold start while already logged in), then
  // again every time the app returns to the foreground. The internet check
  // lives inside registerDevice, so offline opens are skipped quietly.
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    registerDevice();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        registerDevice();
      }
    });

    return () => subscription.remove();
  }, [isLoggedIn, registerDevice]);

  return { registerDevice };
};

export default useDeviceRegistration;
