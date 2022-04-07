// checks if todays date is in between the min and max date range
// here the min of date range is 1 year from the passed date and
// max of date range is 1 year and 90 days of the passed date
export const getIsDateInReameasurementRange = (date: Date | string) => {
  date = new Date(date);
  const minDate = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());
  const maxDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() + 90);
  const today = new Date();
  return today >= minDate && today <= maxDate;
};
