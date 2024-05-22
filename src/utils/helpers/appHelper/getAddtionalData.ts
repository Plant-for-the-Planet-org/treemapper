import * as Device from 'expo-device';


export const getMetaDetails = () => {

}

export const getDeviceDetails = () => {
  try {
    return {
      "Device Brand": Device.brand,
      'Device Model': Device.modelName,
      "Device Manufacturer": Device.manufacturer,
      "Device System Name": Device.osName,
      "Device OS": Device.osVersion,
    };
  } catch (error) {
    return {
      "App Version": "2.0.1",
      "Device Brand": "",
      'Device Model': "",
      "Device Manufacturer": "",
      "Device System Name": '',
      "Device OS": "",
    };
  }

};