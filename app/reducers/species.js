import React, { createContext, useReducer } from 'react';
import {
  SET_SPECIES_LIST,
  SET_SPECIE_ID,
  SET_MULTIPLE_TREES_SPECIES_LIST,
  ADD_MULTIPLE_TREE_SPECIE,
} from '../actions/Types';

// stores the initial properties of the species state
const initialState = {
  species: [],
  specieId: null,
  multipleTreesSpecies: [],
};

// Species reducer function which takes the state and action param
const speciesReducer = (state = initialState, action) => {
  // used to switch between the action types
  switch (action.type) {
    // updates the species data
    case SET_SPECIES_LIST:
      return {
        ...state,
        species: action.payload,
      };
    // updates the specie ID
    case SET_SPECIE_ID:
      return {
        ...state,
        specieId: action.payload,
      };
    // updates the species list for multiple trees registration
    case SET_MULTIPLE_TREES_SPECIES_LIST:
      return {
        ...state,
        multipleTreesSpecies: action.payload,
      };
    // adds new specie in multipleTreesSpecies for multiple trees registration
    case ADD_MULTIPLE_TREE_SPECIE:
      return {
        ...state,
        multipleTreesSpecies: [...state.multipleTreesSpecies, action.payload],
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
