import { AppRegistry } from 'react-native';
import App from './app/Components/App';
import { name as appName } from './app.json';
console.disableYellowBox = true;
import Test from './app/Components/CreatePolygon/Test'
AppRegistry.registerComponent(appName, () => App);
