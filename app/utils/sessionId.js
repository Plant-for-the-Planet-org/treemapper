import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-community/async-storage';

const getSessionData = async () => {
  try {
    const sessionValue = await AsyncStorage.getItem('session-id');
    if (sessionValue === null) {
      let sessionData = uuidv4();
      await AsyncStorage.setItem('session-id', sessionData);
      return sessionData;
    }
    return sessionValue;
  } catch (e) {
    console.error(e);
  }
};

export default getSessionData;
