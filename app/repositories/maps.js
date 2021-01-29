import Config from 'react-native-config';
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
} from './schema';
import Realm from 'realm';
import { bugsnag } from '../utils';
import { LogTypes } from '../utils/constants';
import dbLog from './logs';

export const getAreaName = ({ coords }) => {
  return new Promise((resolve, reject) => {
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?types=place&access_token=${Config.MAPBOXGL_ACCCESS_TOKEN}`,
    )
      .then((res) => {
        res = res.json();
        if (res && res.features && res.features[0]) {
          resolve(res.features[0].place_name);
          // logging the error in to the db
          dbLog.info({
            logType: LogTypes.MAPS,
            message: `Fetched area name for coordinates: ${JSON.stringify(coords)}`,
          });
        } else {
          dbLog.warn({
            logType: LogTypes.MAPS,
            message: `Got response for coordinates: ${JSON.stringify(
              coords,
            )} but area name not present`,
            logStack: `Response ${JSON.stringify(res)}`,
          });
          reject();
        }
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.MAPS,
          message: `Error while fetching area name for coordinates: ${JSON.stringify(coords)}`,
          logStack: JSON.stringify(err),
        });
      });
  });
};

export const getAllOfflineMaps = () => {
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
    })
      .then((realm) => {
        realm.write(() => {
          const offlineMaps = realm.objects('OfflineMaps');
          // logging the error in to the db
          dbLog.info({
            logType: LogTypes.MAPS,
            message: `Fetched offline maps`,
          });
          resolve(JSON.parse(JSON.stringify(offlineMaps)));
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.MAPS,
          message: `Error while fetching the offline maps`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const deleteOfflineMap = ({ name }) => {
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
    })
      .then((realm) => {
        realm.write(() => {
          const offlineMaps = realm.objectForPrimaryKey('OfflineMaps', `${name}`);
          realm.delete(offlineMaps);
          // logging the error in to the db
          dbLog.info({
            logType: LogTypes.MAPS,
            message: `Deleted offline maps`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.MAPS,
          message: `Error while deleting offline maps`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const createOfflineMap = ({ name, size, areaName }) => {
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
    })
      .then((realm) => {
        realm.write(() => {
          realm.create('OfflineMaps', {
            name: name,
            size: size,
            areaName: areaName,
          });
          // logging the error in to the db
          dbLog.info({
            logType: LogTypes.MAPS,
            message: `Created offline map for area: ${areaName}`,
            logStack: JSON.stringify({
              name,
              size,
            }),
          });
          resolve(name);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.MAPS,
          message: `Error while creating offline map for area: ${areaName}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};
