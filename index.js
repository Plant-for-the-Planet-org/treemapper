import { AppRegistry } from 'react-native';
// import App from './app/index.js';
import { name as appName } from './app.json';
import { CreatePolygon } from './app/Components/';


AppRegistry.registerComponent(appName, () => CreatePolygon);
