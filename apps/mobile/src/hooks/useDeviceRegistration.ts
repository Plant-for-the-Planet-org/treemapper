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
import { collectDeviceTelemetry } from '../utils/helpers/deviceTelemetry';
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

// Marks this device inactive so the dashboard stops treating a signed-out
// phone as a live push target. Must run while the access token is still in the
// store, so call it before clearing the session.
//
// Best-effort by design: a device that logs out with no connection stays marked
// active until someone signs in on it again. Failing the logout over this would
// be worse than a stale flag.
export const deactivateCurrentDevice = async (): Promise<boolean> => {
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      return false;
    }

    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    // Never registered on this install, so there is nothing to deactivate.
    if (!deviceId) {
      return false;
    }

    // Only isActive is sent. The OS notification permission has not changed
    // just because the user signed out, and an inactive device is already
    // excluded from every send.
    const { success } = await registerUserDevice({ deviceId, isActive: false });
    return success;
  } catch (error) {
    Bugsnag.notify(error as Error);
    return false;
  }
};

// nativeBuildVersion is a string on both platforms ("421", "1.2.3" on some
// Android setups). Only a clean integer is sent; the dashboard needs it to be
// comparable.
const getAppBuild = (): number | undefined => {
  const raw = Application.nativeBuildVersion;
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const useDeviceRegistration = () => {
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn);
  const lastSyncDate = useSelector((state: RootState) => state.appState.lastSyncDate);
  // Prevents overlapping calls when login and foreground events fire close together.
  const inFlightRef = useRef(false);
  // Read inside the callback so registerDevice keeps a stable identity and the
  // AppState listener is not torn down and rebuilt on every sync.
  const lastSyncDateRef = useRef(lastSyncDate);
  lastSyncDateRef.current = lastSyncDate;

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
        appBuild: getAppBuild(),
        locale: Localization.getLocales()[0]?.languageTag || undefined,
        timezone: Localization.getCalendars()[0]?.timeZone || undefined,
        notificationPermission: hasPermission,
        isActive: true,
        ...collectDeviceTelemetry(net, lastSyncDateRef.current),
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
