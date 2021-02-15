import AsyncStorage from '@react-native-community/async-storage';
import { deleteOldLogs } from '../repositories/logs';

// This function checks everyday if there are any older logs stored in the db which needs to be deleted
export const dailyLogUpdateCheck = async () => {
  const currentDate = new Date().toLocaleDateString();
  const previousUpdatedLogDate = await getLogUpdateDate();

  if (!previousUpdatedLogDate) {
    setUpdatedLogDate(currentDate);
  } else if (previousUpdatedLogDate !== currentDate) {
    deleteOldLogs().then(() => setUpdatedLogDate(currentDate));
  }
};

//to retrieve the updatedLogDate from AsyncStorage
const getLogUpdateDate = async () => {
  try {
    const updatedLogDate = await AsyncStorage.getItem('updatedLogDate');

    return updatedLogDate;
  } catch (err) {
    // error reading value
    console.error(`Error at /utils/logs/getLogUpdateDate, ${JSON.stringify(err)}`);
    return false;
  }
};

//to set the updatedLogDate in the AsyncStorage
const setUpdatedLogDate = async (date) => {
  try {
    await AsyncStorage.setItem('updatedLogDate', `${date}`);
  } catch (err) {
    // error saving storing updateLogDate to AsyncStorage
    console.error(`Error at /utils/logs/setUpdatedLogDate, ${JSON.stringify(err)}`);
  }
};
