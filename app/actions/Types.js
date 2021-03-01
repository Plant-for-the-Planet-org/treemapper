// used to set the inventory id of an inventory
export const SET_INVENTORY_ID = 'SET_INVENTORY_ID';

// used when the inventory is initiated
export const INITIATE_INVENTORY_STATE = 'INITIATE_INVENTORY_STATE';

// used to add a new inventory
export const ADD_INVENTORY = 'ADD_INVENTORY';

// used to update the value of pending count whenever a new registration is done or data of a tree is synced
export const UPDATE_PENDING_COUNT = 'UPDATE_PENDING_COUNT';

// used to update the value of upload count whenever the data of tree registration is synced
export const UPDATE_UPLOAD_COUNT = 'UPDATE_UPLOAD_COUNT';

// used to update the value of uploading in the state whenever the data sync to server starts or stops
export const IS_UPLOADING = 'IS_UPLOADING';

export const SET_LOADING = 'SET_LOADING';
export const SET_SIGNUP_LOADING = 'SET_SIGNUP_LOADING';

export const SET_SPECIES_LIST = 'SET_SPECIES_LIST';
export const SET_SPECIE_ID = 'SET_SPECIE_ID';

export const SET_MULTIPLE_TREES_SPECIES_LIST = 'SET_MULTIPLE_TREES_SPECIES_LIST';
export const ADD_MULTIPLE_TREE_SPECIE = 'ADD_MULTIPLE_TREE_SPECIE';

// used when user is successfully logged in into the app this type is used to add tokens and set user as logged in
export const SET_INITIAL_USER_STATE = 'SET_INITIAL_USER_STATE';

// Type to set user details in user state of app. Used when the app starts and when there is no user data available in DB.
export const SET_USER_DETAILS = 'SET_USER_DETAILS';

// Type to reset the user state to initialState. Used when user is logged out or no user data is present
export const CLEAR_USER_DETAILS = 'CLEAR_USER_DETAILS';

// Type to show the initial screens navigation stack
export const SET_SHOW_INITIAL_STACK = 'SET_SHOW_INITIAL_STACK';

// Type to show main screens navigation stack
export const SET_SHOW_MAIN_STACK = 'SET_SHOW_MAIN_STACK';
