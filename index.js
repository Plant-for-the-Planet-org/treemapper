import { AppRegistry } from 'react-native';
import App from './app/components/App';
import { name as appName } from './app.json';
import 'react-native-reanimated';
import 'react-native-gesture-handler';

AppRegistry.registerComponent(appName, () => App);
