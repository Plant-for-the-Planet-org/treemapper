import React, { createContext, useReducer } from 'react';
import { SignUpLoader, SpeciesListAction, SpecieIdFromServer } from './Action';

const initialState = {
  inventoryID: undefined,
  pendingCount: 0,
  isInventoryUploading: false,
  allInventory: [],
  uploadCount: 0,
};
const store = createContext(initialState);
const { Provider } = store;

const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case SignUpLoader.SET_SIGNUP_LOADER:
        return {
          ...state,
          isSignUpLoader: action.payload,
        };
      case SpeciesListAction.SET_SPECIES_LIST:
        return {
          ...state,
          species: action.payload,
        };
      case SpecieIdFromServer.SET_SPECIES_ID:
        return {
          ...state,
          specieId: action.payload,
        };
      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider };
