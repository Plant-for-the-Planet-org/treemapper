import React from 'react';
import {bugsnag} from '../utils';
import {LogTypes} from '../utils/constants';
import {EDITING, INCOMPLETE, PENDING_DATA_UPLOAD} from '../utils/inventoryConstants';
import {getSchema} from './default';
import dbLog from './logs';

interface IWriteOperationPlantLocationHistory {
  remeasurementId: string;
  data: any;
  successMessage: string;
  errorMessage: string;
}

const writeOperationPlantLocationHistory = ({
  remeasurementId,
  data,
  successMessage,
  errorMessage,
}: IWriteOperationPlantLocationHistory) => {
  return new Promise((resolve, _) => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          const plantLocationHistory = realm.objectForPrimaryKey(
            'PlantLocationHistory',
            `${remeasurementId}`,
          );
          if (plantLocationHistory) {
            const newPlantLocationHistory = {
              ...JSON.parse(JSON.stringify(plantLocationHistory)),
              ...data,
            };
            realm.create(
              'PlantLocationHistory',
              newPlantLocationHistory,
              Realm.UpdateMode.Modified,
            );
            // logging the success in to the db
            dbLog.info({
              logType: LogTypes.REMEASUREMENT,
              message: successMessage,
              referenceId: remeasurementId,
            });
          } else {
            // logging the success in to the db
            dbLog.error({
              logType: LogTypes.REMEASUREMENT,
              message: `Cannot find plant location history with id: ${remeasurementId}`,
              referenceId: remeasurementId,
            });
          }
          resolve(plantLocationHistory);
        });
      })
      .catch(err => {
        console.log(err);
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: errorMessage,
          logStack: JSON.stringify(err),
          referenceId: remeasurementId,
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

interface IAddPlantLocationHistory {
  inventoryId: string;
  samplePlantLocationIndex?: number | null;
  historyData: any;
}

export const addPlantLocationHistory = ({
  inventoryId,
  samplePlantLocationIndex = null,
  historyData,
}: IAddPlantLocationHistory) => {
  return new Promise((resolve, _) => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventoryId}`);
          if (inventory) {
            if (
              (samplePlantLocationIndex || samplePlantLocationIndex == 0) &&
              samplePlantLocationIndex > -1
            ) {
              inventory.sampleTrees[samplePlantLocationIndex].plantLocationHistory.push({
                ...historyData,
                samplePlantLocationIndex,
              });
            } else {
              inventory.plantLocationHistory.push(historyData);
            }
          }

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully added plant location history with inventory_id: ${inventoryId}${
              samplePlantLocationIndex || samplePlantLocationIndex === 0
                ? ` with samplePlantLocationIndex ${samplePlantLocationIndex}`
                : ''
            }`,
            referenceId: inventoryId,
          });
          resolve(true);
        });
      })
      .catch(err => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while adding plant location history with inventory_id: ${inventoryId}${
            samplePlantLocationIndex || samplePlantLocationIndex === 0
              ? ` with samplePlantLocationIndex ${samplePlantLocationIndex}`
              : ''
          }`,
          logStack: JSON.stringify(err),
          referenceId: inventoryId,
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

interface IAddImageToPlantLocationHistory {
  remeasurementId: string;
  imageUrl: string;
  lastScreen: string;
}

export const addImageToPlantLocationHistory = async ({
  remeasurementId,
  imageUrl,
  lastScreen,
}: IAddImageToPlantLocationHistory) => {
  return await writeOperationPlantLocationHistory({
    remeasurementId: remeasurementId,
    data: {
      imageUrl,
      lastScreen,
    },
    successMessage: `Successfully added image in plant location history with id: ${remeasurementId}`,
    errorMessage: `Error while adding image in plant location history with id: ${remeasurementId}`,
  });
};

interface IAddAdditionDataToPlantLocationHistory {
  remeasurementId: string;
  additionalData: object;
  lastScreen?: string;
}

export const addAdditionDataToPlantLocationHistory = async ({
  remeasurementId,
  additionalData,
  lastScreen,
}: IAddAdditionDataToPlantLocationHistory) => {
  console.log(additionalData, 'additionalData');

  return await writeOperationPlantLocationHistory({
    remeasurementId: remeasurementId,
    data: {
      additionalDetails: additionalData,
      lastScreen,
    },
    successMessage: `Successfully added additionalDetails in plant location history with id: ${remeasurementId}`,
    errorMessage: `Error while adding additionalDetails in plant location history with id: ${remeasurementId}`,
  });
};
interface IDeletePlantLocationHistory {
  remeasurementId: string;
  // dispatch: React.Dispatch;
}

export const deletePlantLocationHistory = ({
  remeasurementId,
}: // dispatch,
IDeletePlantLocationHistory) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then(realm => {
        let remeasurement = realm.objectForPrimaryKey('PlantLocationHistory', `${remeasurementId}`);
        const isPending = remeasurement.dataStatus === PENDING_DATA_UPLOAD;
        realm.write(() => {
          realm.delete(remeasurement);
          // setInventoryId('')(dispatch);
        });

        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.REMEASUREMENT,
          message: `Successfully deleted remeasurement with remeasurementId: ${remeasurementId}`,
        });

        // if (dispatch && isPending) {
        //   updateCount({ type: PENDING_DATA_UPLOAD, count: 'decrement' })(dispatch);
        // }
        resolve(true);
      })
      .catch(err => {
        console.log(err, 'Error');
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while deleting remeasurement with remeasurementId: ${remeasurementId}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        reject(err);
      });
  });
};

export const clearAllIncompletePlantLocationHistory = () => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          let incompleteRemeasurements = realm
            .objects('PlantLocationHistory')
            .filtered(`dataStatus == "${INCOMPLETE}" || dataStatus == "${EDITING}"`);

          realm.delete(incompleteRemeasurements);
        });

        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.REMEASUREMENT,
          message: `Successfully deleted incomplete and editing remeasurements`,
        });
        resolve(true);
      })
      .catch(err => {
        console.log(err, 'Error');
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while deleting incomplete and editing remeasurements`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        reject(err);
      });
  });
};
interface IUpdatePlantLocationHistory {
  remeasurementId: string;
  diameter?: number;
  height?: number;
}

