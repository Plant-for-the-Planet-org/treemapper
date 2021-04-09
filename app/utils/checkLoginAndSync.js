import { auth0Logout, getNewAccessToken, getUserDetailsFromServer } from '../actions/user';
import { getUserDetails } from '../repositories/user';
import { checkAndAddUserSpecies } from '../utils/addUserSpecies';
import { bugsnag } from './';
import { addInventoryFromServer } from './addInventoryFromServer';

export const checkLoginAndSync = async ({ sync, dispatch, userDispatch, connected, internet }) => {
  const dbUserDetails = await getUserDetails();
  // console.log(dbUserDetails, 'dbUserDetails');
  if (dbUserDetails && dbUserDetails.accessToken && sync && internet && connected) {
    // uploadInventoryData(dispatch, userDispatch);
  } else if (dbUserDetails && dbUserDetails.refreshToken && internet && connected) {
    const newAccessToken = await getNewAccessToken(dbUserDetails.refreshToken);
    if (newAccessToken) {
      if (sync) {
        // uploadInventoryData(dispatch, userDispatch);
      } else {
        // fetches the user details from server by passing the accessToken which is used while requesting the API
        getUserDetailsFromServer(userDispatch).catch((err) => bugsnag.notify(err));
        checkAndAddUserSpecies().then(() => {
          console.log('adding inventory from server');
          addInventoryFromServer();
        });
      }
    } else {
      auth0Logout();
    }
  }
};
