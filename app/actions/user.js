import axios from 'axios';
import Realm from 'realm';
import { APIConfig } from '../actions/Config';
import {
  Inventory,
  Species,
  Polygons,
  Coordinates,
  OfflineMaps,
  User,
  AddSpecies,
  ScientificSpecies,
  ActivityLogs
} from '../repositories/schema';
import { bugsnag } from '../utils';
import getSessionData from '../utils/sessionId';
import { LogTypes } from '../utils/constants';
import dbLog from '../repositories/logs';

export const getUserInformationFromServer = (navigation) => {
  const { protocol, url } = APIConfig;
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
        ActivityLogs
      ],
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
            // logging the success in to the db
            dbLog.info({
              logType: LogTypes.USER,
              message: 'Successfully retrieved User Information from Server',
              statusCode: data.status,
            });
            resolve(data.data);
          })
          .catch((err) => {
            console.error('err.response.status =>>', err);
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
