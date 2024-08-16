import store from 'src/store/index'
import 'react-native-get-random-values'
import { v4 as uuid } from 'uuid'
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application'
import { Platform } from 'react-native';

const setAndGetSessionId = async () => {
  let sessionId: any = await AsyncStorage.getItem('session-id');
  if (!sessionId) {
    sessionId = uuid();
    await AsyncStorage.setItem('session-id', sessionId);
  }
  return sessionId;
}

const defaultHeaders = {
  "x-accept-versions": "2.0.0",
  "Content-Type": "application/json",
  "User-Agent": `treemapper/${Platform.OS}/${Application.nativeApplicationVersion}`
}

const fetchCall = async (method: string, uri: string, params: any = null, authRequire: boolean = true) => {
  try {
    const token = store.getState().appState.accessToken;
    if (!token && authRequire) {
      throw new Error('No access token available');
    }
    const sessionId = await setAndGetSessionId();
    const headers = {
      Authorization: `Bearer ${token}`,
      ...defaultHeaders,
      "x-session-id": sessionId
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (params) {
      options.body = JSON.stringify(params, (_key, value) => (value !== null ? value : {}));
    }

    const response = await fetch(uri, options);
    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return responseJson;
  } catch (err) {
    console.error(`Error in ${method}Call:`, err);
    return null;
  }
}

export const fetchPostCall = (uri: string, params: any) => fetchCall('POST', uri, params);
export const fetchGetCall = (uri: string, authRequire: boolean) => fetchCall('GET', uri, null, authRequire);
export const fetchPutCall = (uri: string, params: any) => fetchCall('PUT', uri, params);
export const fetchDeleteCall = (uri: string) => fetchCall('DELETE', uri);
