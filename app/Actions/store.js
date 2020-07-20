import React, {createContext, useReducer} from 'react';
import {LocalInventoryActions} from '../Actions/Action';

const initialState = {inventoryID: undefined};
const store = createContext(initialState);
const {Provider} = store;

const StateProvider = ({children}) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case LocalInventoryActions.SET_INVENTORY_ID:
        const newState = state;
        newState.inventoryID = action.payload;
        return newState;
      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{state, dispatch}}>{children}</Provider>;
};

export {store, StateProvider};
