import * as Device from 'expo-device';
import * as Applications from 'expo-application';

export const getDeviceDetails = () => {
  try {
    return {
      "deviceBrand": Device.brand,
      'deviceModel': Device.modelName,
      "deviceManufacturer": Device.manufacturer,
      "deviceSystemName": Device.osName,
      "deviceSystemVersion": Device.osVersion,
      "appVersion": Applications.nativeApplicationVersion,
    };
  } catch (error) {
    return {
      "appVersion": Applications.nativeApplicationVersion,
      "deviceBrand": '',
      'deviceModel':'',
      "deviceManufacturer": '',
      "deviceSystemName": '',
      "deviceSystemVersion":""
    };
  }
};
