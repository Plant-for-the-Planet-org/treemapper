import { Credentials, useAuth0 } from 'react-native-auth0'
import { usePostHog } from 'posthog-react-native'
import { captureAnalyticsEvent, AnalyticsEvents } from 'src/utils/analytics'
import useInterventionManagement from './realm/useInterventionManagement'
import useProjectManagement from './realm/useProjectManagement'
import useManageScientificSpecies from './realm/useManageScientificSpecies'
import Bugsnag from '@bugsnag/expo'
import useLogManagement from './realm/useLogManagement'


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
      clearSession()
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


  const refreshUserToken = async (refreshToken: string) => {
    try {
      const result = await getCredentials(refreshToken)
      addNewLog({
        logType: 'USER',
        message: 'Refresh token generated successfully.',
        logLevel: 'info',
        statusCode: '',
      })
      return result
    } catch (error) {
      addNewLog({
        logType: 'USER',
        message: 'Error occurred generating refresh token.',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return null
    }
  }




  return { getUserCredentials, logoutUser, authorizeUser, user, getCredentials, refreshUserToken, error }
}

export default useAuthentication
