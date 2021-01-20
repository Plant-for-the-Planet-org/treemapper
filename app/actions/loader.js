import { SET_LOADING, SET_SIGNUP_LOADING } from './Types';

export const startLoading = () => (dispatch) => {
  dispatch({
    type: SET_LOADING,
    payload: true,
  });
};

export const stopLoading = () => (dispatch) => {
  dispatch({
    type: SET_LOADING,
    payload: false,
  });
};

export const startSignUpLoading = () => (dispatch) => {
  dispatch({
    type: SET_SIGNUP_LOADING,
    payload: true,
  });
};

export const stopSignUpLoading = () => (dispatch) => {
  dispatch({
    type: SET_SIGNUP_LOADING,
    payload: false,
  });
};
