import moment from "moment";


export const timestampToBasicDate = (timestamp: number) => {
  return moment(timestamp).format('DD MMM YYYY');
}


export const convertDateToTimestamp = (d: Date) => {
  return new Date(d).getTime()
}