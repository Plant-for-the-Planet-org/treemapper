import React, { createContext, useEffect, useState } from 'react';
import 'react-native-get-random-values';
import { addPlantLocationEvent } from '../actions/inventory';
import { getInventoryByLocationId } from '../repositories/inventory';
import dbLog from '../repositories/logs';
import {
  getPlantLocationHistory,
  updatePlantLocationHistoryStatus,
} from '../repositories/plantLocationHistory';
import { IAddPlantLocationEventData } from '../types/inventory';
import { LogTypes } from '../utils/constants';
import { DATA_UPLOAD_START, PENDING_DATA_UPLOAD, SYNCED } from '../utils/inventoryConstants';

// Creates the context object for PlantLocationHistory. Used by component to get the state and functions
export const PlantLocationHistoryContext = createContext<any>({
  pendingPlantLocationHistoryUpload: [],
  getPendingPlantLocationHistory: () => {},
  uploadRemeasurements: () => {},
  pendingPlantLocationHistoryUploadCount: 0,
  isUploading: false,
});

// Create a provider for components to consume and subscribe to changes
export const PlantLocationHistoryContextProvider = ({ children }: { children: JSX.Element }) => {
  const [pendingPlantLocationHistoryUpload, setPendingPlantLocationHistoryUpload] = useState<any>(
    [],
  );
  const [pendingPlantLocationHistoryUploadCount, setPendingPlantLocationHistoryUploadCount] =
    useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    getPendingPlantLocationHistory();
  }, []);

  // Get the pending plant location history and update the same in the context state with its count
  const getPendingPlantLocationHistory = async () => {
    const plantLocationHistory = await getPlantLocationHistory([PENDING_DATA_UPLOAD]);
    setPendingPlantLocationHistoryUpload(plantLocationHistory);
    setPendingPlantLocationHistoryUploadCount(plantLocationHistory.length);
  };

  // handles uplaoding of remeasuremnts to the server
  const uploadRemeasurements = async () => {
    setIsUploading(true);

    for (const history of pendingPlantLocationHistoryUpload) {
      // fetches the latest copy of the plant location
      const inventory: any = await getInventoryByLocationId({
        locationId: history.parentId,
      });

      // checks if the plant location history is in [PENDING_DATA_UPLOAD] status
      // only then continues else skips
      if (!history) continue;

      if (history?.dataStatus !== PENDING_DATA_UPLOAD) continue;

      // updates the status of the plant location history to [DATA_UPLOAD_START]
      // helps to make sure that the plant location history is not uploaded multiple times
      const isStatusUpdated = await updatePlantLocationHistoryStatus({
        remeasurementId: history.id,
        status: DATA_UPLOAD_START,
      });

      // if the status is not updated then skips and logs the error
      if (!isStatusUpdated) {
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while updating plant location history status to ${DATA_UPLOAD_START} with id: ${history.id}`,
          referenceId: history.id,
        });
        continue;
      }

      // Sample Tree Location Id
      const locationId = inventory[0].sampleTrees[history.samplePlantLocationIndex].locationId;

      // prepares the data to be sent to the server
      let data: IAddPlantLocationEventData = {
        type: history.status ? 'status' : 'measurement',
        eventDate: history.eventDate,
      };

      // if status is present then sends the [status] and [statusReason]
      // else sends [height] and [width] in measurement
      if (history.status) {
        data.status = history.status;
        data.statusReason = history.statusReason;
      } else {
        data.measurements = {
          height: history.height,
          width: history.diameter,
        };
      }

      // tries to send the data to the server and logs the error if any
      try {
        const result = await addPlantLocationEvent(locationId, data);
        // if the upload is successful then updates the status of the plant location history to [SYNCED]
        if (result) {
          await updatePlantLocationHistoryStatus({
            remeasurementId: history.id,
            status: SYNCED,
          });
        }
      } catch (e) {
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while uploading plant location history with id: ${history.id}`,
          referenceId: history.id,
          logStack: JSON.stringify(e),
        });
      }
    }
    setIsUploading(false);
  };

  // returns a provider used by component to access the state and dispatch function of inventory
  return (
    <PlantLocationHistoryContext.Provider
      value={{
        pendingPlantLocationHistoryUpload,
        getPendingPlantLocationHistory,
        uploadRemeasurements,
        pendingPlantLocationHistoryUploadCount,
        isUploading,
      }}>
      {children}
    </PlantLocationHistoryContext.Provider>
  );
};
