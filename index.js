import { AppRegistry } from 'react-native';
// import App from './app/index.js';
import { name as appName } from './app.json';
import { RegisterTree } from './app/Components/';


AppRegistry.registerComponent(appName, () => RegisterTree);
