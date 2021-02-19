import axios from 'axios';
import { protocol, url } from '../actions/Config';
import dbLog from '../repositories/logs';
import { getUserToken } from '../repositories/user';
import { LogTypes } from './constants';
import { bugsnag } from './index';

// creates and axios instance with base url
const axiosInstance = axios.create({
  baseURL: `${protocol}://${url}`,
});

// Add a request interceptor which adds the configuration in all the requests
axiosInstance.interceptors.request.use(
  async (config) => {
    // gets the session id from async storage
    const sessionId = await getSessionData();

    // if there's session id then adds the same into the header
    if (sessionId) {
      config.headers['X-SESSION-ID'] = sessionId;
    }
    // sets the content type to json
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => {
    console.error(`Error while setting up axios interceptor, ${JSON.stringify(error)}`);
  },
);

const request = async (url, method = 'GET', isAuthenticated = false, data = undefined) => {
  try {
    //  sets the options which is passed to axios to make the request
    let options = {
      method,
      url,
    };

    // if the method is either POST, PUT or DELETE and data is present then adds data property to options
    if ((method === 'POST' || method === 'PUT' || method === 'DELETE') && data) {
      options.data = data;
    }

    // if request needs to be authenticated the Authorization is added in headers.
    // if access token is not present then throws error for the same
    if (isAuthenticated) {
      const accessToken = await getUserToken();
      if (!accessToken) {
        throw {
          message: 'Access token is not available.',
        };
      }

      // adds Authorization to headers in options
      options.headers = {
        Authorization: `OAuth ${accessToken}`,
      };
    }

    // returns a promise with axios instance
    return new Promise((resolve, reject) => {
      axiosInstance(options)
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  } catch (err) {
    console.error(
      `Error while making ${method} request, ${JSON.stringify({
        url,
        isAuthenticated,
        err,
      })}`,
    );
    dbLog.error({
      logType: LogTypes.OTHER,
      message: `Error while making ${method} request with url: ${url}, isAuthenticated:${isAuthenticated}`,
      logStack: JSON.stringify({
        url,
        isAuthenticated,
        err,
      }),
    });
    bugsnag.notify(err);
  }
};

// calls the [request] function with [url]
export const getRequest = (url) => request(url);

// calls the [request] function with [url] and [isAuthenticated = true]
export const getAuthenticatedRequest = (url) => request(url, 'GET', true);

// calls the [request] function with [url], [data], [method = 'POST'] and [isAuthenticated = false]
export const postRequest = (url, data) => request(url, 'POST', false, data);

// calls the [request] function with [url], [data], [method = 'POST'] and [isAuthenticated = true]
export const postAuthenticatedRequest = (url, data) => request(url, 'POST', true, data);

// calls the [request] function with [url], [data], [method = 'PUT'] and [isAuthenticated = false]
export const putRequest = (url, data) => request(url, 'PUT', false, data);

// calls the [request] function with [url], [data], [method = 'PUT'] and [isAuthenticated = true]
export const putAuthenticatedRequest = (url, data) => request(url, 'PUT', true, data);

// calls the [request] function with [url], [data], [method = 'DELETE'] and [isAuthenticated = false]
export const deleteRequest = (url, data) => request(url, 'DELETE', false, data);

// calls the [request] function with [url], [data], [method = 'DELETE'] and [isAuthenticated = true]
export const deleteAuthenticatedRequest = (url, data) => request(url, 'DELETE', true, data);
