import RNFS, { DocumentDirectoryPath } from 'react-native-fs';
import { updateAndSyncLocalSpecies as updateLocalSpeciesRepo } from '../repositories/species';
import { unzip } from 'react-native-zip-archive';
import { APIConfig } from '../actions/Config';
import AsyncStorage from '@react-native-community/async-storage';
import { checkAndAddUserSpecies } from '../utils/addUserSpecies';
import dbLog from '../repositories/logs';
import { LogTypes } from './constants';

/**
 * Reads the target path passed as params and parse the file contents to update the species locally in DB.
 * Once the update is successful then mark adds an AsyncStorage property [isLocalSpeciesUpdated] with value [true]
 *
 * @param {string} targetPath - used to read the file from file system and update the local species from the file contents
 * @param {string} accessToken - used to sync the species with the server if available
 */
const updateSpeciesFromFile = (targetPath, accessToken) => {
  return new Promise((resolve) => {
    // reads the file content using the passed target path in utf-8 format
    RNFS.readFile(targetPath, 'utf8')
      .then((speciesContent) => {
        // parses the content to make is feasible to read and update the contents in DB
        speciesContent = JSON.parse(speciesContent);

        // calls the function and pass the parsed content to update the species in local DB
        updateLocalSpeciesRepo(speciesContent)
          .then(async () => {
            // adds an AsyncStorage item [isLocalSpeciesUpdated] with value [true], which helps to determine
            // whether species were already updated in local DB or not
            await AsyncStorage.setItem('isLocalSpeciesUpdated', 'true');

            // if [accessToken] is present then start syncing of species from and to the server
            if (accessToken) {
              checkAndAddUserSpecies(accessToken);
            }
            resolve(true);
          })
          .catch((err) => {
            console.error(err);
            resolve(false);
          });
      })
      .catch((err) => {
        console.error(
          `Error at /utils/updateSpeciesFromFile while reading file at path ${targetPath}, ${JSON.stringify(
            err,
          )}`,
        );
        // logging the success in to the db
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Error while reading file at path ${targetPath} for updating local species`,
          logStack: JSON.stringify(err),
        });
        resolve(false);
      });
  });
};

/**
 * Used to download scientific species archive file and add the species in the local DB.
 * First checks if the file is already present in file system or not then checks if species are
 * already added locally in DB.
 * If the file exists and species not updated in DB then adds the data in DB.
 * Else if the file is not present and species are not updated in DB then download the file and
 * updates the species in local DB.
 * Else if species is already updated and [accessToken] is present then starts syncing of species
 * from and to the server
 *
 * @param {string} accessToken - used to sync the species with the server if available
 */
export default async function updateAndSyncLocalSpecies(accessToken = null) {
  // stores the target path of the json file
  const targetPath = `${DocumentDirectoryPath}/scientific_species.json`;

  // checks whether the file exist or not
  const doesPathExist = await RNFS.exists(targetPath);

  // calls the function and stores whether species data was already loaded or not
  const isSpeciesLoaded = await AsyncStorage.getItem('isLocalSpeciesUpdated');

  // if species data is not loaded and path exists then it reads the file and calls the updateAndSyncLocalSpecies function
  // with parsed file content to update the data in realm DB
  // .
  // else it checks if species data is not loaded then and json file also not exists then calls the archive api
  // to get the zip file then extract and save it to document directory
  if (isSpeciesLoaded !== 'true' && doesPathExist) {
    dbLog.info({
      logType: LogTypes.MANAGE_SPECIES,
      message: 'Species are not updated but archive file is already present',
    });
    updateSpeciesFromFile(targetPath, accessToken);
  } else if (isSpeciesLoaded !== 'true' && !doesPathExist) {
    dbLog.info({
      logType: LogTypes.MANAGE_SPECIES,
      message: 'Species are not updated also archive file is not present',
    });
    try {
      const { protocol, url } = APIConfig;

      // stores the path of zip file
      const zipFilePath = `${DocumentDirectoryPath}/species.zip`;

      // downloads the zip file from the link and then after completion unzip the file updates the
      // species in local DB
      RNFS.downloadFile({
        fromUrl: `${protocol}://${url}/treemapper/scientificSpeciesArchive`,
        toFile: zipFilePath,
      })
        .promise.then(async (response) => {
          // if response is 200 then unzips the file and adds the species in local DB
          if (response.statusCode === 200) {
            // unzips the downloaded file in document directory
            await unzip(zipFilePath, DocumentDirectoryPath, 'UTF-8');
            // this function updates the species in DB after reading the content of the file
            updateSpeciesFromFile(targetPath, accessToken);
            dbLog.info({
              logType: LogTypes.MANAGE_SPECIES,
              message: 'Scientific Species zip downloaded successfully, GET - /scientificSpeciesArchive',
              statusCode: response.statusCode,
            });
          }
        })
        .catch((err) => {
          // logs the error while downloading a file
          console.error(
            `Error at /utils/updateAndSyncLocalSpecies - downloadFile, ${JSON.stringify(err)}`,
          );
          dbLog.error({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'Error while downloading scientific species zip, GET - /scientificSpeciesArchive',
            logStack: JSON.stringify(err),
          });
        });
    } catch (err) {
      // logs the error while updating species data from file
      console.error(`Error at /utils/updateAndSyncLocalSpecies, ${JSON.stringify(err)}`);
      dbLog.error({
        logType: LogTypes.MANAGE_SPECIES,
        message: 'Error while updating species data from file',
        logStack: JSON.stringify(err),
      });
    }
  } else if (accessToken) {
    checkAndAddUserSpecies(accessToken);
  }
}
