import store from 'src/store/index'
import { refreshSession } from './sessionManager'
import 'react-native-get-random-values'
import { v4 as uuid } from 'uuid'
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application'
import { Platform } from 'react-native';
import { AnalyticsEvents, incrementSessionCounter, trackEvent } from 'src/utils/analytics';

/**
 * Turns a full URL into something you can group by in PostHog.
 *
 * Raw URLs are useless as a breakdown: every project id makes its own bucket,
 * so "which endpoint fails most" becomes a list of one-offs. Ids are replaced
 * with :id and the query string is dropped, which also keeps tokens and
 * search terms out of the analytics payload.
 */
const toEndpointPattern = (uri: string): string => {
  try {
    const path = uri.split('?')[0].replace(/^https?:\/\/[^/]+/, '');
    return path
      .split('/')
      .map(segment => {
        if (!segment) return segment;
        const looksLikeId =
          segment.length >= 12 || (/\d/.test(segment) && /[a-zA-Z]/.test(segment));
        return looksLikeId ? ':id' : segment;
      })
      .join('/');
  } catch {
    return 'unknown';
  }
};

/**
 * One place to record a failed call (section 8). The event carries the
 * ambient is_offline flag automatically, so a dashboard can separate "our
 * server is unhappy" from "the field worker is out of signal", which in this
 * app is most of the time.
 */
const trackApiFailure = (
  method: string,
  uri: string,
  status: number,
  isRetry: boolean,
) => {
  incrementSessionCounter('api_failures');
  trackEvent(AnalyticsEvents.API_REQUEST_FAILED, {
    endpoint: toEndpointPattern(uri),
    method,
    status_code: status,
    is_retry: isRetry,
    // 500 is also what the catch below reports for a thrown fetch, so this
    // tells a real server error apart from "the request never left".
    failure_kind: status >= 500 ? 'server_or_network' : 'rejected',
  });
};

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

const fetchCall = async (method: string, uri: string, params: any = null, authRequire: boolean = true, isRetry: boolean = false) => {
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

    // Access token expired or rejected: refresh once and replay the request.
    if (response.status === 401 && authRequire && !isRetry) {
      const newToken = await refreshSession({ forceRefresh: true });
      if (newToken) {
        return fetchCall(method, uri, params, authRequire, true);
      }
    }

    const responseJson = await response.json();

    if (response.status === 303) {
      return { response: { signUpRequire: true }, success: true, status: response.status, extra: {} }
    }

    if (response.status === 204) {
      return { response: { signUpRequire: false }, success: true, status: response.status, extra: {} }
    }
    if (!response.ok) {
      trackApiFailure(method, uri, response.status, isRetry)
      // Keep the parsed error body (message/code) so callers can show the
      // server's message to the user instead of a generic failure.
      return { response: responseJson, success: false, status: response.status, extra: {} }
    }

    return { response: responseJson, success: true, status: response.status, extra: {} }
  } catch (err) {
    // The request never completed: no signal, DNS failure, or a body that
    // would not parse. Callers see 500, so analytics reports the same.
    trackApiFailure(method, uri, 500, isRetry)
    return { response: null, success: false, status: 500, extra: {} }
  }
}

export const fetchPostCall = (uri: string, params: any, authRequire?: boolean) => fetchCall('POST', uri, params, authRequire);
export const fetchGetCall = (uri: string, authRequire: boolean) => fetchCall('GET', uri, null, authRequire);
export const fetchPutCall = (uri: string, params: any) => fetchCall('PUT', uri, params);
export const fetchPatchCall = (uri: string, params: any) => fetchCall('PATCH', uri, params);
export const fetchDeleteCall = (uri: string) => fetchCall('DELETE', uri, {}, true);
