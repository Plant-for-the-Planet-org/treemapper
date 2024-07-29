import * as Device from 'expo-device';
import * as Applications from 'expo-application';

export const getDeviceDetails = () => {
  try {
    return {
      "Device Brand": Device.brand,
      'Device Model': Device.modelName,
      "Device Manufacturer": Device.manufacturer,
      "Device System Name": Device.osName,
      "Device OS": Device.osVersion,
      "App Version": Applications.nativeApplicationVersion,
    };
  } catch (error) {
    return {
      "App Version": Applications.nativeApplicationVersion,
      "Device Brand": "",
      'Device Model': "",
      "Device Manufacturer": "",
      "Device System Name": '',
      "Device OS": "",
    };
  }
};