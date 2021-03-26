import { bugsnag } from '../utils';
import dbLog from '../repositories/logs';
import { LogTypes } from '../utils/constants';
import {
  SET_SPECIES_LIST,
  SET_SPECIE_ID,
  SET_MULTIPLE_TREES_SPECIES_LIST,
  ADD_MULTIPLE_TREE_SPECIE,
} from './Types';
import {
  deleteAuthenticatedRequest,
  getAuthenticatedRequest,
  postAuthenticatedRequest,
  putAuthenticatedRequest,
} from '../utils/api';

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
            message: `Added scientific species having id ${specieData.scientificSpecies}, POST - /species`,
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
            message: `Deleted user species having id ${specieId}, DELETE - /species`,
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

export const setSpecieAliases = ({ specieId, aliases, description }) => {
  return new Promise((resolve, reject) => {
    const data = { aliases, description };
    console.log(data, 'data');
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
            message: `Set aliases to species having id ${specieId}, PUT - /species`,
            statusCode: status,
          });
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((err) => {
        // logs the error
        console.error(`Error at /actions/species/setAliases, ${JSON.stringify(err?.response)}`);
        // logs the error of the failed request in DB
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: `Failed to set aliases to species having id ${specieId}, PUT - /species`,
          statusCode: err?.response?.status,
          logStack: JSON.stringify(err?.response),
        });
        reject(err);
      });
  });
};
