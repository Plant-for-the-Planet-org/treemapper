import Bugsnag from '@bugsnag/expo'
import BugSnagConfig from 'src/utils/bugsnag/bugsnag.config'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { OneSignal } from 'react-native-onesignal'

try {
  Bugsnag.start(BugSnagConfig)
  MapLibreGL.setAccessToken(null)
  OneSignal.initialize(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID)
} catch (error) {
  console.log('Error initializing app services:', error)
}