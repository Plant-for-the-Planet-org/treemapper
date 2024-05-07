import moment from "moment";
import { INTERVENTION_FILTER } from "src/types/type/app.type";


export const timestampToBasicDate = (timestamp: number) => {
  return moment(timestamp).format('DD MMM YYYY');
}



export const filterToTime = (i: INTERVENTION_FILTER) => {
  const currentDate = new Date();
  if (i === 'months' || i === 'days' || i === 'year') {
    const sub = i ==='months'?6:i==='days'?1:12
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