import {
  setFetchGivenMonthsInventoryFlag,
  updateLastGivenMonthInventoryFetchFromServer,
} from './../actions/inventory';
import { updateInventoryFetchFromServer } from '../actions/inventory';
import { getAllProjects, getUserDetailsFromServer, setUserDetails } from '../actions/user';
import { inventoryFetchConstant } from '../reducers/inventory';
import { getUserDetails } from '../repositories/user';
import { checkAndAddUserSpecies } from '../utils/addUserSpecies';
import { bugsnag } from './';
import {
  addInventoryFromServer,
  addLastGivenMonthsInventoryFromServer,
  addNecessaryInventoryFromServer,
} from './addInventoryFromServer';
import { getRemeasurementDates } from './getRemeasuremDates';

export const checkLoginAndSync = async ({
  sync,
  inventoryState,
  dispatch,
  userDispatch,
  connected,
  internet,
}: any) => {
  const dbUserDetails = await getUserDetails();
  if (dbUserDetails && dbUserDetails.accessToken && internet && connected) {
    const stringifiedUserDetails = JSON.parse(JSON.stringify(dbUserDetails));
    setUserDetails(stringifiedUserDetails)(userDispatch);
    // fetches the user details from server by passing the accessToken which is used while requesting the API
    getUserDetailsFromServer(userDispatch)
      .then(() => {
        getAllProjects();
        checkAndAddUserSpecies().then(() => {
          if (inventoryState.fetchNecessaryInventoryFlag !== null) {
            updateInventoryFetchFromServer(inventoryFetchConstant.IN_PROGRESS)(dispatch);
            inventoryState.fetchNecessaryInventoryFlag
              ? addNecessaryInventoryFromServer('', dispatch) // necessary inventories are those who needs remeasurements
              : addInventoryFromServer('', dispatch);
          }
          if (inventoryState.fetchGivenMonthsInventoryFlag) {
            updateLastGivenMonthInventoryFetchFromServer(inventoryFetchConstant.IN_PROGRESS)(
              dispatch,
            );
            addLastGivenMonthsInventoryFromServer(
              '',
              dispatch,
              inventoryState.fetchGivenMonthsInventoryFlag,
            );
          }
          // addNecessaryInventoryFromServer('', dispatch);
          // getRemeasurementDates();
        });
      })
      .catch(err => bugsnag.notify(err));
  }
};
