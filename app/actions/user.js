import { createUser, deleteUser, modifyUserDetails } from '../repositories/user';
import axios from 'axios';
import Auth0 from 'react-native-auth0';
import Config from 'react-native-config';
import Realm from 'realm';
import { APIConfig } from '../actions/Config';
import dbLog from '../repositories/logs';
import {
  ActivityLogs,
  AddSpecies,
  Coordinates,
  Inventory,
  OfflineMaps,
  Polygons,
  ScientificSpecies,
  Species,
  User,
} from '../repositories/schema';
import { LogTypes } from '../utils/constants';
import getSessionData from '../utils/sessionId';
import { SET_INITIAL_USER_STATE, SET_USER_DETAILS, CLEAR_USER_DETAILS } from './Types';
import { bugsnag } from '../utils';

// creates auth0 instance while providing the auth0 domain and auth0 client id
const auth0 = new Auth0({ domain: Config.AUTH0_DOMAIN, clientId: Config.AUTH0_CLIENT_ID });

// stores the protocol and url used for api request
const { protocol, url } = APIConfig;

/**
 * Used to login or signup into the app. After the user is authorized successfully the auth0 returns token
 * which is used in the app to authenticate the api calls. It also creates a new user or replace the existing
 * accessToken and idToken in the realm DB
 */
export const auth0Login = () => (dispatch) => {
  return new Promise((resolve, reject) => {
    auth0.webAuth
      .authorize({ scope: 'openid email profile' }, { ephemeralSession: true })
      .then((loginData) => {
        // logs success info in DB
        dbLog.info({
          logType: LogTypes.USER,
          message: 'Login successful from auth0',
        });

        console.log('auth0 loginData', loginData);

        // creates the user after successful login by passing the loginData having accessToken and idToken to store in DB
        createUser(loginData);

        // sets the token in the user state of the app
        setUserInitialState(loginData)(dispatch);

        // fetches the user details from server by passing the accessToken which is used while requesting the API
        getUserDetailsFromServer(loginData.accessToken)
          .then(() => {
            resolve(true);
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.USER,
          message: 'Error while logging in from auth0',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        // if any error is found then deletes the user and clear the user app state
        deleteUser();
        clearUserDetails()(dispatch);
        reject(err);
      });
  });
};

/**
 * Logs out the user by clearing the session from auth0 and calls the deleteUser function to delete the user from DB
 */
export const auth0Logout = () => (dispatch) => {
  return new Promise((resolve) => {
    auth0.webAuth
      .clearSession()
      .then(() => {
        deleteUser();

        // clear the user details from the user state
        clearUserDetails()(dispatch);

        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.USER,
          message: 'Logout successful',
        });
        resolve(true);
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.USER,
          message: 'Error while Logging Out',
          logStack: JSON.stringify(err),
        });
        console.error(`Error at /actions/user/auth0Logout, ${JSON.stringify(err)}`);
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

/**
 * Fetches the detail of the user from the server using the accessToken and requesting the GET api - /app/profile
 * @param {string} userToken - used to pass in authorization header of the api
 */
export const getUserDetailsFromServer = (userToken) => {
  return new Promise((resolve, reject) => {
    getSessionData().then((sessionData) => {
      axios({
        method: 'GET',
        url: `${protocol}://${url}/app/profile`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `OAuth ${userToken}`,
          'x-session-id': sessionData,
        },
      })
        .then((data) => {
          // calls modifyUserDetails function to add user's email, firstName, lastName, tpoId, image and country in DB
          modifyUserDetails(data.data);
          console.log('getUserDetailsFromServer', data.data);

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.USER,
            message: 'Successfully retrieved User Information from Server',
            statusCode: data.status,
          });
          resolve(data.data);
        })
        .catch((err) => {
          console.error(
            `Error at /actions/user/getUserDetailsFromServer: GET - /app/profile, ${JSON.stringify(
              err.response,
            )}`,
          );

          dbLog.error({
            logType: LogTypes.USER,
            message: 'Failed to retrieve User Information from Server',
            statusCode: err.response.status,
            logStack: JSON.stringify(err.response),
          });
          reject(err);
        });
    });
  });
};

export const getUserInformationFromServer = (navigation) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
        ActivityLogs,
      ],
    }).then((realm) => {
      const User = realm.objectForPrimaryKey('User', 'id0001');
      let userToken = User.accessToken;

      getSessionData().then((sessionData) => {
        axios({
          method: 'GET',
          url: `${protocol}://${url}/app/profile`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `OAuth ${userToken}`,
            'x-session-id': sessionData,
          },
        })
          .then((data) => {
            realm.write(() => {
              const { email, firstname, lastname, country } = data.data;
              realm.create(
                'User',
                {
                  id: 'id0001',
                  email,
                  firstname,
                  lastname,
                  country,
                },
                'modified',
              );
            });
            // logging the success in to the db
            dbLog.info({
              logType: LogTypes.USER,
              message: 'Successfully retrieved User Information from Server',
              statusCode: data.status,
            });
            resolve(data.data);
          })
          .catch((err) => {
            console.error('err.response.status =>> getUserInformationFromServer', err);
            if (err.response.status === 303) {
              navigation.navigate('SignUp');
            }
            dbLog.error({
              logType: LogTypes.USER,
              message: 'Failed to retrieve User Information from Server',
              statusCode: err.data.status,
            });
            reject(err);
          });
      });
      // realm.close();
    });
  });
};

/**
 * dispatches type SET_INITIAL_USER_STATE with payload as loginData to add user tokens in the user state of the app
 * @param {object} loginData - used to add the tokens in the user state of the app. The object should have accessToken and idToken
 */
export const setUserInitialState = (loginData) => (dispatch) => {
  console.log("SET_INITIAL_USER_STATE act", loginData)
  dispatch({
    type: SET_INITIAL_USER_STATE,
    payload: loginData,
  });
};

/**
 * dispatches type SET_USER_DETAILS with payload as userDetails to add user details in the user state of the app
 * @param {object} userDetails - used to add details of user in the app state. The object should have
 *                               accessToken, idToken, firstName, lastName, image, tpoId, email, country
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

export const SignupService = (payload) => {
  // try {
  return new Promise((resolve, reject) => {
    const { protocol, url } = APIConfig;
    axios
      .post(`${protocol}://${url}/app/profile`, payload)
      .then((res) => {
        const { status, data } = res;
        if (status === 200) {
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
        console.error('SignupService =>', err.response);
        // logs the error of the failed request in DB
        dbLog.error({
          logType: LogTypes.USER,
          message: 'Failed to Sign up',
          statusCode: err.response.status,
        });
        reject(err);
      });
  });
};
