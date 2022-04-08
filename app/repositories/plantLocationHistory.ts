import { bugsnag } from '../utils';
import { LogTypes } from '../utils/constants';
import { getSchema } from './default';
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
            if (samplePlantLocationIndex && samplePlantLocationIndex > -1) {
              inventory.samplePlantLocations[samplePlantLocationIndex].plantLocationHistory.push({
                ...historyData,
                parentId: inventoryId,
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
}

export const addImageToPlantLocationHistory = async ({
  remeasurementId,
  imageUrl,
}: IAddImageToPlantLocationHistory) => {
  return await writeOperationPlantLocationHistory({
    remeasurementId: remeasurementId,
    data: {
      imageUrl,
    },
    successMessage: `Successfully added image in plant location history with id: ${remeasurementId}`,
    errorMessage: `Error while adding image in plant location history with id: ${remeasurementId}`,
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
            message: `Successfully retrieved plant location histor having ${
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
