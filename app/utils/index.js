import { Client } from 'bugsnag-react-native';
import Config from 'react-native-config';

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const bugsnag = new Client(Config.BUGSNAP_CLIENT_KEY);

export { ALPHABETS, bugsnag };
