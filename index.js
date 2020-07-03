import { AppRegistry } from 'react-native';
import App from './app/Components/App';
import { name as appName } from './app.json';
import Appp from './app/index'
console.disableYellowBox = true;
AppRegistry.registerComponent(appName, () => Appp);
