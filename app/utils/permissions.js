import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

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
            console.log('You can use the location');
            resolve('granted');
          } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            console.log('Location permission blocked');
            reject('blocked');
          } else {
            console.log('Location permission denied');
            reject('denied');
          }
        })
        .catch((err) => console.warn(err));
    } else {
      Geolocation.requestAuthorization('whenInUse').then((permissionStatus) => {
        console.log(permissionStatus);
        if (permissionStatus === 'granted') {
          resolve();
        } else {
          reject('blocked');
        }
      });
    }
  });
};
