import { bugsnag } from '../utils';
import { LogLevels } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';
import { LogTypes } from '../utils/constants';
import { getSchema } from './default';
import Realm from 'realm';

/**
 * This function is used to store the logs in realm DB in ActivityLogs Schema.
 * It writes to realm while creating a log
 * @param {LogLevels} logLevel - use to identify the level of log
 * @param {object} param1 - required properties which is to be stored in db
 * @returns {boolean} - returns a promise with boolean value on whether the operation was successful or not.
 */
const logToDB = (logLevel, { referenceId, logType, message, statusCode, logStack }) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
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
          // checks if statusCode is present then adds it to logData
          if (statusCode) {
            logData = {
              ...logData,
              statusCode: statusCode.toString(),
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
        console.error(`Error while creating log, ${JSON.stringify(err)}`);
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

// defines different types of log levels in object dbLog
const dbLog = {
  info: (data) => logToDB(LogLevels.INFO, data),
  warn: (data) => logToDB(LogLevels.WARN, data),
  error: (data) => logToDB(LogLevels.ERROR, data),
};

/**
 * This function is used to retrieve all logs or error logs from database, depending upon the parameter
 * @param {string} type
 * @returns {Array} allLogs/errorLogs
 */
export const getLogs = (type) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        if (type === 'all') {
          let logs = realm.objects('ActivityLogs');
          let allLogs = logs.filtered('TRUEPREDICATE SORT (timestamp DESC)');
          resolve(allLogs);
        } else if (type === 'error') {
          const allLogs = realm.objects('ActivityLogs');
          let errorLogs = allLogs.filtered('logLevel = "ERROR"');
          resolve(errorLogs);
        }
      })
      .catch((err) => {
        console.error(`Error while fetching logs of type ${type}, ${JSON.stringify(err)}`);
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

//Deleting older logs
export const deleteOldLogs = () => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let logs = realm.objects('ActivityLogs');
          const currentDate = new Date();
          // number of days to before the log should be deleted
          const numberOfDays = 14;

          // calculates the old date using the number of days
          let oldDate = currentDate - 1000 * 60 * 60 * 24 * numberOfDays;

          oldDate = new Date(oldDate);

          // sets the date hours, mins, seconds and nanoseconds to zero
          oldDate.setUTCHours(0, 0, 0, 0);

          // converts to ISO string and removes the Z characters from last
          oldDate = oldDate.toISOString().slice(0, -1);

          // filters and stores all the logs before 14 days
          let deleteLogs = logs.filtered(`timestamp < ${oldDate}`);

          // deletes the filtered logs from DB
          realm.delete(deleteLogs);
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.OTHER,
            message: 'Deleted older logs',
          });
          resolve();
        });
      })
      .catch((err) => {
        // logs the error
        console.error(`Error at repositories/logs/deleteOldLogs, ${err}`);
        bugsnag.notify(err);
        // logs the error of the failed request in DB
        dbLog.error({
          logType: LogTypes.ERROR,
          message: 'Failed to delete older logs',
        });
        reject(err);
      });
  });
};

// export to access the logging object
export default dbLog;
