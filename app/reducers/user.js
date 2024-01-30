import React, { createContext, useContext, useReducer } from 'react';
import { SET_INITIAL_USER_STATE, SET_USER_DETAILS, CLEAR_USER_DETAILS } from '../actions/Types';

// stores the initial properties of the user state
const initialState = {
  accessToken: null,
  idToken: null,
  email: null,
  firstName: null,
  lastName: null,
  image: null,
  country: null,
  idLogEnabled: null,
  userId: null,
  type: null,
};

// User reducer function which takes the state and action param
const userReducer = (state = initialState, action) => {
  // used to switch between the action types
  switch (action.type) {
    // adds the accessToken, idToken
    case SET_INITIAL_USER_STATE:
      return {
        ...state,
        accessToken: action.payload.accessToken,
        idToken: action.payload.idToken,
      };
    // adds accessToken, idToken, email, firstName, lastName, image, country, idLogEnabled and userId
    case SET_USER_DETAILS:
      return {
        ...state,
        ...action.payload,
      };
    // resets the user state to initialState
    case CLEAR_USER_DETAILS:
      return initialState;
    // returns the state as is if no type is found
    default:
      return state;
  }
};

// Creates the context object for User. Used by component to get the state and dispatch function of user
export const UserContext = createContext({
  state: initialState,
  dispatch: () => null,
});

// Create a provider for components to consume and subscribe to changes
export const UserContextProvider = ({ children }) => {
  // stores state and dispatch of user using the reducer and initialState
  const [state, dispatch] = useReducer(userReducer, initialState);

  // returns a provider used by component to access the state and dispatch function of user
  return <UserContext.Provider value={{ state, dispatch }}>{children}</UserContext.Provider>;
};
