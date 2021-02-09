import { bugsnag } from '../utils';

import { LogTypes } from '../utils/constants';
import dbLog from '../repositories/logs';
import getRealmConnection from './default';

export const updateLocalSpecies = (speciesData) => {
  return new Promise((resolve, reject) => {
    try {
      getRealmConnection().then((realm) => {
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
      });
    } catch (err) {
      dbLog.error({
        logType: LogTypes.MANAGE_SPECIES,
        message: 'Error while updating the Local Scientific species',
        logStack: JSON.stringify(err),
      });
      reject(false);
      console.error(`Error at /repositories/species/updateLocalSpecies, ${JSON.stringify(err)}`);
      bugsnag.notify(err);
    }
  });
};

export const searchSpeciesFromLocal = (text) => {
  return new Promise((resolve, reject) => {
    try {
      getRealmConnection().then((realm) => {
        let species = realm.objects('ScientificSpecies');
        let searchedSpecies = species.filtered(`scientific_name BEGINSWITH[c] '${text}'`);
        searchedSpecies = searchedSpecies.sorted('scientific_name');
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Searching with Local Scientific species',
        });
        resolve(searchedSpecies);
      });
    } catch (err) {
      dbLog.error({
        logType: LogTypes.MANAGE_SPECIES,
        message: 'Error while searching with Local Scientific species',
        logStack: JSON.stringify(err),
      });
      reject(err);
      console.error(
        `Error at /repositories/species/searchSpeciesFromLocal, ${JSON.stringify(err)}`,
      );
      bugsnag.notify(err);
    }
  });
};

export const toggleUserSpecies = (guid) => {
  return new Promise((resolve, reject) => {
    try {
      getRealmConnection().then((realm) => {
        realm.write(() => {
          let specieToToggle = realm.objectForPrimaryKey('ScientificSpecies', guid);
          specieToToggle.isUserSpecies = !specieToToggle.isUserSpecies;
          console.log(
            `Specie with guid ${guid} is toggled ${specieToToggle.isUserSpecies ? 'on' : 'off'}`,
          );
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: `Specie with guid ${guid} is toggled ${
              specieToToggle.isUserSpecies ? 'on' : 'off'
            }`,
          });
        });
        resolve();
      });
    } catch (err) {
      dbLog.error({
        logType: LogTypes.MANAGE_SPECIES,
        message: `Error while modifying user specie with id ${guid}`,
        logStack: JSON.stringify(err),
      });
      reject(err);
      console.error(`Error at /repositories/species/toggleUserSpecies, ${JSON.stringify(err)}`);
      bugsnag.notify(err);
    }
  });
};

export const getUserSpecies = () => {
  return new Promise((resolve, reject) => {
    try {
      getRealmConnection().then((realm) => {
        let species = realm.objects('ScientificSpecies');
        let userSpecies = species.filtered('isUserSpecies = true');
        userSpecies = userSpecies.sorted('scientific_name');
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Retrieved User Species from Local',
        });
        resolve(userSpecies);
      });
    } catch (err) {
      dbLog.error({
        logType: LogTypes.MANAGE_SPECIES,
        message: 'Error while retrieving User Species from Local',
        logStack: JSON.stringify(err),
      });
      reject(err);
      console.error(`Error at /repositories/species/getUserSpecies, ${JSON.stringify(err)}`);
      bugsnag.notify(err);
    }
  });
};
