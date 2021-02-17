import axios from 'axios';
import dbLog from '../repositories/logs';
import { LogTypes } from '../utils/constants';
import { APIConfig } from './Config';
import {
  SET_SPECIES_LIST,
  SET_SPECIE_ID,
  SET_MULTIPLE_TREES_SPECIES_LIST,
  ADD_MULTIPLE_TREE_SPECIE,
} from './Types';
const { protocol, url } = APIConfig;

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

export const getSpeciesList = (userToken) => {
  return new Promise((resolve) => {
    // makes an authorized GET request on /species to get the species list.
    axios({
      method: 'GET',
      url: `${protocol}://${url}/treemapper/species`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `OAuth ${userToken}`,
      },
    })
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
        console.error(`Error at /actions/species/getSpeciesList, ${JSON.stringify(err)}`);
        // logs the error of the failed request in DB
        dbLog.error({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Failed fetch of species list, GET - /species',
          statusCode: err?.response?.status,
        });
        resolve(false);
      });
  });
};

/**
 * Adds a scientific specie to user's preferred species
 * @param {string} userToken - used to authorize the request
 * @param {object} specieData - contains scientificSpecies as property having scientific specie id and
 *                              aliases as property (a name given by user to that scientific specie)
 */
export const addUserSpecie = (userToken, specieData) => {
  return new Promise((resolve, reject) => {
    // makes an authorized POST request on /species to add a specie of user.
    axios({
      method: 'POST',
      url: `${protocol}://${url}/treemapper/species`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `OAuth ${userToken}`,
      },
      data: specieData,
    })
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
 * Adds a scientific specie to user's preferred species
 * @param {string} userToken - used to authorize the request
 * @param {object} specieId - specie id of user saved species which is use to delete specie from server
 */
export const deleteUserSpecie = (userToken, specieId) => {
  return new Promise((resolve, reject) => {
    // makes an authorized DELETE request on /species to delete a specie of user.
    axios({
      method: 'DELETE',
      url: `${protocol}://${url}/treemapper/species/${specieId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `OAuth ${userToken}`,
      },
    })
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
          `Error at /actions/species/deleteUserSpecie, ${JSON.stringify(err?.response)}`,
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
