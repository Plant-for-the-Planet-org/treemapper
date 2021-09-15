import { getAllInventoryFromServer } from '../actions/inventory';
import { addInventoryToDB, getInventoryByStatus } from '../repositories/inventory';
import { SYNCED } from './inventoryConstants';

export const addInventoryFromServer = async (nextRouteLink = '') => {
  let allRegistrationsDetails: any;
  if (nextRouteLink) {
    allRegistrationsDetails = await getAllInventoryFromServer(`${nextRouteLink}&_scope=extended`);
  } else {
    allRegistrationsDetails = await getAllInventoryFromServer();
  }

  if (allRegistrationsDetails.data.length !== 0) {
    getInventoryByStatus([SYNCED])
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
          addInventoryFromServer(allRegistrationsDetails.nextRouteLink);
        }
      })
      .catch((err: any) => {});
  }
};
