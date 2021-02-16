import { addUserSpecie, getSpeciesList } from '../actions/species';
import { bugsnag } from '_utils';
import dbLog from '../repositories/logs';
import { updateAndGetUserSpeciesToSync } from '../repositories/species';
import { LogTypes } from './constants';

export const checkAndAddUserSpecies = async (userToken) => {
  try {
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
        message: 'No user species present to sync with server',
      });
    }
  } catch (err) {
    console.log(`Error at /utils/addUserSpecies/checkAndAddUserSpecies, ${JSON.stringify(err)}`);
    dbLog.error({
      logType: LogTypes.MANAGE_SPECIES,
      message: `Error while syncing user species to server`,
      logStack: JSON.stringify(err),
    });
    bugsnag.notify(err);
  }
};
