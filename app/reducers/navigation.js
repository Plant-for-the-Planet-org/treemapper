import React, { createContext, useReducer } from 'react';
import { SET_SHOW_MAIN_STACK, SET_SHOW_INITIAL_STACK } from '../actions/Types';

// stores the initial properties of the navigation state
const initialState = {
  showInitialStack: true,
};

// Navigation reducer function which takes the state and action param
const navigationReducer = (state = initialState, action) => {
  // used to switch between the action types
  switch (action.type) {
    // updates the [showInitialStack] state to [false]
    case SET_SHOW_MAIN_STACK:
      return {
        ...state,
        showInitialStack: false,
      };
    // updates the [showInitialStack] state to [true]
    case SET_SHOW_INITIAL_STACK:
      return {
        ...state,
        showInitialStack: true,
      };
    // changes the pending
    default:
      return state;
  }
};

// Creates the context object for Navigation. Used by component to get the state and dispatch function of loading
export const NavigationContext = createContext({
  state: initialState,
  dispatch: () => null,
});

// Create a provider for components to consume and subscribe to changes
export const NavigationContextProvider = ({ children }) => {
  // stores state and dispatch of loading using the reducer and initialState
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  // returns a provider used by component to access the state and dispatch function of loading
  return (
    <NavigationContext.Provider value={{ state, dispatch }}>{children}</NavigationContext.Provider>
  );
};
