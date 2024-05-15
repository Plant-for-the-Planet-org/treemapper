import Auth0, { Credentials, useAuth0 } from 'react-native-auth0'
import useInterventionManagement from './realm/useInterventionManagement'
import useProjectMangement from './realm/useProjectMangement'
import useManageScientificSpecies from './realm/useManageScientificSpecies'

const auth0 = new Auth0({ domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN, clientId: process.env.EXPO_PUBLIC_CLIENT_ID_AUTH0 });


const useAuthentication = () => {
  const { authorize, getCredentials, clearSession, clearCredentials, user } = useAuth0()
  const { deleteAllSyncedIntervention } = useInterventionManagement()
  const { deleteAllProjects } = useProjectMangement()
  const { deleteAllUserSpecies } = useManageScientificSpecies()

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
          await deleteAllUserSpecies()
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
      const authCreds = await authorize({
        scope: 'openid email profile offline_access',
        audience: 'urn:plant-for-the-planet',
      })
      console.log("authCreds", authCreds)
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


  const refreshUserToken = async (refreshToken: string) => {
    const result = await auth0.auth.refreshToken({ refreshToken })
    return result
  }




  return { getUserCredentials, logoutUser, authorizeUser, user, getCredentials, refreshUserToken}
}

export default useAuthentication
