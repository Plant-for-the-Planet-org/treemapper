import Bugsnag from '@bugsnag/expo'
import BugSnagConfig from 'src/utils/bugsnag/bugsnag.config'
import { OneSignal } from 'react-native-onesignal'

try {
  // Bugsnag.start(BugSnagConfig)
  OneSignal.initialize(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID)
} catch (error) {
  console.error('Error initializing app services:', error)
}