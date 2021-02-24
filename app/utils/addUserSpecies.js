import { addUserSpecie, getSpeciesList, deleteUserSpecie } from '../actions/species';
import { bugsnag } from './index';
import dbLog from '../repositories/logs';
import {
  updateAndGetUserSpeciesToSync,
  addSpecieIdFromSyncedSpecie,
  removeSpecieId,
} from '../repositories/species';
import { LogTypes } from './constants';
import AsyncStorage from '@react-native-community/async-storage';

/**
 * This function first checks if the scientific species are updated in local DB then only checks
 * for already uploaded species of user from server and updates the status of same in local DB.
 * Followed by filtering out the species from local DB which are not uploaded/synced to server and
 * then creates the not uploaded user's species on server one by one.
 *
 * @param {string} isFirstUpdate - if [true] then adds the species from server to local DB else deletes the
 *                                 the species from server if not marked as user specie in local DB.
 *                                 Default value is [false]
 */
export const checkAndAddUserSpecies = async (isFirstUpdate = false) => {
  try {
    // calls the function and stores whether species data was already loaded or not
    const isSpeciesLoaded = await AsyncStorage.getItem('isLocalSpeciesUpdated');

    // checks and sync the species only if the local species are updated
    if (isSpeciesLoaded === 'true') {
      // gets all the user species synced on the server
      getSpeciesList()
        .then(async (alreadySyncedSpecies) => {
          // passes already synced species fetched from server to update the local species and gets the
          // local species which are not uploaded to server
          updateAndGetUserSpeciesToSync(isFirstUpdate ? alreadySyncedSpecies : null)
            .then((speciesToSync) => {
              // checks if [speciesToSync] is present and has data to iterate
              if (speciesToSync && speciesToSync.length > 0) {
                // adds or deletes the species
                addOrDeleteUserSpecies(speciesToSync, alreadySyncedSpecies);

                // logging the success in to the db after all the species are synced
                dbLog.info({
                  logType: LogTypes.MANAGE_SPECIES,
                  message: 'Syncing of all user species to server completed',
                });
              } else {
                // logging the success in to the db
                dbLog.info({
                  logType: LogTypes.MANAGE_SPECIES,
                  message: 'No new user species present to sync with server',
                });
              }
            })
            .catch((err) => {
              console.error(
                `Error at /utils/addUserSpecies/checkAndAddUserSpecies - getSpeciesList/updateAndGetUserSpeciesToSync, ${JSON.stringify(
                  err,
                )}`,
              );
            });
        })
        .catch((err) => {
          console.error(
            `Error at /utils/addUserSpecies/checkAndAddUserSpecies - getSpeciesList, ${JSON.stringify(
              err,
            )}`,
          );
        });
    } else {
      // logging the success in to the db
      dbLog.info({
        logType: LogTypes.MANAGE_SPECIES,
        message: 'Cannot sync user species until scientific species are loaded in DB',
      });
    }
  } catch (err) {
    console.error(`Error at /utils/addUserSpecies/checkAndAddUserSpecies, ${JSON.stringify(err)}`);
    dbLog.error({
      logType: LogTypes.MANAGE_SPECIES,
      message: 'Error while syncing user species to server',
      logStack: JSON.stringify(err),
    });
    bugsnag.notify(err);
  }
};

/**
 *
 * @param {string} scientificSpecieGuid - scientific species guid to search with
 * @param {Array} alreadySyncedSpecies - includes all the species which are already synced on server
 */
const addFromAlreadySyncedSpecies = (scientificSpecieGuid, alreadySyncedSpecies) => {
  // iterates through the already synced species and updates the specie id,
  // if scientific specie guid matches with already synced specie scientific species
  for (const specie of alreadySyncedSpecies) {
    if (specie.scientificSpecies === scientificSpecieGuid) {
      try {
        // updates specie id in DB
        addSpecieIdFromSyncedSpecie(scientificSpecieGuid, specie.id);
      } catch (err) {
        console.error(
          `Error at /utils/addUserSpecies/addFromAlreadySyncedSpecies, ${JSON.stringify(err)}`,
        );
      }
      break;
    }
  }
};

