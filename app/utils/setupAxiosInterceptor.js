import axios from 'axios';
import { getUserToken } from '../repositories/user';
import AsyncStorage from '@react-native-community/async-storage';

export default function (userToken = null) {
  return new Promise((resolve, reject) => {
    // Intercept all requests of the route.
    axios.interceptors.request.use(async (config) => {
      // stores the session id present in AsyncStorage
      let sessionID = await AsyncStorage.getItem('session-id');

      // if session ID is empty in AsyncStorage then creates a new unique session ID and and sores in AsyncStorage
      if (!sessionID) {
        sessionID = uuidv4();
        await AsyncStorage.setItem('session-id', sessionID);
      }

      try {
        if (!userToken) {
          userToken = await getUserToken();
        }

        // Adding the token to axios headers for all requests
        config.headers['Authorization'] = `OAuth ${userToken}`;

        // adding x-session-id property in headers
        config.headers['x-session-id'] = sessionID;

        // adding content type as application/json in headers
        config.headers['Content-Type'] = 'application/json';
      } catch (err) {
        console.error('Error while getting user token from realm DB', err);
      }

      console.log('\n\nconfig  from app', config);
      return config;
    });
    resolve();
  });
}
