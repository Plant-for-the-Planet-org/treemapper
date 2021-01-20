import { SET_SPECIES_LIST, SET_SPECIE_ID } from './Types';

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
