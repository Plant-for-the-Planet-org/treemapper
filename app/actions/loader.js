import { UPDATE_LOADING } from './Types';

export const startLoading = () => (dispatch) => {
  dispatch({
    type: UPDATE_LOADING,
    payload: true,
  });
};

export const stopLoading = () => (dispatch) => {
  dispatch({
    type: UPDATE_LOADING,
    payload: false,
  });
};
