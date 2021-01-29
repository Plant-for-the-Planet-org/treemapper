import axios from 'axios';
import Auth0 from 'react-native-auth0';
import Config from 'react-native-config';
import Realm from 'realm';
import { APIConfig } from '../actions/Config';
import { Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs } from './schema';
import { bugsnag } from '../utils';
import getSessionData from '../utils/sessionId';
import { LogTypes } from '../utils/constants';
import { dbLog } from './logs'

// AUTH0 CONFIG
const auth0 = new Auth0({ domain: Config.AUTH0_DOMAIN, clientId: Config.AUTH0_CLIENT_ID });

export const getUserToken = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs],
    })
      .then((realm) => {
        // Gets the user data from the DB
        const User = realm.objectForPrimaryKey('User', 'id0001');
        const userToken = User.userToken;

        // closes the realm connection
        // realm.close();

        // returns userToken
        resolve(userToken);
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.USER,
          message: `Successfully retrieved User Token`,
        });
      })
      .catch((err) => {
        console.error(`Error: /repositories/getUserToken -> ${JSON.stringify(err)}`);
        dbLog.error({
          logType: LogTypes.USER,
          message: `Error while retrieving User Token`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        reject();
      });
  });
};

//  ---------------- AUTH0 ACTIONS START----------------

export const auth0Login = (navigation) => {
  return new Promise((resolve, reject) => {
    auth0.webAuth
      .authorize({ scope: 'openid email profile' }, { ephemeralSession: true })
      .then((credentials) => {
        const { accessToken, idToken } = credentials;
        Realm.open({
          schema: [Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs],
        }).then((realm) => {
          realm.write(() => {
            realm.create(
              'User',
              {
                id: 'id0001',
                accessToken: accessToken,
                idToken,
              },
              'modified',
            );
            getUserInformationFromServer(navigation).then(() => {
              // logging the success in to the db
              dbLog.info({
                logType: LogTypes.USER,
                message: `Successfully Logged In`,
              });
              resolve(true);
            });
          });
        });
      })
      .catch((error) => {
        dbLog.error({
          logType: LogTypes.USER,
          message: `Error while Logging In`,
          logStack: JSON.stringify(err),
        });
        reject(error);
      });
  });
};

export const auth0Logout = () => {
  return new Promise((resolve, reject) => {
    auth0.webAuth
      .clearSession()
      .then(() => {
        Realm.open({
          schema: [Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs],
        }).then((realm) => {
          realm.write(() => {
            const user = realm.objectForPrimaryKey('User', 'id0001');
            realm.delete(user);
            // logging the success in to the db
            dbLog.info({
              logType: LogTypes.USER,
              message: `Successfully Logged Out`,
            });
            resolve(true);
          });
        });
      })
      .catch((error) => {
        dbLog.error({
          logType: LogTypes.USER,
          message: `Error while Logging Out`,
          logStack: JSON.stringify(err),
        });
        alert('error');
        console.error(error);
        reject(error);
      });
  });
};

export const isLogin = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs],
    }).then((realm) => {
      const User = realm.objects('User');
      if (User[0]) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

export const LoginDetails = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs],
    })
      .then((realm) => {
        realm.write(() => {
          const User = realm.objects('User');
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.USER,
            message: `Successfully retrieved User details`,
          });
          resolve(JSON.parse(JSON.stringify(User)));
        });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.USER,
          message: `Error while retrieving User details`,
          logStack: JSON.stringify(err),
        });
        reject(err);
      });
  });
};

//  ---------------- AUTH0 ACTIONS END----------------

export const getUserInformation = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs],
    }).then((realm) => {
      const User = realm.objectForPrimaryKey('User', 'id0001');
      if (User) {
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.USER,
          message: `Successfully retrieved User Information`,
        });
        resolve({
          email: User.email,
          firstName: User.firstname,
          lastName: User.lastname,
          country: User.country,
          logActivity: User.logActivity,
        });
      } else {
        resolve({ email: '', firstName: '', lastName: '' });
      }
    });
  });
};

export const getUserInformationFromServer = (navigation) => {
  const { protocol, url } = APIConfig;
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs],
    }).then((realm) => {
      const User = realm.objectForPrimaryKey('User', 'id0001');
      let userToken = User.accessToken;
      console.log(userToken, 'Token');
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
            resolve(data.data);
          })
          .catch((err) => {
            console.error('err.response.status =>>', err);
            if (err.response.status === 303) {
              navigation.navigate('SignUp');
            }
            reject(err);
          });
      });
      // realm.close();
    });
  });
};

export const setActivityLog = (bool) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs],
    })
    .then((realm) => {
      const User = realm.objectForPrimaryKey('User', 'id0001');
      realm.write(() => {
        realm.create('User', {id: 'id0001', logActivity: bool}, 'modified');
      });
      // logging the success in to the db
      dbLog.info({
        logType: LogTypes.USER,
        message: `Successfully toggled ${bool? 'on': 'off'} Activity Log`,
      });
      resolve();
    })
  
  })
}