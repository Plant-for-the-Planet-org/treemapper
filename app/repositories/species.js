import Realm from 'realm';
import { bugsnag } from '../utils';
import {
  Coordinates,
  Polygons,
  User,
  OfflineMaps,
  Species,
  Inventory,
  AddSpecies,
  ActivityLogs,
} from './schema';

export const AddUserSpecies = ({ aliases, image, scientificName, speciesId }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Coordinates,
        Polygons,
        User,
        OfflineMaps,
        Species,
        Inventory,
        AddSpecies,
        ActivityLogs,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          let id = `${new Date().getTime()}`;
          realm.create('AddSpecies', {
            id,
            aliases,
            image,
            scientificName,
            status: 'pending',
            speciesId,
          });
          resolve(id);
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const getAllSpecies = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Coordinates,
        Polygons,
        User,
        OfflineMaps,
        Species,
        Inventory,
        AddSpecies,
        ActivityLogs,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          const species = realm.objects('AddSpecies');
          resolve(JSON.parse(JSON.stringify(species)));
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const insertImageForUserSpecies = ({ id, imagePath }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Coordinates,
        Polygons,
        User,
        OfflineMaps,
        Species,
        Inventory,
        AddSpecies,
        ActivityLogs,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          let specie = realm.objectForPrimaryKey('AddSpecies', `${id}`);
          specie.image = imagePath;
          resolve(true);
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};
export const updateNameForUserSpecies = ({ id, aliases }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Coordinates,
        Polygons,
        User,
        OfflineMaps,
        Species,
        Inventory,
        AddSpecies,
        ActivityLogs,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          let specie = realm.objectForPrimaryKey('AddSpecies', `${id}`);
          specie.aliases = aliases;
          resolve(true);
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const filterPendingSpecies = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Coordinates,
        Polygons,
        User,
        OfflineMaps,
        Species,
        Inventory,
        AddSpecies,
        ActivityLogs,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          const species = realm.objects('AddSpecies');
          let filteredSpecies = species.filtered('status == "pending"');
          resolve(JSON.parse(JSON.stringify(filteredSpecies)));
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const updateStatusForUserSpecies = ({ id }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Coordinates,
        Polygons,
        User,
        OfflineMaps,
        Species,
        Inventory,
        AddSpecies,
        ActivityLogs,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          let specie = realm.objectForPrimaryKey('AddSpecies', `${id}`);
          specie.status = 'complete';
          resolve(true);
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};