/**
 * Iterates through the list of [speciesToSync] to add or delete the specie on server and
 * update the status of the same in local DB
 * @param {Array} speciesToSync  - array of species that are not synced on the server
 * @param {Array} alreadySyncedSpecies - array of species which are already synced on the server
 */
const addOrDeleteUserSpecies = (speciesToSync, alreadySyncedSpecies) => {
  // iterates through the list of [speciesToSync] to add the specie on server and if result is success
  // then updates the [isUploaded] property in local DB to [true] else logs the error
  for (const specie of speciesToSync) {
    if (specie.isUserSpecies && !specie.isUploaded) {
      addUserSpecieToServer(specie, alreadySyncedSpecies);
    } else if (!specie.isUserSpecies && specie.isUploaded) {
      deleteUserSpecieFromServer(specie);
    }
  }
};

/**
 * Adds the specie to the server and if the specie is already present in the server
 * then updates in local DB using the [alreadySyncedSpecies] array
 *
 * @param {Object} specie - specie which is to be added to the server
 * @param {Array} alreadySyncedSpecies - array of already synced species present on server
 */
const addUserSpecieToServer = (specie, alreadySyncedSpecies) => {
  // calls the api function with user token and specie to add specie on the server
  addUserSpecie({
    scientificSpecies: specie.guid,
    aliases: specie.scientificName,
  })
    .then((result) => {
      if (result) {
        try {
          addSpecieIdFromSyncedSpecie(specie.guid, result.id);
        } catch (err) {
          console.error(
            `Error at /utils/addUserSpecies/addUserSpecieToServer, ${JSON.stringify(err)}`,
          );
        }
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Successfully added user specie to server with scientific specie guid: ${specie.guid}`,
        });
      } else {
        // logging the warn in to the db
        dbLog.warn({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Got false result while trying to add specie with scientific specie guid: ${specie.guid}`,
        });
      }
    })
    .catch((err) => {
      if (
        err?.response?.status === 400 &&
        err.response.data?.errors &&
        err.response.data?.errors?.errors?.includes(
          'you already have defined a species based on the provided scientificSpecies id',
        )
      ) {
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Scientific specie guid: ${specie.guid} is already present on server.`,
        });
        if (alreadySyncedSpecies) {
          // used to find the already synced species using the scientific species and update the same in DB
          addFromAlreadySyncedSpecies(specie.guid, alreadySyncedSpecies);
        }
      } else {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Failed to add user specie to server with scientific specie guid: ${specie.guid}`,
        });
      }
    });
};

/**
 * Calls the delete api function to delete the specie and if already present then updates the same in local DB
 *
 * @param {object} specie - user specie which is to be deleted from the server
 */
const deleteUserSpecieFromServer = (specie) => {
  // calls the api function with user token and specie to delete the specie from the server
  deleteUserSpecie(specie.specieId)
    .then((result) => {
      if (result) {
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Successfully deleted user specie from server with specie id: ${specie.specieId}`,
        });
        try {
          removeSpecieId(specie.guid);
        } catch (err) {
          console.error(
            `Error at /utils/addUserSpecies/deleteUserSpecieFromServer, ${JSON.stringify(err)}`,
          );
        }
      } else {
        // logging the warn in to the db
        dbLog.warn({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Got false result while trying to delete specie from server with specie guid: ${specie.specieId}`,
        });
      }
    })
    .catch((err) => {
      if (err?.response?.status === 404) {
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: `User specie with specie id: ${specie.specieId} is already deleted from server`,
        });
        try {
          removeSpecieId(specie.guid);
        } catch (err) {
          console.error(
            `Error at /utils/addUserSpecies/deleteUserSpecieFromServer, ${JSON.stringify(err)}`,
          );
        }
      } else {
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Failed to delete user specie from server with specie id: ${specie.specieId}`,
        });
      }
    });
};
