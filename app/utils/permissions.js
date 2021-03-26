import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { bugsnag } from '../utils';

const IS_ANDROID = Platform.OS === 'android';

export const permission = () => {
  return new Promise((resolve, reject) => {
    if (IS_ANDROID) {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        // {
        //   title: 'Location Permission',
        //   message: 'App needs an access to your location',
        //   buttonNegative: 'Cancel',
        //   buttonPositive: 'OK',
        // },
      )
        .then((granted) => {
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            resolve('granted');
          } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            reject('blocked');
          } else {
            reject('denied');
          }
        })
        .catch((err) => {
          console.warn(err);
          bugsnag.notify(err);
        });
    } else {
      Geolocation.requestAuthorization('whenInUse').then((permissionStatus) => {
        if (permissionStatus === 'granted') {
          resolve();
        } else {
          reject('blocked');
        }
      });
    }
  });
};
