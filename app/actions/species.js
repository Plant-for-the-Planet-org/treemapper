import RNFS from 'react-native-fs';
import i18next from '../languages/languages';
import dbLog from '../repositories/logs';
import { changeIsUpdatedStatus } from '../repositories/species';
import { bugsnag } from '../utils';
import {
  deleteAuthenticatedRequest,
  getAuthenticatedRequest,
  postAuthenticatedRequest,
  putAuthenticatedRequest,
} from '../utils/api';
import { LogTypes } from '../utils/constants';
import {
  ADD_MULTIPLE_TREE_SPECIE,
  SET_MULTIPLE_TREES_SPECIES_LIST,
  SET_SPECIES_LIST,
  SET_SPECIE_ID,
} from './Types';
import { getCdnUrls } from './user';

/**
 * This function dispatches type SET_SPECIES_LIST with payload list of species to add in species state
 * It requires the following param
 * @param {array} speciesList - list of species which should be added/updated in app state
 */
export const setSpeciesList = (speciesList) => (dispatch) => {
  dispatch({
    type: SET_SPECIES_LIST,
    payload: speciesList,
  });
};

/**
 * This function dispatches type SET_SPECIE_ID with payload specie id to add in species state
 * It requires the following param
 * @param {string} specieId - specie id which should be added/updated in app state
 */
export const setSpecieId = (specieId) => (dispatch) => {
  dispatch({
    type: SET_SPECIE_ID,
    payload: specieId,
  });
};

/**
 * This function dispatches type SET_MULTIPLE_TREES_SPECIES_LIST with payload having list of species selected during
 * multiple trees registration to add in species state.
 * It requires the following param
 * @param {string} speciesList - List of species selected for multiple tree registration to set in app's species state
 */
export const setMultipleTreesSpeciesList = (speciesList) => (dispatch) => {
  dispatch({
    type: SET_MULTIPLE_TREES_SPECIES_LIST,
    payload: speciesList,
  });
};

export const addMultipleTreesSpecie = (specie) => (dispatch) => {
  dispatch({
    type: ADD_MULTIPLE_TREE_SPECIE,
    payload: specie,
  });
};

/**
 * Fetches all the species of the user
 */
export const getSpeciesList = () => {
  return new Promise((resolve, reject) => {
    // makes an authorized GET request on /species to get the species list.
    getAuthenticatedRequest('/treemapper/species')
      .then((res) => {
        const { data, status } = res;
        // checks if the status code is 200 the resolves the promise with the fetched data
        if (status === 200) {
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'Fetched species list, GET - /species',
            statusCode: status,
          });
          resolve(data);
        } else {
          resolve(false);
        }
      })
      .catch((err) => {
        // logs the error
        console.error(`Error at /actions/species/getSpeciesList, ${JSON.stringify(err.response)}`);
        // logs the error of the failed request in DB
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Failed fetch of species list, GET - /species',
          statusCode: err?.response?.status,
        });
        bugsnag.notify(err);
        reject(err);
      });
  });
};

/**
 * Adds a scientific specie to user's preferred species
 * @param {object} specieData - contains scientificSpecies as property having scientific specie id and
 *                              aliases as property (a name given by user to that scientific specie)
 */
