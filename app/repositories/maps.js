import Config from 'react-native-config';
import {
  AddSpecies,
  Coordinates,
  Inventory,
  OfflineMaps,
  Polygons,
  Species,
  User,
  ScientificSpecies,
} from './schema';
import Realm from 'realm';
import { bugsnag } from '../utils';

export const getAreaName = ({ coords }) => {
  return new Promise((resolve, reject) => {
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?types=place&access_token=${Config.MAPBOXGL_ACCCESS_TOKEN}`,
    )
      .then((res) => res.json())
      .then((res) => {
        if (res && res.features && res.features[0]) {
          resolve(res.features[0].place_name);
        } else {
          reject();
        }
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
      ],
    })
      .then((realm) => {
        realm.write(() => {
          const offlineMaps = realm.objects('OfflineMaps');
          resolve(JSON.parse(JSON.stringify(offlineMaps)));
        });
      })
      .catch(bugsnag.notify);
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
      ],
    })
      .then((realm) => {
        realm.write(() => {
          const offlineMaps = realm.objectForPrimaryKey('OfflineMaps', `${name}`);
          realm.delete(offlineMaps);
          resolve();
        });
      })
      .catch(bugsnag.notify);
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
      ],
    })
      .then((realm) => {
        realm.write(() => {
          realm.create('OfflineMaps', {
            name: name,
            size: size,
            areaName: areaName,
          });
          resolve(name);
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};
