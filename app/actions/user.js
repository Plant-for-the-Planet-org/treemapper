import { createOrModifyUserToken, deleteUser, modifyUserDetails } from '../repositories/user';
import Auth0 from 'react-native-auth0';
import Config from 'react-native-config';
import dbLog from '../repositories/logs';
import { LogTypes } from '../utils/constants';
import { SET_INITIAL_USER_STATE, SET_USER_DETAILS, CLEAR_USER_DETAILS } from './Types';
import { bugsnag } from '../utils';
import { checkAndAddUserSpecies } from '../utils/addUserSpecies';
import { getAuthenticatedRequest, getRequest, postAuthenticatedRequest } from '../utils/api';
import AsyncStorage from '@react-native-community/async-storage';

// creates auth0 instance while providing the auth0 domain and auth0 client id
const auth0 = new Auth0({ domain: Config.AUTH0_DOMAIN, clientId: Config.AUTH0_CLIENT_ID });

// stores the protocol and url used for api request

/* ============================== *\
      Auth0 functions - STARTS
\* ============================== */

/**
 * Used to login or signup into the app. After the user is authorized successfully the auth0 returns an access token
 * which is used in the app to authenticate the api calls. Then it creates a new user or replace the existing
 * accessToken, idToken and refreshToken in the realm DB using func [createOrModifyUserToken]. Followed by calling
 * func [setUserInitialState] to update the app's user state. Followed by calling func [getUserDetailsFromServer]
 * to get the user details.
 * @param {ActionDispatch} dispatch - requires dispatch function of user context to pass it to func [setUserInitialState]
 */
export const auth0Login = (dispatch) => {
  return new Promise((resolve, reject) => {
    auth0.webAuth
      .authorize(
        { scope: 'openid email profile offline_access', federated: true, prompt: 'login' },
        { ephemeralSession: true },
      )
      .then((credentials) => {
        // logs success info in DB
        dbLog.info({
          logType: LogTypes.USER,
          message: 'Login successful from auth0',
        });

        // creates the user after successful login by passing the credentials having accessToken, idToken
        // and refreshToken to store in DB
        createOrModifyUserToken(credentials);

        // sets the accessToken and idToken in the user state of the app
        setUserInitialState(credentials)(dispatch);

        // fetches the user details from server by passing the accessToken which is used while requesting the API
        getUserDetailsFromServer(credentials.accessToken, dispatch)
          .then((userDetails) => {
            // destructured and modified variable names which is used to set user state
            const {
              email,
              firstname: firstName,
              lastname: lastName,
              image,
              country,
              id: tpoId,
            } = userDetails;

            // dispatch function sets the passed user details into the user state
            setUserDetails({
              email,
              firstName,
              lastName,
              image,
              country,
              tpoId,
            })(dispatch);

            checkAndAddUserSpecies();
            resolve(true);
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        if (err?.error !== 'a0.session.user_cancelled') {
          dbLog.error({
            logType: LogTypes.USER,
            message: 'Error while logging in from auth0',
            logStack: JSON.stringify(err),
          });
          bugsnag.notify(err);
          // if any error is found then deletes the user and clear the user app state
          deleteUser();
          clearUserDetails()(dispatch);
        } else {
          dbLog.info({
            logType: LogTypes.USER,
            message: 'User cancelled auth0 login',
            logStack: JSON.stringify(err),
          });
        }
        reject(err);
      });
  });
};

/**
 * Logs out the user by clearing the session from auth0 then calls the deleteUser function to delete the user from DB
 * also calls the function [clearUserDetails] which dispatches type to clear the app's user state
 * @param {ActionDispatch} userDispatch - dispatch function of user context to pass it to func [clearUserDetails]
 * @returns {boolean} - returns true after all the operations are successful else returns false
 */
export const auth0Logout = (userDispatch = null) => {
  return new Promise((resolve) => {
    auth0.webAuth
      .clearSession()
      .then(async () => {
        // deletes the user from DB
        deleteUser();

        // removes [isInitialSyncDone] item from AsyncStorage
        await AsyncStorage.removeItem('isInitialSyncDone');

        if (userDispatch) {
          // clear the user details from the user state
          clearUserDetails()(userDispatch);
        }
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.USER,
          message: 'Logout successful',
        });
        resolve(true);
      })
      .catch((err) => {
        if (err?.error !== 'a0.session.user_cancelled') {
          console.error(`Error at /actions/user/auth0Logout`, err);
          dbLog.error({
            logType: LogTypes.USER,
            message: 'Error while Logging Out',
            logStack: JSON.stringify(err),
          });
          bugsnag.notify(err);
          resolve(false);
        } else {
          dbLog.info({
            logType: LogTypes.USER,
            message: 'User cancelled auth0 login',
            logStack: JSON.stringify(err),
          });
        }
      });
  });
};

/**
 * Calls the refreshToken function of auth module of auth0 by passing refreshToken and the calls the
 * function [createOrModifyUserToken] to store the updated tokens fetched from auth0
 * @param {string} refreshToken - used to fetch a new access token
 */
export const getNewAccessToken = async (refreshToken) => {
  return new Promise((resolve) => {
    // calls the refreshToken function of auth0 by passing the refreshToken
    auth0.auth
      .refreshToken({ refreshToken })
      .then((data) => {
        // calls the repo function which modifies the accessToken, idToken and refreshToken from the fetched data
        createOrModifyUserToken(data);
        // logs the success to DB
        dbLog.info({
          logType: LogTypes.USER,
          message: 'New access token fetched successfully',
        });
        // resolves the access token
        resolve(data.accessToken);
      })
      .catch((err) => {
        // logs the error in Db and notifies the same to bugsnag
        console.error(`Error at /actions/user/getNewAccessToken`, err);
        bugsnag.notify(err);
        dbLog.error({
          logType: LogTypes.USER,
          message: 'Error while fetching new access token',
          logStack: JSON.stringify(err),
        });
        resolve(false);
      });
  });
};

