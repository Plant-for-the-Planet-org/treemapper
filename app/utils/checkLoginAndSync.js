import {
  auth0Logout,
  getAllProjects,
  getNewAccessToken,
  getUserDetailsFromServer,
} from '../actions/user';
import { getUserDetails } from '../repositories/user';
import { checkAndAddUserSpecies } from '../utils/addUserSpecies';
import { bugsnag } from './';

export const checkLoginAndSync = async ({ sync, dispatch, userDispatch, connected, internet }) => {
  const dbUserDetails = await getUserDetails();
  if (dbUserDetails && dbUserDetails.accessToken && sync && internet && connected) {
    // uploadInventoryData(dispatch, userDispatch);
  } else if (dbUserDetails && dbUserDetails.refreshToken && internet && connected) {
    const newAccessToken = await getNewAccessToken(dbUserDetails.refreshToken);
    if (newAccessToken) {
      if (sync) {
        // uploadInventoryData(dispatch, userDispatch);
      } else {
        // fetches the user details from server by passing the accessToken which is used while requesting the API
        getUserDetailsFromServer(userDispatch)
          .then(() => getAllProjects())
          .catch((err) => bugsnag.notify(err));

        checkAndAddUserSpecies();
      }
    } else {
      auth0Logout();
    }
  }
};