export const addUserSpecie = (specieData) => {
  console.log('addUserSpecie', specieData);

  return new Promise((resolve, reject) => {
    // makes an authorized POST request on /species to add a specie of user.
    postAuthenticatedRequest('/treemapper/species', specieData)
      .then((res) => {
        const { data, status } = res;

        // checks if the status code is 200 the resolves the promise with the fetched data
        if (status === 200) {
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: `Successfully added user specie to server with scientific specie guid: ${specieData.scientificSpecies}, POST - /species`,
            statusCode: status,
          });
          resolve(data);
        } else {
          // logging the success in to the db
          dbLog.warn({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'Got success response from server other than status code 200, POST - /species',
            statusCode: status,
          });
          resolve(false);
        }
      })
      .catch((err) => {
        // logs the error
        console.error(`Error at /actions/species/addUserSpecie, ${JSON.stringify(err?.response)}`);
        // logs the error of the failed request in DB
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Failed to add scientific species having id ${specieData.scientificSpecies}, POST - /species`,
          statusCode: err?.response?.status,
          logStack: JSON.stringify(err?.response),
        });
        reject(err);
      });
  });
};

/**
 * Delete the user specie from the server using the specie id
 * @param {object} specieId - specie id of user saved species which is use to delete specie from server
 */
export const deleteUserSpecie = (specieId) => {
  return new Promise((resolve, reject) => {
    // makes an authorized DELETE request on /species to delete a specie of user.
    deleteAuthenticatedRequest(`/treemapper/species/${specieId}`)
      .then((res) => {
        const { status } = res;

        // checks if the status code is 204 then resolves the promise
        if (status === 204) {
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: `Successfully deleted user specie from server with specie id: ${specieId}, DELETE - /species`,
            statusCode: status,
          });
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((err) => {
        // logs the error
        console.error(
          `Error at /actions/species/deleteUserSpecie, ${JSON.stringify(err?.response)}, ${err}`,
        );
        // logs the error of the failed request in DB
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Failed to delete user species having id ${specieId}, DELETE - /species`,
          statusCode: err?.response?.status,
          logStack: JSON.stringify(err?.response),
        });
        reject(err);
      });
  });
};

export const updateUserSpecie = ({
  scientificSpecieGuid,
  specieId,
  aliases,
  description,
  image,
}) => {
  return new Promise((resolve, reject) => {
    const data = { aliases, description, imageFile: image };
    // makes an authorized DELETE request on /species to delete a specie of user.
    putAuthenticatedRequest(`/treemapper/species/${specieId}`, data)
      .then((res) => {
        const { status } = res;
        console.log(status, 'status');
        // checks if the status code is 204 then resolves the promise
        if (status === 200) {
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: `Updated specie with specie id ${specieId}, PUT - /treemapper/species`,
            statusCode: status,
          });
          changeIsUpdatedStatus({ scientificSpecieGuid, isUpdated: true });
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((err) => {
        // logs the error of the failed request in DB
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Failed to update specie with specie id ${specieId}, PUT - /treemapper/species`,
          statusCode: err?.response?.status,
          logStack: JSON.stringify(err?.response),
        });
        reject(err);
      });
  });
};

export const UpdateSpeciesImage = (image, speciesId, SpecieGuid) => {
  return new Promise((resolve, reject) => {
    let body = {
      imageFile: `data:image/jpeg;base64,${image}`,
    };

    putAuthenticatedRequest(`/treemapper/species/${speciesId}`, body)
      .then((res) => {
        const { status, data } = res;
        if (status === 200) {
          changeIsUpdatedStatus({ scientificSpecieGuid: SpecieGuid, isUpdated: true });
          resolve(true);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getBase64ImageFromURL = async (specieImage) => {
  return new Promise(async (resolve, reject) => {
    await getCdnUrls(i18next.language)
      .then(async (cdnMedia) => {
        await RNFS.downloadFile({
          fromUrl: `${cdnMedia.cache}/species/default/${specieImage}`,
          toFile: `${RNFS.DocumentDirectoryPath}/${specieImage}`,
        }).promise.then(async (r) => {
          console.log(r, 'Done');
          await RNFS.readFile(`${RNFS.DocumentDirectoryPath}/${specieImage}`, 'base64').then(
            (data) => {
              resolve(data);
            },
          );
          await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${specieImage}`)
            .then(() => {
              console.log('Image deleted from FS');
            })
            // `unlink` will throw an error, if the item to unlink does not exist
            .catch((err) => {
              resolve();
              console.log(err.message);
            });
        });
      })
      .catch((err) => {
        bugsnag.notify(err);
        resolve();
      });
  });
};
