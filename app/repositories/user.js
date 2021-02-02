import Auth0 from 'react-native-auth0';
import Config from 'react-native-config';
import Realm from 'realm';
import {
  AddSpecies,
  Coordinates,
  Inventory,
  OfflineMaps,
  Polygons,
  Species,
  User,
  ScientificSpecies,
  ActivityLogs,
} from './schema';
import { bugsnag } from '../utils';
import { LogTypes } from '../utils/constants';
import dbLog from './logs';

// AUTH0 CONFIG
const auth0 = new Auth0({ domain: Config.AUTH0_DOMAIN, clientId: Config.AUTH0_CLIENT_ID });

export const getUserToken = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        AddSpecies,
        Coordinates,
        Inventory,
        OfflineMaps,
        Polygons,
        Species,
        User,
        ScientificSpecies,
        ActivityLogs,
      ],
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
          message: 'Successfully retrieved User Token',
        });
      })
      .catch((err) => {
        console.error(`Error: /repositories/getUserToken -> ${JSON.stringify(err)}`);
        dbLog.error({
          logType: LogTypes.USER,
          message: 'Error while retrieving User Token',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        reject();
      });
  });
};

export const isLogin = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        AddSpecies,
        Coordinates,
        Inventory,
        OfflineMaps,
        Polygons,
        Species,
        User,
        ScientificSpecies,
        ActivityLogs,
      ],
    }).then((realm) => {
      const User = realm.objectForPrimaryKey('User', 'id0001');
      console.log('user login', User);
      if (User) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

export const getUserDetails = () => {
  return new Promise((resolve) => {
    Realm.open({
      schema: [
        AddSpecies,
        Coordinates,
        Inventory,
        OfflineMaps,
        Polygons,
        Species,
        User,
        ScientificSpecies,
        ActivityLogs,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          const User = realm.objectForPrimaryKey('User', 'id0001');
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.USER,
            message: 'Successfully retrieved User details',
          });
          resolve(User);
        });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.USER,
          message: 'Error while retrieving User details',
          logStack: JSON.stringify(err),
        });
        resolve(false);
      });
  });
};

//  ---------------- AUTH0 ACTIONS END----------------

/**
 * Deletes the user from the database.
 * @returns {boolean} - can be used to check if the operation was successful or not
 */
export const createUser = ({ accessToken, idToken }) => {
  return new Promise((resolve) => {
    Realm.open({
      schema: [
        AddSpecies,
        Coordinates,
        Inventory,
        OfflineMaps,
        Polygons,
        Species,
        User,
        ScientificSpecies,
        ActivityLogs,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          realm.create(
            'User',
            {
              id: 'id0001',
              accessToken,
              idToken,
            },
            'modified',
          );
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.USER,
            message: 'Successfully created user in DB',
          });
          resolve(true);
        });
      })
      .catch((err) => {
        console.error(`Error at /repositories/user/createUser, ${JSON.stringify(err)}`);

        dbLog.error({
          logType: LogTypes.USER,
          message: 'Error while creating user in DB',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

/**
 * Deletes the user from the database.
 * @returns {boolean} - can be used to check if the operation was successful or not
 */
export const deleteUser = () => {
  return new Promise((resolve) => {
    Realm.open({
      schema: [
        AddSpecies,
        Coordinates,
        Inventory,
        OfflineMaps,
        Polygons,
        Species,
        User,
        ScientificSpecies,
        ActivityLogs,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          const user = realm.objectForPrimaryKey('User', 'id0001');
          if (user) {
            realm.delete(user);
            // logging the success in to the db
            dbLog.info({
              logType: LogTypes.USER,
              message: 'Successfully deleted user from DB',
            });
          }
          resolve(true);
        });
      })
      .catch((err) => {
        console.error(`Error at /repositories/user/deleteUser, ${JSON.stringify(err)}`);

        dbLog.error({
          logType: LogTypes.USER,
          message: 'Error while deleting user from DB',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const modifyUserDetails = ({ email, firstname, lastname, country, image, id }) => {
  return new Promise((resolve) => {
    Realm.open({
      schema: [
        AddSpecies,
        Coordinates,
        Inventory,
        OfflineMaps,
        Polygons,
        Species,
        User,
        ScientificSpecies,
        ActivityLogs,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          realm.create(
            'User',
            {
              id: 'id0001',
              email,
              firstName: firstname,
              lastName: lastname,
              country,
              tpoId: id,
              image,
            },
            'modified',
          );
        });
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.USER,
          message: 'Successfully modified user details in DB',
        });
        resolve(true);
      })
      .catch((err) => {
        console.error(`Error at /repositories/user/modifyUserDetails, ${JSON.stringify(err)}`);

        dbLog.error({
          logType: LogTypes.USER,
          message: 'Error while modifying user details in DB',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const getUserInformation = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        AddSpecies,
        Coordinates,
        Inventory,
        OfflineMaps,
        Polygons,
        Species,
        User,
        ScientificSpecies,
        ActivityLogs,
      ],
    }).then((realm) => {
      const User = realm.objectForPrimaryKey('User', 'id0001');
      if (User) {
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.USER,
          message: 'Successfully retrieved User Information',
        });
        resolve({
          email: User.email,
          firstName: User.firstname,
          lastName: User.lastname,
          country: User.country,
          IsLogEnabled: User.IsLogEnabled,
        });
      } else {
        resolve({ email: '', firstName: '', lastName: '' });
      }
    });
  });
};

export const setActivityLog = (bool) => {
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
      // const User = realm.objectForPrimaryKey('User', 'id0001');
      realm.write(() => {
        realm.create('User', { id: 'id0001', IsLogEnabled: bool }, 'modified');
      });
      // logging the success in to the db
      dbLog.info({
        logType: LogTypes.USER,
        message: `Successfully toggled ${bool ? 'on' : 'off'} Activity Log`,
      });
      resolve();
    });
  });
};
