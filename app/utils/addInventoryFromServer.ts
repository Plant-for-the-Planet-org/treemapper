import { getAllInventoryFromServer, updateInventoryFetchFromServer } from '../actions/inventory';
import { inventoryFetchConstant } from '../reducers/inventory';
import { addInventoryToDB, getInventoryByStatus } from '../repositories/inventory';
import {
  DATA_UPLOAD_START,
  FIX_NEEDED,
  PENDING_DATA_UPDATE,
  PENDING_DATA_UPLOAD,
  PENDING_IMAGE_UPLOAD,
  PENDING_SAMPLE_TREES_UPLOAD,
  SYNCED,
} from './inventoryConstants';

export const addInventoryFromServer = async (nextRouteLink = '', dispatch: any) => {
  let allRegistrationsDetails: any;
  if (nextRouteLink) {
    allRegistrationsDetails = await getAllInventoryFromServer(`${nextRouteLink}&_scope=extended`);
  } else {
    allRegistrationsDetails = await getAllInventoryFromServer();
  }

  if (allRegistrationsDetails.data.length !== 0) {
    getInventoryByStatus([
      PENDING_DATA_UPLOAD,
      DATA_UPLOAD_START,
      PENDING_IMAGE_UPLOAD,
      PENDING_SAMPLE_TREES_UPLOAD,
      SYNCED,
      PENDING_DATA_UPDATE,
      FIX_NEEDED,
    ])
      .then((allRegistrations: any) => {
        if (allRegistrations.length === 0) {
          for (const registration of allRegistrationsDetails.data) {
            if (registration.captureStatus === 'complete') addInventoryToDB(registration);
          }
        } else {
          const notAddedRegistrations = allRegistrationsDetails.data.filter(
            ({ id: locationId1 }: any) =>
              !allRegistrations.some(
                ({ locationId: locationId2 }: any) => locationId2 === locationId1,
              ),
          );

          for (const registration of notAddedRegistrations) {
            if (registration.captureStatus === 'complete') addInventoryToDB(registration);
          }
        }

        if (allRegistrationsDetails.nextRouteLink) {
          addInventoryFromServer(allRegistrationsDetails.nextRouteLink, dispatch);
        } else {
          updateInventoryFetchFromServer(inventoryFetchConstant.COMPLETED)(dispatch);
        }
      })
      .catch((err: any) => {});
  } else {
    updateInventoryFetchFromServer(inventoryFetchConstant.COMPLETED)(dispatch);
  }
};
