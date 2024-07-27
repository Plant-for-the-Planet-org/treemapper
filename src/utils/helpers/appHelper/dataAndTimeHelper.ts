import moment from "moment";
import { INTERVENTION_FILTER } from "src/types/type/app.type";


export const timestampToBasicDate = (timestamp: number) => {
  return moment(timestamp).format('DD MMM YYYY');
}


export const filterToTime = (i: INTERVENTION_FILTER) => {
  const continueDate = () => {
    return i === 'days' ? 1 : 12
  }

  const currentDate = new Date();
  if (i === 'months' || i === 'days' || i === 'year') {
    const sub = i === 'months' ? 6 : continueDate()
    const oneMonthAgo = new Date(currentDate);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - sub);
    const timestampOneMonthAgo = oneMonthAgo.getTime();
    return timestampOneMonthAgo;
  }
  if (i === 'always') {
    return 0
      ;
  }
  return 0
}

export const convertDateToTimestamp = (d: Date) => {
  return new Date(d).getTime()
}

export const activityLogTime = (timestamp: number) => {
  return moment(timestamp).format('DD MMM, hh:mm A');
}

export const formatRelativeTimeCustom = (timestamp: number) => {
  const now = moment();
  const inputTime = moment(timestamp);
  const duration = moment.duration(now.diff(inputTime));

  const days = Math.floor(duration.asDays());
  const hours = Math.floor(duration.asHours());
  const minutes = Math.floor(duration.asMinutes());

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}hr ago`;
  } else if (minutes > 0) {
    return `${minutes}min ago`;
  } else {
    return 'just now';
  }
}


export const displayYearDate = (t: number) => {
  return moment(t).format('MMMM D, YYYY');
}