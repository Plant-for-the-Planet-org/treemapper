import { getAuthenticatedRequest } from '../utils/api';
import {
  DELETE_INVENTORY_ID,
  INITIATE_INVENTORY_STATE,
  IS_UPLOADING,
  SET_INVENTORY_ID,
  UPDATE_PENDING_COUNT,
  UPDATE_UPLOAD_COUNT,
  UPDATE_PROGRESS_COUNT,
  SET_SKIP_TO_INVENTORY_OVERVIEW,
  SET_IS_EXTRA_SAMPLE_TREE,
  INVENTORY_FETCH_FROM_SERVER
} from './Types';
import { PENDING_DATA_UPLOAD } from '../utils/inventoryConstants';
import { LogTypes } from '../utils/constants';
import dbLog from '../repositories/logs';
import React from 'react';

/**
 * This function dispatches type SET_INVENTORY_ID with payload inventoryId to add in inventory state
 * It requires the following param
 * @param {string} inventoryId - inventory id which should be added/updated in inventory state
 */
export const setInventoryId = (inventoryId: string) => (dispatch: React.Dispatch<any>) => {
  dispatch({
    type: SET_INVENTORY_ID,
    payload: inventoryId,
  });
};

/**
 * This function dispatches type DELETE_INVENTORY_ID and deletes inventory id in inventory state
 */
export const deleteInventoryId = () => (dispatch: React.Dispatch<any>) => {
  dispatch({
    type: DELETE_INVENTORY_ID,
  });
};
/**
 * This function dispatches type INITIATE_INVENTORY_STATE with payload inventory data to add in inventory state
 * It requires the following param
 * @param {Object} inventoryData - inventory data which should be added in allInventory of inventory state
 */
export const initiateInventoryState = (inventoryData: any) => (dispatch: React.Dispatch<any>) => {
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
export const updateCount = (data: any) => (dispatch: React.Dispatch<any>) => {
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
export const updateProgressCount = (data: any) => (dispatch: React.Dispatch<any>) => {
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
export const updateIsUploading = (isUploading: boolean) => (dispatch: React.Dispatch<any>) => {
  dispatch({
    type: IS_UPLOADING,
    payload: isUploading,
  });
};

/**
 * This function dispatches type SET_SKIP_TO_INVENTORY_OVERVIEW with payload as boolean value to update in inventory state
 * It requires the following param
 * @param {boolean} skipToInventoryOverview - used to update the skipToInventoryOverview in inventory state
 */
export const setSkipToInventoryOverview = (skipToInventoryOverview: boolean) => (
  dispatch: React.Dispatch<any>,
) => {
  dispatch({
    type: SET_SKIP_TO_INVENTORY_OVERVIEW,
    payload: skipToInventoryOverview,
  });
};

/**
 * This function dispatches type SET_IS_EXTRA_SAMPLE_TREE with payload as boolean value to update in inventory state
 * It requires the following param
 * @param {boolean} isAnotherSampleTree - used to update the isAnotherSampleTree in inventory state
 */
export const setIsExtraSampleTree = (isExtraSampleTree: boolean) => (
  dispatch: React.Dispatch<any>,
) => {
  dispatch({
    type: SET_IS_EXTRA_SAMPLE_TREE,
    payload: isExtraSampleTree,
  });
};

/**
 * This function dispatches type INVENTORY_FETCH_FROM_SERVER with payload as boolean value to update in inventory state
 * It requires the following param
 * @param {string} fetchStatus - used to update the inventoryFetchProgress in inventory state
 */
export const updateInventoryFetchFromServer = (fetchStatus: string) => (
  dispatch: React.Dispatch<any>,
) => {
  dispatch({
    type: INVENTORY_FETCH_FROM_SERVER,
    payload: fetchStatus,
  });
};

export const getAllInventoryFromServer = async (
  requestRoute = '/treemapper/plantLocations?limit=4&_scope=extended',
): Promise<any> => {
  try {
    let data: any = await getAuthenticatedRequest(requestRoute, { 'x-accept-versions': '1.0.3' });

    dbLog.info({
      logType: LogTypes.DATA_SYNC,
      message: 'Successfully fetched all Inventories From server',
    });

    if (data.data._links.next) {
      return { data: data?.data?.items ?? [], nextRouteLink: data.data._links.next };
    } else {
      return { data: data?.data?.items ?? [], nextRouteLink: null };
    }
  } catch (err) {
    dbLog.error({
      logType: LogTypes.DATA_SYNC,
      message: 'Failed fetch Inventories From server',
      statusCode: err?.response?.status,
      logStack: JSON.stringify(err?.response),
    });
    return { data: [], nextRouteLink: null };
  }
};
