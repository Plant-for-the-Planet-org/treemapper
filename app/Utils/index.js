import {Client} from 'bugsnag-react-native';
import {BUGSNAP_CLIENT_KEY} from 'react-native-dotenv';

const APLHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const bugsnag = new Client(BUGSNAP_CLIENT_KEY);

export {APLHABETS, bugsnag};
