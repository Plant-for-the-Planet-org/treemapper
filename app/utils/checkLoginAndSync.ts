import {updateInventoryFetchFromServer} from '../actions/inventory';
import {getAllProjects, getUserDetailsFromServer} from '../actions/user';
import {inventoryFetchConstant} from '../reducers/inventory';
import {getUserDetails} from '../repositories/user';
import {checkAndAddUserSpecies} from '../utils/addUserSpecies';
import {bugsnag} from './';
import {addInventoryFromServer, addNecessaryInventoryFromServer} from './addInventoryFromServer';
import {getRemeasurementDates} from './getRemeasuremDates';

export const checkLoginAndSync = async ({
  sync,
  dispatch,
  userDispatch,
  connected,
  internet,
}: any) => {
  const dbUserDetails = await getUserDetails();
  if (dbUserDetails && dbUserDetails.accessToken && internet && connected) {
    // fetches the user details from server by passing the accessToken which is used while requesting the API
    getUserDetailsFromServer(userDispatch)
      .then(() => {
        getAllProjects();

        checkAndAddUserSpecies().then(() => {
          updateInventoryFetchFromServer(inventoryFetchConstant.IN_PROGRESS)(dispatch);
          addInventoryFromServer('', dispatch);
          // addNecessaryInventoryFromServer('', dispatch);
          // getRemeasurementDates();
        });
      })
      .catch(err => bugsnag.notify(err));
  }
};
