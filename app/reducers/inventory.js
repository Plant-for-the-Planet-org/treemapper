import React, { createContext, useReducer } from 'react';
import {
  ADD_INVENTORY,
  IS_UPLOADING,
  SET_INVENTORY_ID,
  UPDATE_PENDING_COUNT,
  UPDATE_UPLOAD_COUNT,
} from '../actions/Types';

// Creates the context object for Inventory. Used by component to get the state and dispatch function of inventory
export const InventoryContext = createContext();

// stores the initial properties of the inventory state
const initialState = {
  inventoryID: null,
  pendingCount: 0,
  isInventoryUploading: false,
  allInventory: [],
  uploadCount: 0,
  isUploading: false,
};

// Inventory reducer function which takes the state and action param
const inventoryReducer = (state = initialState, action) => {
  // used to switch between the action types
  switch (action.type) {
    // changes the inventory ID property of the state
    case SET_INVENTORY_ID:
      return {
        ...state,
        inventoryID: action.payload,
      };

    // adds new inventory to the allInventory array property of the state
    case ADD_INVENTORY:
      return {
        ...state,
        allInventory: [...state.allInventory, action.payload],
      };
    // changes the pending count depending of the type of value passed
    // if type is custom then uses the count passed in payload and replace the value
    // if decrement is passed then decrease the current value by 1 and vice versa if type is increment
    case UPDATE_PENDING_COUNT:
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
    // changes the upload count depending of the type of value passed
    // if type is custom then uses the count passed in payload and replace the value
    // if decrement is passed then decrease the current value by 1 and vice versa if type is increment
    case UPDATE_UPLOAD_COUNT:
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
    // changes the value of isUploading by replacing with payload data
    case IS_UPLOADING:
      return {
        ...state,
        isUploading: action.payload,
      };
    default:
      return state;
  }
};

// Create a provider for components to consume and subscribe to changes
export const InventoryContextProvider = ({ children }) => {
  // stores state and dispatch of inventory using the reducer and initialState
  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  // returns a provider used by component to access the state and dispatch function of inventory
  return (
    <InventoryContext.Provider value={{ state, dispatch }}>{children}</InventoryContext.Provider>
  );
};
