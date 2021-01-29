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
 * This function makes an axios call to GET /treemapper/species to fetch the list of species and returns
 * the result by resolving it. If there's any error then resolve false as boolean value.
 * It requires the following param
 * @param {string} userToken - user token, required to pass in authorization header
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
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Fetched species list, GET - /species',
          statusCode: status,
        });
        // checks if the status code is 200 the resolves the promise with the fetched data
        if (status === 200) {
          resolve(data);
        }
      })
      .catch((err) => {
        // logs the error
        console.error(`Error at /actions/species/getSpeciesList, ${JSON.stringify(err)}`);
        // logs the error of the failed request in DB
        dbLog.info({
          logType: LogTypes.MANAGE_SPECIES,
          message: 'Failed fetch of species list, GET - /species',
          statusCode: err.status,
        });
        resolve(false);
      });
  });
};
