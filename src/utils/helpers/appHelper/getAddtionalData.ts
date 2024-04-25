import * as Device from 'expo-device';


export const getMetaDetails=()=>{
    
}

export const getDeviceDetails = () => {
    return {
      deviceBrand: Device.brand,
      deviceModel: Device.modelName,
      deviceManufacturer: Device.manufacturer,
      deviceSystemName: Device.osName,
      deviceSystemVersion: Device.osVersion,
    };
  };