export const updatePlantLocationHistory = async ({
  remeasurementId,
  diameter,
  height,
}: IUpdatePlantLocationHistory) => {
  const data: {
    diameter?: number;
    height?: number;
  } = {};
  if (diameter) {
    data.diameter = diameter;
  }
  if (height) {
    data.height = height;
  }
  return await writeOperationPlantLocationHistory({
    remeasurementId,
    data,
    successMessage: `Successfully updated diameter to ${diameter} and height to ${height} of plant location history with id: ${remeasurementId}`,
    errorMessage: `Error while updating  diameter to ${diameter} and height to ${height} of plant location history with id: ${remeasurementId}`,
  });
};

interface IUpdatePlantLocationHistoryEventDate {
  remeasurementId: string;
  eventDate: Date;
}

export const updatePlantLocationHistoryEventDate = async ({
  remeasurementId,
  eventDate,
}: IUpdatePlantLocationHistoryEventDate) => {
  return await writeOperationPlantLocationHistory({
    remeasurementId: remeasurementId,
    data: {
      eventDate,
    },
    successMessage: `Successfully updated eventDate to ${eventDate} of plant location history with id: ${remeasurementId}`,
    errorMessage: `Error while updating  eventDate to ${eventDate} of plant location history with id: ${remeasurementId}`,
  });
};

interface IUpdatePlantLocationHistoryStatus {
  remeasurementId: string;
  status: string;
}

export const updatePlantLocationHistoryStatus = async ({
  remeasurementId,
  status,
}: IUpdatePlantLocationHistoryStatus) => {
  return await writeOperationPlantLocationHistory({
    remeasurementId: remeasurementId,
    data: {
      dataStatus: status,
    },
    successMessage: `Successfully updated status to ${status} of plant location history with id: ${remeasurementId}`,
    errorMessage: `Error while updating  status to ${status} of plant location history with id: ${remeasurementId}`,
  });
};

interface IUpdatePlantLocationHistoryLastScreen {
  remeasurementId: string;
  lastScreen: string;
}

export const updatePlantLocationHistoryLastScreen = async ({
  remeasurementId,
  lastScreen,
}: IUpdatePlantLocationHistoryLastScreen) => {
  return await writeOperationPlantLocationHistory({
    remeasurementId: remeasurementId,
    data: {
      lastScreen: lastScreen,
    },
    successMessage: `Successfully updated lastScreen to ${lastScreen} of plant location history with id: ${remeasurementId}`,
    errorMessage: `Error while updating  lastScreen to ${lastScreen} of plant location history with id: ${remeasurementId}`,
  });
};

export const getPlantLocationHistoryById = (
  remeasurementId: string,
): Promise<Realm.Object | undefined> => {
  return new Promise((resolve, _) => {
    Realm.open(getSchema())
      .then(realm => {
        let plantLocationHistory = realm.objectForPrimaryKey(
          'PlantLocationHistory',
          `${remeasurementId}`,
        );
        if (plantLocationHistory) {
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.REMEASUREMENT,
            message: `Successfully retrieved plant location history with id: ${remeasurementId}`,
            referenceId: remeasurementId,
          });
        } else {
          // logging the success in to the db
          dbLog.error({
            logType: LogTypes.REMEASUREMENT,
            message: `Cannot find plant location history with id: ${remeasurementId}`,
            referenceId: remeasurementId,
          });
        }
        resolve(plantLocationHistory);
      })
      .catch(err => {
        console.log(err);
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while retrieving plant location history with id: ${remeasurementId}`,
          logStack: JSON.stringify(err),
          referenceId: remeasurementId,
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const getPlantLocationHistory = (status: string[] = []): Promise<any[]> => {
  return new Promise((resolve, _) => {
    Realm.open(getSchema())
      .then(realm => {
        let plantLocationHistory = realm
          .objects('PlantLocationHistory')
          .filtered('dataStatus != null');
        if (status.length !== 0) {
          var query = 'dataStatus == ';
          for (var i = 0; i < status.length; i++) {
            query += `'${status[i]}'`;
            if (i + 1 < status.length) {
              query += ' || dataStatus == ';
            }
          }
          plantLocationHistory = plantLocationHistory.filtered(query);
        }

        if (plantLocationHistory) {
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.REMEASUREMENT,
            message: `Successfully retrieved plant location history having ${
              status.length == 0 ? 'all' : status.join(', ')
            }`,
          });
        } else {
          // logging the success in to the db
          dbLog.error({
            logType: LogTypes.REMEASUREMENT,
            message: `Cannot find plant location history having ${
              status.length == 0 ? 'all' : status.join(', ')
            }`,
          });
        }
        resolve(plantLocationHistory || []);
      })
      .catch(err => {
        console.log(err);
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while retrieving plant location history${
            status ? ` with status: ${status}` : ''
          }`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve([]);
      });
  });
};
