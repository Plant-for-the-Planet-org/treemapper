import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuid } from 'uuid';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Localization from 'expo-localization';
import { OneSignal } from 'react-native-onesignal';
import { registerUserDevice } from '../api/api.fetch';
import { DeviceRegistrationParams } from '../types/type/device.type';

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
  const registerDevice = useCallback(async (): Promise<boolean> => {
    try {
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
        locale: Localization.locale || undefined,
        timezone: Localization.timezone || undefined,
        notificationPermission: hasPermission,
        isActive: true,
      };

      const { success } = await registerUserDevice(params);
      return success;
    } catch (error) {
      return false;
    }
  }, []);

  return { registerDevice };
};

export default useDeviceRegistration;
