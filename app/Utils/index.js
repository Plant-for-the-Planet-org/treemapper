import { Client } from 'bugsnag-react-native';

const APLHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const bugsnag = new Client("e1b5d94f16186f8c6a2169882998ebda");
bugsnag.notify(new Error("Test error"));


bugsnag.notify({ error: 'Custom error' });
export { APLHABETS, bugsnag };