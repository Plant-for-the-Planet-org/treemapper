import React, { createContext, useEffect, useState } from 'react';
import 'react-native-get-random-values';
import { addPlantLocationEvent } from '../actions/inventory';
import dbLog from '../repositories/logs';
import {
  getPlantLocationHistory,
  getPlantLocationHistoryById,
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
      // fetches the latest copy of the plant location history
      const plantHistory: any = await getPlantLocationHistoryById(history.id);

      // checks if the plant location history is in [PENDING_DATA_UPLOAD] status
      // only then continues else skips
      if (!plantHistory) continue;

      if (plantHistory?.dataStatus !== PENDING_DATA_UPLOAD) continue;

      // updates the status of the plant location history to [DATA_UPLOAD_START]
      // helps to make sure that the plant location history is not uploaded multiple times
      const isStatusUpdated = await updatePlantLocationHistoryStatus({
        remeasurementId: plantHistory.id,
        status: DATA_UPLOAD_START,
      });

      // if the status is not updated then skips and logs the error
      if (!isStatusUpdated) {
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while updating plant location history status to ${DATA_UPLOAD_START} with id: ${plantHistory.id}`,
          referenceId: plantHistory.id,
        });
        continue;
      }
      const locationId = plantHistory.parentId;

      // prepares the data to be sent to the server
      let data: IAddPlantLocationEventData = {
        type: plantHistory.status ? 'status' : 'measurement',
        eventDate: plantHistory.eventDate,
      };

      // if status is present then sends the [status] and [statusReason]
      // else sends [height] and [width] in measurement
      if (plantHistory.status) {
        data.status = plantHistory.status;
        data.statusReason = plantHistory.statusReason;
      } else {
        data.measurements = {
          height: plantHistory.height,
          width: plantHistory.diameter,
        };
      }

      // tries to send the data to the server and logs the error if any
      try {
        const result = await addPlantLocationEvent(locationId, data);
        // if the upload is successful then updates the status of the plant location history to [SYNCED]
        if (result) {
          await updatePlantLocationHistoryStatus({
            remeasurementId: plantHistory.id,
            status: SYNCED,
          });
        }
      } catch (e) {
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while uploading plant location history with id: ${plantHistory.id}`,
          referenceId: plantHistory.id,
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
