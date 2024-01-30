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

const isPlantForThePlanetEmail = (email: string) => {
  const domain = 'plant-for-the-planet.org';
  // Convert email to lowercase for case-insensitive comparison
  const lowerCaseEmail = email?.toLowerCase();

  // Check if the email ends with the specified domain
  const endsWithDomain = lowerCaseEmail?.endsWith(domain);

  // Check if the email contains "plant-for-the-planet" before the domain
  const containsPlantForThePlanet = lowerCaseEmail?.includes('plant-for-the-planet');

  return endsWithDomain && containsPlantForThePlanet;
};

export { ALPHABETS, bugsnag, isWithinLastMonths, isPlantForThePlanetEmail };
