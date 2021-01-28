import axios from 'axios';
import { APIConfig } from './Config';
import {
  SET_SPECIES_LIST,
  SET_SPECIE_ID,
  SET_MULTIPLE_TREES_SPECIES_LIST,
  ADD_MULTIPLE_TREE_SPECIE,
} from './Types';
const { protocol, url } = APIConfig;

export const setSpeciesList = (speciesList) => (dispatch) => {
  dispatch({
    type: SET_SPECIES_LIST,
    payload: speciesList,
  });
};

export const setSpecieId = (specieId) => (dispatch) => {
  dispatch({
    type: SET_SPECIE_ID,
    payload: specieId,
  });
};

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
  return new Promise((resolve, reject) => {
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
        if (status === 200) {
          resolve(data);
        }
      })
      .catch((err) => {
        resolve(false);
        console.error(`Error at /actions/species/getSpeciesList, ${JSON.stringify(err)}`);
      });
  });
};
