import { auth0Logout, getNewAccessToken, getUserDetailsFromServer } from '../actions/user';
import { getUserDetails } from '../repositories/user';
import { checkAndAddUserSpecies } from '../utils/addUserSpecies';
import { uploadInventoryData } from '../utils/uploadInventory';

export const checkLoginAndSync = async (sync, dispatch, userDispatch) => {
  const dbUserDetails = await getUserDetails();
  console.log({ dbUserDetails });
  if (dbUserDetails && dbUserDetails.accessToken && sync) {
    console.log('uploading with accessToken');
    uploadInventoryData(dispatch, userDispatch);
  } else if (dbUserDetails && dbUserDetails.refreshToken) {
    const newAccessToken = await getNewAccessToken(dbUserDetails.refreshToken);
    if (newAccessToken) {
      if (sync) {
        console.log('uploading with refreshToken');
        uploadInventoryData(dispatch, userDispatch);
      } else {
        // fetches the user details from server by passing the accessToken which is used while requesting the API
        getUserDetailsFromServer(newAccessToken);
        checkAndAddUserSpecies();
      }
    } else {
      auth0Logout();
    }
  }
};
