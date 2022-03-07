import { bugsnag } from '../utils';
import { LogTypes } from '../utils/constants';
import { getSchema } from './default';
import dbLog from './logs';

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
              inventory.samplePlantLocations[samplePlantLocationIndex].plantLocationHistory.push(
                historyData,
              );
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

export const addImageToPlantLocationHistory = ({
  remeasurementId,
  imageUrl,
}: IAddImageToPlantLocationHistory) => {
  return new Promise((resolve, _) => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          console.log('remeasurementId repo', remeasurementId);
          let plantLocationHistory = realm.objectForPrimaryKey(
            'PlantLocationHistory',
            `${remeasurementId}`,
          );
          if (plantLocationHistory) {
            console.log('plantLocationHistory', plantLocationHistory);
            plantLocationHistory.imageUrl = imageUrl;

            console.log('remeasurementId was added with image', remeasurementId);
            // logging the success in to the db
            dbLog.info({
              logType: LogTypes.REMEASUREMENT,
              message: `Successfully added image in plant location history with id: ${remeasurementId}`,
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
          resolve(true);
        });
      })
      .catch(err => {
        console.log(err);
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while adding image in plant location history with id: ${remeasurementId}`,
          logStack: JSON.stringify(err),
          referenceId: remeasurementId,
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

interface IUpdatePlantLocationHistory {
  remeasurementId: string;
  diameter?: number;
  height?: number;
}

export const updatePlantLocationHistory = ({
  remeasurementId,
  diameter,
  height,
}: IUpdatePlantLocationHistory) => {
  return new Promise((resolve, _) => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          console.log('remeasurementId repo', remeasurementId);
          let plantLocationHistory = realm.objectForPrimaryKey(
            'PlantLocationHistory',
            `${remeasurementId}`,
          );
          if (plantLocationHistory) {
            console.log('plantLocationHistory', plantLocationHistory);
            if (diameter) {
              plantLocationHistory.diameter = diameter;
            }
            if (height) {
              plantLocationHistory.height = height;
            }

            console.log('remeasurementId was added with image', remeasurementId);
            // logging the success in to the db
            dbLog.info({
              logType: LogTypes.REMEASUREMENT,
              message: `Successfully updated diameter to ${diameter} and height to ${height} of plant location history with id: ${remeasurementId}`,
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
          resolve(true);
        });
      })
      .catch(err => {
        console.log(err);
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while updating  diameter to ${diameter} and height to ${height} of plant location history with id: ${remeasurementId}`,
          logStack: JSON.stringify(err),
          referenceId: remeasurementId,
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const getPlantLocationHistory = (remeasurementId: string) => {
  return new Promise((resolve, _) => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          console.log('remeasurementId repo', remeasurementId);
          let plantLocationHistory = realm.objectForPrimaryKey(
            'PlantLocationHistory',
            `${remeasurementId}`,
          );
          if (plantLocationHistory) {
            console.log('remeasurementId was added with image', remeasurementId);
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
        });
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
