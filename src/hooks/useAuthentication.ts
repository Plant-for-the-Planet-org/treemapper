import { Credentials, useAuth0 } from 'react-native-auth0'
import useInterventionManagement from './realm/useInterventionManagement'
import useProjectMangement from './realm/useProjectMangement'

const useAuthentication = () => {
  const { authorize, getCredentials, clearSession, clearCredentials, user } = useAuth0()
  const { deleteAllSyncedIntervention } = useInterventionManagement()
  const { deleteAllProjects } = useProjectMangement()

  const getUserCredentials = async () => {
    const result = await getCredentials()
    return result
  }

  const logoutUser = () => {
    return new Promise((resolve, reject) => {
      clearSession()
        .then(() => clearCredentials())
        .then(async () => {
          await deleteAllSyncedIntervention()
          await deleteAllProjects()
          resolve(true)
        })
        .catch(error => {
          console.error('Error logging out user:', error)
          reject(false)
        })
    })
  }

  const authorizeUser = async (): Promise<{
    credentials: Credentials | null
    success: boolean
  }> => {
    try {
      const authCreds = await authorize({ audience: 'urn:plant-for-the-planet' })

      if (!authCreds) {
        throw 'No token found'
      }

      return {
        credentials: authCreds,
        success: true,
      }
    } catch (error) {
      return {
        credentials: null,
        success: false,
      }
    }
  }

  return { getUserCredentials, logoutUser, authorizeUser, user, getCredentials }
}

export default useAuthentication
