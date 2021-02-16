import { addUserSpecie, getSpeciesList } from '../actions/species';
import { bugsnag } from '_utils';
import dbLog from '../repositories/logs';
import { updateAndGetUserSpeciesToSync } from '../repositories/species';
import { LogTypes } from './constants';
import AsyncStorage from '@react-native-community/async-storage';

/**
 * This function first checks if the scientific species are updated in local DB then only checks
 * for already uploaded species of user from server and updates the status of same in local DB.
 * Followed by filtering out the species from local DB which are not uploaded/synced to server and
 * then creates the not uploaded user's species on server one by one.
 *
 * @param {string} userToken - used to pass it to other function using to send authorized request to API
 */
export const checkAndAddUserSpecies = async (userToken) => {
  try {
    // calls the function and stores whether species data was already loaded or not
    const isSpeciesLoaded = await AsyncStorage.getItem('isLocalSpeciesUpdated');

    // checks and sync the species only if the local species are updated
    if (isSpeciesLoaded === 'true') {
      // gets all the user species synced on the server
      const alreadySyncedSpecies = await getSpeciesList(userToken);

      // passes already synced species fetched from server to update the local species and gets the
      // local species which are not uploaded to server
      const speciesToSync = await updateAndGetUserSpeciesToSync(alreadySyncedSpecies);

      // checks if [speciesToSync] is present and has data to iterate
      if (speciesToSync && speciesToSync.length > 0) {
        // iterates through the list of [speciesToSync] to add the specie on server and if result is success
        // then updates the [isUploaded] property in local DB to [true] else logs the error
        for (const specie of speciesToSync) {
          const result = await addUserSpecie(userToken, {
            scientificSpecies: specie.guid,
            aliases: specie.scientific_name,
          });
          if (result) {
            // logging the success in to the db
            dbLog.info({
              logType: LogTypes.MANAGE_SPECIES,
              message: `Successfully synced user specie to server with scientific specie guid: ${specie.guid}`,
            });
          } else {
            dbLog.error({
              logType: LogTypes.MANAGE_SPECIES,
              message: `Failed to sync user specie to server with scientific specie guid: ${specie.guid}`,
            });
          }
        }
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
    } else {
      // logging the success in to the db
      dbLog.info({
        logType: LogTypes.MANAGE_SPECIES,
        message: 'Cannot sync user species until scientific species are loaded in DB',
      });
    }
  } catch (err) {
    console.log(`Error at /utils/addUserSpecies/checkAndAddUserSpecies, ${JSON.stringify(err)}`);
    dbLog.error({
      logType: LogTypes.MANAGE_SPECIES,
      message: 'Error while syncing user species to server',
      logStack: JSON.stringify(err),
    });
    bugsnag.notify(err);
  }
};
