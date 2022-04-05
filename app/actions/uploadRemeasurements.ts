import dbLog from '../repositories/logs';
import {
  getPlantLocationHistoryByStatus,
  updatePlantLocationHistoryStatus,
} from '../repositories/plantLocationHistory';
import { IAddPlantLocationEventData } from '../types/inventory';
import { LogTypes } from '../utils/constants';
import { PENDING_DATA_UPLOAD, SYNCED } from '../utils/inventoryConstants';
import { addPlantLocationEvent } from './inventory';

export const uploadRemeasurements = async () => {
  const plantLocationHistory = await getPlantLocationHistoryByStatus(PENDING_DATA_UPLOAD);
  console.log('plantLocationHistory', plantLocationHistory);
  for (const history of plantLocationHistory) {
    console.log('\n\nhistory', history);
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
};
