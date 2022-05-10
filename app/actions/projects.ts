import {
  CLEAR_PROJECT,
  CLEAR_PROJECT_AND_PROJECT_SITE,
  CLEAR_PROJECT_SITE,
  SET_PROJECT,
  SET_PROJECT_SITE,
} from './Types';

export const setProject = project => dispatch => {
  dispatch({
    type: SET_PROJECT,
    payload: project,
  });
};

export const setProjectSite = projectSite => dispatch => {
  dispatch({
    type: SET_PROJECT_SITE,
    payload: projectSite,
  });
};

export const clearProject = () => dispatch => {
  dispatch({
    type: CLEAR_PROJECT,
  });
};
export const clearProjectSite = () => dispatch => {
  dispatch({
    type: CLEAR_PROJECT_SITE,
  });
};
export const clearProjectAndProjectSite = () => dispatch => {
  dispatch({
    type: CLEAR_PROJECT_AND_PROJECT_SITE,
  });
};
