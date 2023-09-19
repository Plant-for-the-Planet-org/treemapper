import moment from 'moment';
import Config from 'react-native-config';

// checks if todays date is in between the min and max date range
// here the min of date range is 1 year from the passed date and
// max of date range is 1 year and 90 days of the passed date
export const getIsDateInRemeasurementRange = (date: Date | string) => {
  const minDate = moment(date).add(
    Number(Config.MINIMUM_REMEASUREMENT_PERIOD_IN_SECONDS),
    'seconds',
  );
  const maxDate = moment(date).add(
    Number(Config.MAXIMUM_REMEASUREMENT_PERIOD_IN_SECONDS),
    'seconds',
  );

  return moment().isBetween(minDate, maxDate, null, '[]');
};
