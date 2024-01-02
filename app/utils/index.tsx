import moment from 'moment';
import { Client } from 'bugsnag-react-native';
import Config from 'react-native-config';

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const bugsnag = new Client(Config.BUGSNAP_CLIENT_KEY);

const isWithinLastMonths = (registrationDate: string, monthsCount: number): boolean => {
  const currentDate = moment();
  const regDate = moment(registrationDate, 'YYYY-MM-DD HH:mm:ss');
  const diffBool = currentDate.diff(regDate, 'months') <= monthsCount;
  return diffBool;
};

export { ALPHABETS, bugsnag, isWithinLastMonths };
