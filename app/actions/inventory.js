import { APIConfig } from './Config';
import { INITIATE_INVENTORY_STATE, SET_INVENTORY_ID } from './Types';

const { protocol, url } = APIConfig;

// concatenate protocol and url
const API_URL = `${protocol}://${url}`;

// action for the profile details of the user
export const getUserProfile = (data) => async (dispatch) => {
  try {
    // fetch the results from the get api /app/profile
    const result = await axios.get(`${API_URL}/app/profile`);

    if (result.status === 200) {
      return result;
    }
    return false;
  } catch (err) {
    console.error(`Error at: /actions/inventory/getUserProfile -> ${JSON.stringify}`);
    return false;
  }
};

export const initiateInventoryState = (inventoryData) => (dispatch) => {
  dispatch({
    type: INITIATE_INVENTORY_STATE,
    payload: inventoryData,
  });
  dispatch({
    type: SET_INVENTORY_ID,
    payload: inventoryData.inventory_id,
  });
};
