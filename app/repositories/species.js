import Realm from 'realm';
import { bugsnag } from '../utils';
import {
  AddSpecies,
  Coordinates,
  Inventory,
  OfflineMaps,
  Polygons,
  Species,
  User,
  ScientificSpecies,
  ActivityLogs
} from './schema';
import { LogTypes } from '../utils/constants';
import dbLog from '../repositories/logs';

export const AddUserSpecies = ( scientificName, speciesId ) => {
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
          let id = `${new Date().getTime()}`;
          console.log(id, scientificName, speciesId, 'In AddUserSpwcies');
          realm.create('AddSpecies', {
            id,
            // aliases,
            // image,
            scientificName,
            // status: 'pending',
            speciesId,
          });
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: `Successfully added User Species: ${scientificName}`,
          });
          resolve(id);
          console.log('Species added');
        });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Error while adding User Species: ${scientificName}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        console.log(err);
        bugsnag.notify(err);
      });
  });
};

export const getAllSpecies = () => {
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
          const species = realm.objects('AddSpecies');
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'Successfully retrieved all User Species',
          });
          const sortedSpecies = species.sorted('scientificName');
          resolve(sortedSpecies);
        });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Error while retrieving all User Species',
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const insertImageForUserSpecies = ({ id, imagePath }) => {
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
          let specie = realm.objectForPrimaryKey('AddSpecies', `${id}`);
          specie.image = imagePath;
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: `Successfully inserted image for User species at ${imagePath}`,
          });
          resolve(true);
        });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Error while inserting Image for User species at: ${imagePath}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};
export const updateNameForUserSpecies = ({ id, aliases }) => {
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
          let specie = realm.objectForPrimaryKey('AddSpecies', `${id}`);
          specie.aliases = aliases;
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: `Successfully updated the name of User species as ${aliases}`,
          });
          resolve(true);
        });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Error while updating the name of User species as: ${aliases}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const filterPendingSpecies = () => {
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

export const updateLocalSpecies = (speciesData) => {
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
          for (const specie of speciesData) {
            realm.create('ScientificSpecies', specie);
          }
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'Successfully updated the Local Scientific species',
          });
          resolve(true);
        });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Error while updating the Local Scientific species',
          logStack: JSON.stringify(err),
        });
        reject(false);
        console.error(`Error at /repositories/species/updateLocalSpecies, ${JSON.stringify(err)}`);
        bugsnag.notify(err);
      });
  });
};

export const searchSpecies = (text) => {
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
        let species = realm.objects('ScientificSpecies');
        let searchedSpecies = species.filtered(`scientific_name contains[c] '${text}'`);
        searchedSpecies = searchedSpecies.sorted('scientific_name');
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Searching with Local Scientific species',
        });
        resolve(searchedSpecies);
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Error while searching with Local Scientific species',
          logStack: JSON.stringify(err),
        });
        reject(err);
        console.error(`Error at /repositories/species/searchSpecies, ${JSON.stringify(err)}`);
        bugsnag.notify(err);
      });
  });
};
