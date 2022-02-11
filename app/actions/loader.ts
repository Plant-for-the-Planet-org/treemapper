import { SET_LOADING, SET_SIGNUP_LOADING } from './Types';
import React from 'react';

/**
 * This function dispatches type SET_LOADING with payload of boolean value [true] to update in loading state.
 */
export const startLoading = () => (dispatch: React.Dispatch<any>) => {
  dispatch({
    type: SET_LOADING,
    payload: true,
  });
};


/**
 * This function dispatches type SET_LOADING with payload of boolean value [false] to update in loading state.
 */
export const stopLoading = () => (dispatch: React.Dispatch<any>) => {
  dispatch({
    type: SET_LOADING,
    payload: false,
  });
};

/**
 * This function dispatches type SET_SIGNUP_LOADING with payload of boolean value [true] to update in loading state.
 */
export const startSignUpLoading = () => (dispatch: React.Dispatch<any>) => {
  dispatch({
    type: SET_SIGNUP_LOADING,
    payload: true,
  });
};

/**
 * This function dispatches type SET_SIGNUP_LOADING with payload of boolean value [false] to update in loading state.
 */
export const stopSignUpLoading = () => (dispatch: React.Dispatch<any>) => {
  dispatch({
    type: SET_SIGNUP_LOADING,
    payload: false,
  });
};
