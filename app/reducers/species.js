import React, { createContext, useReducer } from 'react';
import { SET_SPECIE, CLEAR_SPECIE } from '../actions/Types';

// stores the initial properties of the species state
const initialState = {
  specie: null,
};

// Species reducer function which takes the state and action param
const speciesReducer = (state = initialState, action) => {
  // used to switch between the action types
  switch (action.type) {
    // updates the specie data
    case SET_SPECIE:
      return {
        ...state,
        specie: action.payload,
      };
    // clears the specie from the state
    case CLEAR_SPECIE:
      return {
        ...state,
        specie: null,
      };
    // returns the state as is if no type is found
    default:
      return state;
  }
};

// Creates the context object for Species. Used by component to get the state and dispatch function of species
export const SpeciesContext = createContext({
  state: initialState,
  dispatch: () => null,
});

// Create a provider for components to consume and subscribe to changes
export const SpeciesContextProvider = ({ children }) => {
  // stores state and dispatch of species using the reducer and initialState
  const [state, dispatch] = useReducer(speciesReducer, initialState);

  // returns a provider used by component to access the state and dispatch function of species
  return <SpeciesContext.Provider value={{ state, dispatch }}>{children}</SpeciesContext.Provider>;
};
