import { Client } from 'bugsnag-react-native';
import Config from "react-native-config";

const APLHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const bugsnag = new Client(Config.BUGSNAP_CLIENT_KEY);

export { APLHABETS, bugsnag };
