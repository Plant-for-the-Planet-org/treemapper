import i18next from 'i18next';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { bugsnag } from '.';

const isAndroid = Platform.OS === 'android';

export const locationPermission = () => {
  return new Promise((resolve, reject) => {
    if (isAndroid) {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
        .then(granted => {
          switch (granted) {
            case PermissionsAndroid.RESULTS.GRANTED:
              resolve('granted');
              return true;
            case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
              reject(new Error('blocked'));
              return false;
            case PermissionsAndroid.RESULTS.DENIED:
              reject(new Error('denied'));
              return false;
          }
        })
        .catch(err => console.warn(err));
    } else {
      Geolocation.requestAuthorization('whenInUse').then(permissionStatus => {
        if (permissionStatus === 'granted') {
          resolve(true);
        } else {
          reject(new Error('blocked'));
        }
      });
    }
  });
};

export const askExternalStoragePermission = async () => {
  try {
    if (!isAndroid) {
      return true;
    }
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: i18next.t('label.storage_permission_android_title'),
        message: i18next.t('label.storage_permission_android_message'),
        buttonPositive: i18next.t('label.permission_camera_ok'),
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    } else {
      Alert.alert(
        i18next.t('label.storage_permission_denied_header'),
        i18next.t('label.storage_permission_denied_sub_header'),
      );
      return false;
    }
  } catch (err) {
    bugsnag.notify(err);
    return false;
  }
};
