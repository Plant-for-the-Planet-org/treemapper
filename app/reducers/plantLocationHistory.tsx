import React, { createContext, useEffect, useState } from 'react';
import 'react-native-get-random-values';
import { addPlantLocationEvent } from '../actions/inventory';
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

  const getPendingPlantLocationHistory = async () => {
    const plantLocationHistory = await getPlantLocationHistory([PENDING_DATA_UPLOAD]);
    console.log('plantLocationHistory reducer', plantLocationHistory);
    setPendingPlantLocationHistoryUpload(plantLocationHistory);
    setPendingPlantLocationHistoryUploadCount(plantLocationHistory.length);
  };

  const uploadRemeasurements = async () => {
    setIsUploading(true);
    // const plantLocationHistory = await getPlantLocationHistory([PENDING_DATA_UPLOAD]);
    // setPendingPlantLocationHistoryUpload(plantLocationHistory);
    console.log('pendingPlantLocationHistoryUpload', pendingPlantLocationHistoryUpload);
    for (const history of pendingPlantLocationHistoryUpload) {
      console.log('\n\nhistory', history);
      const isStatusUpdated = await updatePlantLocationHistoryStatus({
        remeasurementId: history.id,
        status: DATA_UPLOAD_START,
      });

      if (!isStatusUpdated) {
        dbLog.error({
          logType: LogTypes.REMEASUREMENT,
          message: `Error while updating plant location history status to ${DATA_UPLOAD_START} with id: ${history.id}`,
          referenceId: history.id,
        });
        continue;
      }
      const locationId = history.parentId;
      let data: IAddPlantLocationEventData = {
        type: history.status ? 'status' : 'measurement',
        eventDate: history.eventDate,
      };

      if (history.status) {
        data.status = history.status;
        data.statusReason = history.statusReason;
      } else {
        data.measurements = {
          height: history.height,
          width: history.diameter,
        };
      }

      try {
        const result = await addPlantLocationEvent(locationId, data);
        if (result) {
          await updatePlantLocationHistoryStatus({ remeasurementId: history.id, status: SYNCED });
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
