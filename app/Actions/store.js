import React, { createContext, useReducer } from 'react';

const initialState = { inventoryID: undefined };
const store = createContext(initialState);
const { Provider } = store;

const StateProvider = ({ children }) => {
    const [state, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'SET_INVENTORY_ID':
                const newState = state;
                newState.inventoryID = action.inventoryID;
                 return newState;
            default:
                throw new Error();
        };
    }, initialState);

    return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider }

