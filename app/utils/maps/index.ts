import Geolocation from 'react-native-geolocation-service';
export const currentPositionOptions: Geolocation.GeoOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  accuracy: {
    android: 'high',
    ios: 'bestForNavigation',
  },
};

export const watchPositionOptions: Geolocation.GeoWatchOptions = {
  enableHighAccuracy: true,
  interval: 1000,
  accuracy: {
    android: 'high',
    ios: 'bestForNavigation',
  },
};
