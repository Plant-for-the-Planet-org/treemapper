import { bugsnag } from '../utils';
import Realm from 'realm';
import { LogTypes } from '../utils/constants';
import dbLog from '../repositories/logs';
import { getSchema } from './default';

export const updateAndSyncLocalSpecies = (speciesData) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          speciesData.forEach((specie, index) => {
            realm.create('ScientificSpecies', specie);
            if (index === speciesData.length - 1) {
              // logging the success in to the db
              dbLog.info({
                logType: LogTypes.MANAGE_SPECIES,
                message: 'Successfully updated the Local Scientific species',
              });
              resolve(true);
            }
          });
        });
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Error while updating the Local Scientific species',
          logStack: JSON.stringify(err),
        });
        console.error(
          `Error at /repositories/species/updateAndSyncLocalSpecies, ${JSON.stringify(err)}`,
        );
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const searchSpeciesFromLocal = (text) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        let species = realm.objects('ScientificSpecies');
        let searchedSpecies = species.filtered(`scientific_name BEGINSWITH[c] '${text}'`);
        searchedSpecies = searchedSpecies.sorted('scientific_name');
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Searching in Local Scientific species with text:${text}`,
        });
        resolve(searchedSpecies);
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Error while searching in Local Scientific species with text:${text}`,
          logStack: JSON.stringify(err),
        });
        console.error(
          `Error at /repositories/species/searchSpeciesFromLocal, ${JSON.stringify(err)}`,
        );
        bugsnag.notify(err);
        reject(err);
      });
  });
};

export const getUserSpecies = () => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        let species = realm.objects('ScientificSpecies');
        let userSpecies = species.filtered('isUserSpecies = true');
        userSpecies = userSpecies.sorted('scientific_name');
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Retrieved User Species from Local',
        });
        resolve(userSpecies);
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Error while retrieving User Species from Local',
          logStack: JSON.stringify(err),
        });
        reject(err);
        console.error(`Error at /repositories/species/getUserSpecies, ${JSON.stringify(err)}`);
        bugsnag.notify(err);
      });
  });
};

/**
 * Gets all the user preferred species which are not synced with server.
 * It filters the [ScientificSpecies] model with conditions [isUserSpecies = true]
 * and [isUploaded = false]
 * @param {Array} alreadySyncedSpecies - contains the list of already synced user's preferred species
 */
export const updateAndGetUserSpeciesToSync = (alreadySyncedSpecies) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        if (alreadySyncedSpecies) {
          // iterates through all the user preferred species which are already synced and updates the same in DB
          realm.write(() => {
            for (const specie of alreadySyncedSpecies) {
              // find the scientific specie using scientific specie guid and update the properties to
              // [isUploaded = true] and [isUserSpecies = true]
              let specieResult = realm.objectForPrimaryKey(
                'ScientificSpecies',
                specie.scientificSpecies,
              );
              specieResult.isUploaded = true;
              specieResult.isUserSpecies = true;
              // logging the success in to the db
              dbLog.info({
                logType: LogTypes.MANAGE_SPECIES,
                message: `Marked local specie with guid: ${specie.scientificSpecies} as isUserSpecies and isUploaded`,
              });
            }
          });
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'Updated all the local species with already synced species from server',
          });
        } else {
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'No synced species found from server',
          });
        }

        // fetches all the scientific species
        let species = realm.objects('ScientificSpecies');

        // filters by [isUserSpecies = true] and [isUploaded = false] to get species to sync to server
        let userSpeciesToSync = species.filtered('isUserSpecies = true AND isUploaded = false');

        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Fetched not uploaded user species',
        });
        resolve(userSpeciesToSync);
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Error while retrieving not uploaded user Species',
          logStack: JSON.stringify(err),
        });
        console.error(
          `Error at /repositories/species/updateAndGetUserSpeciesToSync, ${JSON.stringify(err)}`,
        );
        bugsnag.notify(err);
        resolve(false);
      });
  });
};
