import { getAllProjects, getUserDetailsFromServer } from '../actions/user';
import { getUserDetails } from '../repositories/user';
import { checkAndAddUserSpecies } from '../utils/addUserSpecies';
import { bugsnag } from './';
import { addInventoryFromServer } from './addInventoryFromServer';

export const checkLoginAndSync = async ({ sync, dispatch, userDispatch, connected, internet }) => {
  const dbUserDetails = await getUserDetails();
  if (dbUserDetails && dbUserDetails.accessToken && internet && connected) {
    // fetches the user details from server by passing the accessToken which is used while requesting the API
    getUserDetailsFromServer(userDispatch)
      .then(() => {
        getAllProjects();

        checkAndAddUserSpecies().then(() => {
          addInventoryFromServer();
        });
      })
      .catch((err) => bugsnag.notify(err));
  }

  // ! Need to check this code with @Tejas

  // if (dbUserDetails && dbUserDetails.accessToken && sync && internet && connected) {
  //   // uploadInventoryData(dispatch, userDispatch);
  // } else if (dbUserDetails && internet && connected) {
  //     if (sync) {
  //       // uploadInventoryData(dispatch, userDispatch);
  //     } else {
  //       // fetches the user details from server by passing the accessToken which is used while requesting the API
  //       getUserDetailsFromServer(userDispatch).catch((err) => bugsnag.notify(err));
  //       checkAndAddUserSpecies();
  //     }
  // }
};
