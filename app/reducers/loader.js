import React, { createContext, useReducer } from 'react';
import { SET_LOADING, SET_SIGNUP_LOADING } from '../actions/Types';

// stores the initial properties of the loading state
const initialState = {
  isLoading: false,
  isSignUpLoading: false,
};

// Loading reducer function which takes the state and action param
const loadingReducer = (state = initialState, action) => {
  // used to switch between the action types
  switch (action.type) {
    // updates the isLoading state
    case SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    // updates the isSignUpLoading state
    case SET_SIGNUP_LOADING:
      return {
        ...state,
        isSignUpLoading: action.payload,
      };
    // changes the pending
    default:
      return state;
  }
};

// Creates the context object for Loading. Used by component to get the state and dispatch function of loading
export const LoadingContext = createContext({
  state: initialState,
  dispatch: () => null,
});

// Create a provider for components to consume and subscribe to changes
export const LoadingContextProvider = ({ children }) => {
  // stores state and dispatch of loading using the reducer and initialState
  const [state, dispatch] = useReducer(loadingReducer, initialState);

  // returns a provider used by component to access the state and dispatch function of loading
  return <LoadingContext.Provider value={{ state, dispatch }}>{children}</LoadingContext.Provider>;
};
