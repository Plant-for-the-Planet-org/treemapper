import axios from 'axios';
import Auth0 from 'react-native-auth0';
import Config from 'react-native-config';
import Realm from 'realm';
import { APIConfig } from '../actions/Config';
import { Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs } from './schema';
import { bugsnag } from '../utils';
import getSessionData from '../utils/sessionId';

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
      })
      .catch((err) => {
        console.error(`Error: /repositories/getUserToken -> ${JSON.stringify(err)}`);
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
              resolve(true);
            });
          });
        });
      })
      .catch((error) => {
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
            resolve(true);
          });
        });
      })
      .catch((error) => {
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
          resolve(JSON.parse(JSON.stringify(User)));
        });
      })
      .catch((err) => {
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
        resolve({
          email: User.email,
          firstName: User.firstname,
          lastName: User.lastname,
          country: User.country,
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
