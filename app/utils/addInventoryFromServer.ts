import {
  getAllInventoryFromServer,
  getNecessaryInventoryFromServer,
  updateInventoryFetchFromServer,
} from '../actions/inventory';
import {getRemeasurementDatesFromServer} from '../actions/remeasurement';
import {inventoryFetchConstant} from '../reducers/inventory';
import {
  addInventoryToDB,
  getInventoryByStatus,
  addNecessaryInventoryToDB,
} from '../repositories/inventory';
import {getRemeasurementDates} from './getRemeasuremDates';
import {
  DATA_UPLOAD_START,
  FIX_NEEDED,
  PENDING_DATA_UPDATE,
  PENDING_DATA_UPLOAD,
  PENDING_IMAGE_UPLOAD,
  PENDING_SAMPLE_TREES_UPLOAD,
  SYNCED,
} from './inventoryConstants';
import {updateRemeasurementDataInInventory} from './updateRemeasurementDataInInventory';

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
            ({id: locationId1}: any) =>
              !allRegistrations.some(
                ({locationId: locationId2}: any) => locationId2 === locationId1,
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
      .catch((err: any) => {
        console.error(err);
      });
  } else {
    updateInventoryFetchFromServer(inventoryFetchConstant.COMPLETED)(dispatch);
  }
};

export const addNecessaryInventoryFromServer = async (nextRouteLink = '', dispatch: any) => {
  let necessaryRegistrationsFromServer: any;
  if (nextRouteLink) {
    necessaryRegistrationsFromServer = await getNecessaryInventoryFromServer(
      `${nextRouteLink}&filter=revision-pending&_scope=extended`,
    );
  } else {
    necessaryRegistrationsFromServer = await getNecessaryInventoryFromServer();
  }

  //Checks if there's any data from the server
  if (necessaryRegistrationsFromServer.data.length !== 0) {
    getInventoryByStatus([
      PENDING_DATA_UPLOAD,
      DATA_UPLOAD_START,
      PENDING_IMAGE_UPLOAD,
      PENDING_SAMPLE_TREES_UPLOAD,
      SYNCED,
      PENDING_DATA_UPDATE,
      FIX_NEEDED,
    ])
      .then((allLocalRegistrations: any) => {
        //Checks if the inventory from server is present in the local database or not
        const isLocalInventoryPresent = (serverLocationId: any) => {
          return allLocalRegistrations.some(
            ({locationId: localLocationId}: any) => serverLocationId == localLocationId,
          );
        };

        //Checks if there are any local inventories(plantLocations) present or not
        if (allLocalRegistrations.length === 0) {
          for (const ServerRegistration of necessaryRegistrationsFromServer.data) {
            if (ServerRegistration.captureStatus === 'complete')
              addNecessaryInventoryToDB(ServerRegistration);
          }
        } else {
          for (const ServerRegistration of necessaryRegistrationsFromServer.data) {
            const isInventoryPresentInDB = isLocalInventoryPresent(ServerRegistration.id);
            if (ServerRegistration.captureStatus === 'complete' && !isInventoryPresentInDB) {
              addNecessaryInventoryToDB(ServerRegistration);
            } else if (ServerRegistration.captureStatus === 'complete' && isInventoryPresentInDB) {
              updateRemeasurementDataInInventory(ServerRegistration);
            }
          }
        }

        if (necessaryRegistrationsFromServer.nextRouteLink) {
          addNecessaryInventoryFromServer(necessaryRegistrationsFromServer.nextRouteLink, dispatch);
        } else {
          updateInventoryFetchFromServer(inventoryFetchConstant.COMPLETED)(dispatch);
          // getRemeasurementDates();
        }
      })
      .catch((err: any) => {
        console.error(err);
      });
  } else {
    updateInventoryFetchFromServer(inventoryFetchConstant.COMPLETED)(dispatch);
  }
};
