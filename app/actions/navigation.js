import { SET_SHOW_MAIN_STACK, SET_SHOW_INITIAL_STACK } from './Types';

/**
 * This function is used to change the app's navigation stack to show Initial Loading Screens
 */
export const showInitialNavigationStack = () => (dispatch) => {
  dispatch({
    type: SET_SHOW_INITIAL_STACK,
  });
};

/**
 * This function is used to change the app's navigation stack to show App Main screens
 */
export const showMainNavigationStack = () => (dispatch) => {
  dispatch({
    type: SET_SHOW_MAIN_STACK,
  });
};
