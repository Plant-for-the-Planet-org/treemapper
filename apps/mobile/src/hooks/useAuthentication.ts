import { Credentials, useAuth0 } from 'react-native-auth0'
import { usePostHog } from 'posthog-react-native'
import { captureAnalyticsEvent, AnalyticsEvents } from 'src/utils/analytics'
import useInterventionManagement from './realm/useInterventionManagement'
import useProjectManagement from './realm/useProjectManagement'
import useManageScientificSpecies from './realm/useManageScientificSpecies'
import Bugsnag from '@bugsnag/expo'
import useLogManagement from './realm/useLogManagement'
import { deactivateCurrentDevice } from './useDeviceRegistration'


const useAuthentication = () => {
  const { authorize, getCredentials, clearSession, user, error } = useAuth0()
  const posthog = usePostHog()
  const { deleteAllSyncedIntervention } = useInterventionManagement()
  const { deleteAllProjects } = useProjectManagement()
  const { deleteAllUserSpecies } = useManageScientificSpecies()
  const { addNewLog } = useLogManagement()


  const getUserCredentials = async () => {
    const result = await getCredentials()
    return result
  }

  const logoutUser = () => {
    return new Promise((resolve, reject) => {
      // Tell the server this device is signing out before the session goes
      // away, otherwise the access token is gone and the call cannot be made.
      // Never rejects, so it cannot block the logout.
      deactivateCurrentDevice()
        .then(() => clearSession())
        // .then(() => clearCredentials())
        .then(async () => {
          await deleteAllSyncedIntervention()
          await deleteAllProjects()
          await deleteAllUserSpecies()
          addNewLog({
            logType: 'USER',
            message: 'User logout successfully.',
            logLevel: 'info',
            statusCode: '',
          })
          resolve("true")
        })
        .catch(error => {
          Bugsnag.notify(error);
          addNewLog({
            logType: 'USER',
            message: 'Error occurred while logging out user.',
            logLevel: 'error',
            statusCode: '',
            logStack: JSON.stringify(error)
          })
          reject(new Error(JSON.stringify(error)))
        })
    })
  }

  const authorizeUser = async (): Promise<{
    credentials: Credentials | null
    success: boolean
  }> => {
    try {
      const authCred = await authorize({
        scope: 'openid email profile offline_access',
        audience: 'urn:plant-for-the-planet',
      })
      if (!authCred) {
        throw new Error('No token found');
      }
      captureAnalyticsEvent(posthog, AnalyticsEvents.USER_ACTIVATED)
      addNewLog({
        logType: 'USER',
        message: 'User login token generated successfully.',
        logLevel: 'info',
        statusCode: '',
      })
      return {
        credentials: authCred,
        success: true,
      }
    } catch (error) {
      addNewLog({
        logType: 'USER',
        message: 'Error occurred generating login token.',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return {
        credentials: null,
        success: false,
      }
    }
  }


  // Token refresh now lives in src/api/sessionManager.ts (`refreshSession`), so
  // both the proactive expiry check and the reactive 401 handler share one
  // path. The standalone Auth0 client there reads the same native credential
  // store this hook writes to.

  return { getUserCredentials, logoutUser, authorizeUser, user, getCredentials, error }
}

export default useAuthentication
