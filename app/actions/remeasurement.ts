import dbLog from '../repositories/logs';
import {getAuthenticatedRequest} from '../utils/api';
import {LogTypes} from '../utils/constants';

export const getRemeasurementDatesFromServer = async (projectId, index): Promise<any> => {
  try {
    let data: any = await getAuthenticatedRequest(`/app/plantLocations/${projectId}`);

    dbLog.info({
      logType: LogTypes.DATA_SYNC,
      message: 'Successfully fetched all Inventories From server',
    });
    if (index == 1) {
      //   console.log(JSON.stringify(data), data.length, 'data');
    }
    return true;
  } catch (err) {
    dbLog.error({
      logType: LogTypes.DATA_SYNC,
      message: 'Failed fetch Inventories From server',
      statusCode: err?.response?.status,
      logStack: JSON.stringify(err?.response),
    });
    return {data: [], nextRouteLink: null};
  }
};
