import Realm from 'realm';
import { Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies, ActivityLogs, ScientificSpecies } from './schema';
import { bugsnag } from '../utils';
import { LogLevels } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * This function is used to store the logs in realm DB in ActivityLogs Schema.
 * It writes to realm while creating a log
 * @param {LogLevels} logLevel - use to identify the level of log
 * @param {object} param1 - required properties which is to be stored in db
 * @returns {boolean} - returns a promise with boolean value on whether the operation was successful or not.
 */
const logToDB = (
  logLevel,
  { referenceId, logType, message, errorCode, logStack },
) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
        ActivityLogs
      ],
    })
      .then((realm) => {
        realm.write(() => {
          // defines and stores the log data which is to be added in DB
          let logData = {
            // uses uuid v4 to create a unique id i.e. primary key
            id: uuidv4(),
            logType,
            logLevel,
            timestamp: new Date(),
            message,
            appVersion: 'TM v1.0.0',
          };
          // checks if referenceId is present then adds it to logData
          if (referenceId) {
            logData = {
              ...logData,
              referenceId,
            };
          }
          // checks if errorCode is present then adds it to logData
          if (errorCode) {
            logData = {
              ...logData,
              errorCode,
            };
          }
          // checks if logStack is present then adds it to logData
          if (logStack) {
            logData = {
              ...logData,
              logStack,
            };
          }
          // create log in ActivityLogs using logData which is passed
          realm.create('ActivityLogs', logData);
        });
        resolve(true);
      })
      .catch((err) => {
        console.err(`Error while creating log, ${JSON.stringify(err)}`);
        bugsnag.notify(err);
        reject(false);
      });
  });
};

// defines different types of log levels in object dbLog
const dbLog = {
  info: (data) => logToDB(LogLevels.INFO, data),
  warn: (data) => logToDB(LogLevels.WARN, data),
  error: (data) => logToDB(LogLevels.ERROR, data),
};

// Reading log data from the database
export const getLogs = (type) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
        ActivityLogs
      ],
    })
    .then((realm) => {
      realm.write(() => {
        if (type === 'all'){
          let logs = realm.objects ('ActivityLogs');
          let allLogs = logs.filtered( 'TRUEPREDICATE SORT (timestamp DESC)');
          resolve( allLogs );
          // console.log(allLogs, 'allLogs');
        } 
        else if (type === 'error') {
          const allLogs = realm.objects ('ActivityLogs');
          let errorLogs = allLogs.filtered ('logLevel = "ERROR"');
          resolve( errorLogs );
          // console.log(errorLogs, 'errorLogs');
          }
        });
      });
  });
};

// export to access the logging object
export default dbLog ;
