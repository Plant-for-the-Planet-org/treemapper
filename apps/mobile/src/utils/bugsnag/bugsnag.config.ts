import { Config } from "@bugsnag/expo";
import * as Application from 'expo-application'


const BugSnagConfig: Config = {
    apiKey: process.env.EXPO_PUBLIC_BUGSNAG_API,
    appVersion: Application.nativeApplicationVersion,
    releaseStage: process.env.EXPO_PUBLIC_APP_ENV === "staging" ? 'development' : 'production',
    enabledReleaseStages: ['production']
}

export default BugSnagConfig
