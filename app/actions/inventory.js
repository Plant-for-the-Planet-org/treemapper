import { getAuthenticatedRequest } from '../utils/api';
import {
  DELETE_INVENTORY_ID,
  INITIATE_INVENTORY_STATE,
  IS_UPLOADING,
  SET_INVENTORY_ID,
  UPDATE_PENDING_COUNT,
  UPDATE_UPLOAD_COUNT,
  UPDATE_PROGRESS_COUNT,
} from './Types';
import { PENDING_DATA_UPLOAD } from '../utils/inventoryConstants';

/**
 * This function dispatches type SET_INVENTORY_ID with payload inventoryId to add in inventory state
 * It requires the following param
 * @param {string} inventoryId - inventory id which should be added/updated in inventory state
 */
export const setInventoryId = (inventoryId) => async (dispatch) => {
  await dispatch({
    type: SET_INVENTORY_ID,
    payload: inventoryId,
  });
};

/**
 * This function dispatches type DELETE_INVENTORY_ID and deletes inventory id in inventory state
 */
export const deleteInventoryId = () => (dispatch) => {
  dispatch({
    type: DELETE_INVENTORY_ID,
  });
};
/**
 * This function dispatches type INITIATE_INVENTORY_STATE with payload inventory data to add in inventory state
 * It requires the following param
 * @param {Object} inventoryData - inventory data which should be added in allInventory of inventory state
 */
export const initiateInventoryState = (inventoryData) => (dispatch) => {
  dispatch({
    type: INITIATE_INVENTORY_STATE,
    payload: inventoryData,
  });
};

/**
 * This function dispatches type UPDATE_PENDING_COUNT or UPDATE_UPLOAD_COUNT with payload count to update the
 * count in inventory state. The dispatch type depends on the count type. If type is PENDING_DATA_UPLOAD then
 * [UPDATE_PENDING_COUNT] type is dispatched else [UPDATE_UPLOAD_COUNT] is dispatched
 *
 * It requires the following param
 * @param {Object} data - data which includes type of count to update and count itself to update in inventory state
 */
export const updateCount = (data) => (dispatch) => {
  dispatch({
    type: data.type === PENDING_DATA_UPLOAD ? UPDATE_PENDING_COUNT : UPDATE_UPLOAD_COUNT,
    payload: data.count,
  });
};

/**
 * This function dispatches type  UPDATE_PROGRESS_COUNT with payload count to update the
 * count in inventory state. The dispatch type depends on the count type.
 *
 * It requires the following param
 * @param {Object} data - data which includes type of count to update and count itself to update in inventory state
 */
export const updateProgressCount = (data) => (dispatch) => {
  dispatch({
    type: UPDATE_PROGRESS_COUNT,
    payload: data.count,
  });
};

/**
 * This function dispatches type IS_UPLOADING with payload as boolean value to update in inventory state
 * It requires the following param
 * @param {boolean} isUploading - used to update the uploading status in inventory state
 */
export const updateIsUploading = (isUploading) => (dispatch) => {
  dispatch({
    type: IS_UPLOADING,
    payload: isUploading,
  });
};

export const getAllInventoryFromServer = () => {
  return new Promise((resolve, reject) => {
    getAuthenticatedRequest('/treemapper/plantLocations')
      .then((data) => {
        let exceptSampleTrees = data?.data?.items?.filter((inventory) => {
          return inventory.type !== 'sample';
        });
        let sampleTrees = data?.data?.items?.filter((inventory) => {
          return inventory.type === 'sample';
        });
        resolve([exceptSampleTrees, sampleTrees]);
      })
      .catch((err) => {
        console.log('Error:', err);
        reject(err);
      });
  });
};