/* === Auth0 functions - ENDS === */

/* =================================== *\
      API server functions - STARTS
\* =================================== */

/**
 * This function is used to call the logout function if status code of api is 401 and returns a boolean value.
 * @param {Error} error - error of api response to check for 401 error code.
 * @returns {boolean} - returns true if user is logged out else returns false
 */
export const checkErrorCode = async (error, userDispatch) => {
  if (error?.response?.status === 401) {
    return await auth0Logout(userDispatch);
  }
  if (error?.response?.status === 303) {
    modifyUserDetails({
      isSignUpRequired: true,
    });
  }
  return false;
};

/**
 * Fetches the detail of the user from the server using the accessToken and requesting the GET api - /app/profile
 * @param {string} userToken - used to pass in authorization header of the api
 */
export const getUserDetailsFromServer = (userToken, userDispatch = null) => {
  return new Promise((resolve, reject) => {
    getAuthenticatedRequest('/app/profile')
      .then((data) => {
        // destructured and modified variable names which is used to set user state
        const {
          email,
          firstname: firstName,
          lastname: lastName,
          image,
          country,
          id: tpoId,
          type,
          displayName,
        } = data.data;

        // calls modifyUserDetails function to add user's email, firstName, lastName, tpoId, image, accessToken and country in DB
        modifyUserDetails({
          email,
          firstName,
          lastName,
          image,
          country,
          tpoId,
          type,
          displayName,
        });

        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.USER,
          message: 'Successfully retrieved User Information from Server',
          statusCode: data.status,
        });
        resolve(data.data);
      })
      .catch(async (err) => {
        // calls this function to check for the error code and either logout the user or ask to signup
        await checkErrorCode(err, userDispatch);
        console.error(
          `Error at /actions/user/getUserDetailsFromServer: GET - /app/profile,`,
          err.response,
          err,
        );

        dbLog.error({
          logType: LogTypes.USER,
          message: 'Failed to retrieve User Information from Server',
          statusCode: err?.response?.status,
          logStack: JSON.stringify(err.response),
        });
        reject(err);
      });
  });
};

export const SignupService = (payload, dispatch) => {
  // try {
  return new Promise((resolve, reject) => {
    postAuthenticatedRequest('/app/profile', payload)
      .then((res) => {
        const { status, data } = res;
        if (status === 200) {
          modifyUserDetails({
            isSignUpRequired: false,
          });
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.USER,
            message: 'Successfully Signed up',
            statusCode: status,
          });
          resolve(data);
        }
      })
      .catch((err) => {
        console.error(
          `Error at /actions/user/SignupService: POST - /app/profile, ${JSON.stringify(
            err.response,
          )}`,
        );
        // logs the error of the failed request in DB
        dbLog.error({
          logType: LogTypes.USER,
          message: 'Failed to Sign up',
          statusCode: err?.response?.status,
        });
        // if any error is found then deletes the user and clear the user app state
        deleteUser();
        clearUserDetails()(dispatch);
        reject(err);
      });
  });
};

/**
 * Request for config details and returns the CDN URLs object containing media URLs
 * @param {string} language - used to call the config API based on the language of the app
 */
export const getCdnUrls = (language = 'en') => {
  return new Promise((resolve) => {
    getRequest(`/public/v1.2/${language}/config`)
      .then((res) => {
        const { status, data } = res;
        // checks if status is 200 then returns the CDN media URLs else returns false
        if (status === 200) {
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.USER,
            message: 'Fetched CDN URL',
            statusCode: status,
          });
          resolve(data.cdnMedia);
        } else {
          resolve(false);
        }
      })
      .catch((err) => {
        console.error(
          `Error at /actions/user/getCdnUrls: GET - /public/v1.2/${language}/config, ${JSON.stringify(
            err?.response,
          )}`,
        );
        // logs the error of the failed request in DB
        dbLog.error({
          logType: LogTypes.USER,
          message: 'Failed to fetch CDN URL',
          statusCode: err?.response?.status,
          logStack: JSON.stringify(err?.response),
        });
        resolve(false);
      });
  });
};

/* === API server functions - ENDS === */

/* ================================== *\
      Dispatch functions - STARTS
\* ================================== */

/**
 * dispatches type SET_INITIAL_USER_STATE with payload as loginData to add user tokens in the user state of the app
 * @param {object} loginData - used to add the tokens in the user state of the app. The object should have accessToken and idToken
 */
export const setUserInitialState = (loginData) => (dispatch) => {
  dispatch({
    type: SET_INITIAL_USER_STATE,
    payload: loginData,
  });
};

/**
 * dispatches type SET_USER_DETAILS with payload as userDetails to add user details in the user state of the app
 * @param {object} userDetails - used to add details of user in the app state. The object should include
 *                               accessToken?, idToken?, firstName, lastName, image, tpoId, email, country
 */
export const setUserDetails = (userDetails) => (dispatch) => {
  dispatch({
    type: SET_USER_DETAILS,
    payload: userDetails,
  });
};

/**
 * dispatches type CLEAR_USER_DETAILS to clear user details and reset to initial state from the user state of the app
 */
export const clearUserDetails = () => (dispatch) => {
  dispatch({
    type: CLEAR_USER_DETAILS,
  });
};

/* === Dispatch functions - ENDS === */
