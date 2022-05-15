import React, { createContext, useReducer } from 'react';
import {
  SET_PROJECT,
  CLEAR_PROJECT,
  SET_PROJECT_SITE,
  CLEAR_PROJECT_SITE,
  CLEAR_PROJECT_AND_PROJECT_SITE,
} from '../actions/Types';

// stores the initial properties of the project state
const initialState = {
  selectedProject: null,
  selectedProjectSite: null,
};

// Project reducer function which takes the state and action param
const projectReducer = (state = initialState, action) => {
  // used to switch between the action types
  switch (action.type) {
    // updates the selected project
    case SET_PROJECT:
      return {
        ...state,
        selectedProject: action.payload,
      };
    // clears the selected project from the state
    case CLEAR_PROJECT:
      return {
        ...state,
        selectedProject: null,
      };
    // updates the selected project site data
    case SET_PROJECT_SITE:
      return {
        ...state,
        selectedProjectSite: action.payload,
      };
    // clears the selected project site from the state
    case CLEAR_PROJECT_SITE:
      return {
        ...state,
        selectedProjectSite: null,
      };

    case CLEAR_PROJECT_AND_PROJECT_SITE:
      return {
        ...state,
        selectedProject: null,
        selectedProjectSite: null,
      };
    // returns the state as is if no type is found
    default:
      return state;
  }
};

// Creates the context object for project. Used by component to get the state and dispatch function of project
export const ProjectContext = createContext({
  state: initialState,
  dispatch: () => null,
});

// Create a projectProvider for components to consume and subscribe to changes
export const ProjectContextProvider = ({ children }) => {
  // stores state and dispatch of project using the reducer and initialState
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // returns a provider used by component to access the state and dispatch function of project
  return <ProjectContext.Provider value={{ state, dispatch }}>{children}</ProjectContext.Provider>;
};
