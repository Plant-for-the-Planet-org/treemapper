import axios from 'axios';
import { APIConfig } from '../actions/Config';
import {
  AddSpecies,
  Coordinates,
  Polygons,
  OfflineMaps,
  Inventory,
  ActivityLogs,
  Species,
  User,
  ScientificSpecies,
} from '../repositories/schema';
import Realm from 'realm';
import getSessionData from '../utils/sessionId';
import dbLog from '../repositories/logs';
import { LogTypes } from '../utils/constants';

const { protocol, url } = APIConfig;
export const AllSpecies = () => {
  return new Promise((resolve, reject) => {
    let headers = {
      'Content-Type': 'application/json',
      'X-Accept-Version': 'v2.0',
    };
    axios
      .get(`${protocol}://${url}/treemapper/scientificSpecies`, headers)
      .then((res) => {
        const { data, status } = res;
        if (status === 200) {
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'Fetched all scientific species, GET - /scientificSpecies',
            statusCode: status,
          });
          resolve(data);
        }
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Failed to fetch all scientific species, GET - /scientificSpecies',
          statusCode: err.status,
        });
        console.error(err, 'error');
      });
  });
};

export const SearchSpecies = (payload) => {
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
        ActivityLogs
      ],
    })
      .then((realm) => {
        realm.write(() => {
          const SearchSpeciesUser = realm.objectForPrimaryKey('User', 'id0001');
          let userToken = SearchSpeciesUser.accessToken;
          let formData = new FormData();
          formData.append('q', payload);
          formData.append('t', 'species');
          getSessionData()
            .then(async (sessionData) => {
              await axios({
                method: 'POST',
                url: `${protocol}://${url}/suggest.php`,
                data: formData,
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `OAuth ${userToken}`,
                  'x-session-id': sessionData,
                },
              })
                .then((res) => {
                  const { data, status } = res;
                  if (status === 200) {
                    // logging the success in to the db
                    dbLog.info({
                      logType: LogTypes.MANAGE_SPECIES,
                      message: 'Searched species, POST - /suggest.php',
                      statusCode: status,
                    });
                    resolve(data);
                  }
                })
                .catch((err) => {
                  // logs the error of the failed request in DB
                  dbLog.error({
                    logType: LogTypes.MANAGE_SPECIES,
                    message: 'Failed to search species, POST - /suggest.php',
                    statusCode: err.status,
                  });
                  reject(err);
                  console.error(err, 'error');
                });
            })
            .catch((err) => {
              console.error(err);
              reject(err);
            });
        });
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
};
