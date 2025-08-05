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
  "x-accept-versions": `${Application.nativeApplicationVersion}`,
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
    const tokenData = authRequire ? { Authorization: `Bearer ${token}` } : {}
    const headers = {
      ...tokenData,
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
    if (response.status === 303) {
      return { response: { signUpRequire: true }, success: true, status: response.status, extra: {} }
    }

    if (response.status === 204) {
      return { response: { signUpRequire: false }, success: true, status: response.status, extra: {} }
    }
    if (!response.ok) {
      return { response: null, success: false, status: response.status, extra: {} }
    }

    return { response: responseJson, success: true, status: response.status, extra: {} }
  } catch (err) {
    return { response: null, success: false, status: 500, extra: {} }
  }
}

export const fetchPostCall = (uri: string, params: any, authRequire?: boolean) => fetchCall('POST', uri, params, authRequire);
export const fetchGetCall = (uri: string, authRequire: boolean) => fetchCall('GET', uri, null, authRequire);
export const fetchPutCall = (uri: string, params: any) => fetchCall('PUT', uri, params);
export const fetchDeleteCall = (uri: string) => fetchCall('DELETE', uri, {}, true);
