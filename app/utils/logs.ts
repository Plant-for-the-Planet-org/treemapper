import AsyncStorage from '@react-native-community/async-storage';
import dbLog, { deleteOldLogs } from '../repositories/logs';
import { LogTypes } from './constants';
const MILLISECONDS_IN_FIVE_HOURS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

export const dailyLogUpdateCheck = async () => {
  const lastCheckedTime = await getLogCheckTime();

  if (!lastCheckedTime) {
    // First run, set the check time
    await setLogCheckTime(Date.now());
  } else {
    const currentTime = Date.now();
    const timeDifference = currentTime - lastCheckedTime;
    if (timeDifference >= MILLISECONDS_IN_FIVE_HOURS) {
      deleteOldLogs().then(() => setLogCheckTime(currentTime));
    }
  }
};

// Function to retrieve the last time logs were checked
const getLogCheckTime = async () => {
  try {
    const storedTime = await AsyncStorage.getItem('logCheckTime');
    return storedTime ? parseInt(storedTime) : null; // Convert stored string to number
  } catch (err) {
    dbLog.error({
      logType: LogTypes.OTHER,
      message: 'Error while getting log check time from AsyncStorage',
      logStack: JSON.stringify(err),
    });
    console.error(`Error at /utils/logs/getLogCheckTime, ${JSON.stringify(err)}`);
    return null;
  }
};

// Function to store the current timestamp as the last checked time
const setLogCheckTime = async (currentTime: number) => {
  try {
    await AsyncStorage.setItem('logCheckTime', `${currentTime}`);
  } catch (err) {
    dbLog.error({
      logType: LogTypes.OTHER,
      message: 'Error while setting log check time in AsyncStorage',
      logStack: JSON.stringify(err),
    });
    console.error(`Error at /utils/logs/setLogCheckTime, ${JSON.stringify(err)}`);
  }
};