import React, { createContext, useReducer } from 'react';
import {
  LocalInventoryActions,
  LoaderActions,
  SignUpLoader,
  SpeciesListAction,
  SpecieIdFromServer,
  UploadAction,
  UploadCompleteAction,
} from '../Actions/Action';

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
      case LocalInventoryActions.SET_INVENTORY_ID:
        const newState = state;
        newState.inventoryID = action.payload;
        return newState;
      case LoaderActions.SET_LOADING:
        return {
          ...state,
          isLoading: action.payload,
        };
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
      case UploadAction.SET_UPLOAD_PROGRESS:
        return {
          ...state,
          progress: action.payload.progress,
          isUploading: action.payload.isUploading,
        };
      case UploadCompleteAction.SET_UPLOAD_COMPLETE:
        return {
          ...state,
          isUploading: action.payload,
        };
      case LocalInventoryActions.ADD_INVENTORY:
        return {
          ...state,
          allInventory: [...state.allInventory, action.payload],
        };
      case LocalInventoryActions.UPDATE_PENDING_COUNT:
        return {
          ...state,
          pendingCount:
            action.payload.type === 'custom'
              ? action.payload.count
              : action.payload.type === 'decrement'
              ? state.pendingCount === 0
                ? state.pendingCount
                : state.pendingCount - 1
              : state.pendingCount + 1,
        };
      case LocalInventoryActions.UPDATE_UPLOAD_COUNT:
        return {
          ...state,
          uploadCount:
            action.payload.type === 'custom'
              ? action.payload.count
              : action.payload.type === 'decrement'
              ? state.uploadCount === 0
                ? state.uploadCount
                : state.uploadCount - 1
              : state.uploadCount + 1,
        };
      case LocalInventoryActions.IS_UPLOADING:
        return {
          ...state,
          isUploading: action.payload,
        };
      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider };
