import Realm from 'realm';
import {
  Inventory,
  Species,
  Polygons,
  Coordinates,
  OfflineMaps,
  User,
  AddSpecies,
} from '../actions/Schemas';
import { bugsnag } from '../utils';

import { getUserInformationFromServer } from '../actions/User';
import Auth0 from 'react-native-auth0';
import Config from 'react-native-config';

// AUTH0 CONFIG
const auth0 = new Auth0({ domain: Config.AUTH0_DOMAIN, clientId: Config.AUTH0_CLIENT_ID });

export const getUserToken = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [User],
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
          schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
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
          schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
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
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
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
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
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
