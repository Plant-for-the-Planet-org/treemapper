import {Credentials, useAuth0} from 'react-native-auth0'

const useAuthentication = () => {
  const {authorize, getCredentials, clearSession, clearCredentials} =
    useAuth0()

  const getUserCredentials = async () => {
    const result = await getCredentials()
    return result
  }

  const logoutUser = () => {
    return new Promise((resolve, reject) => {
      clearSession({}, {customScheme: process.env.EXPO_PUBLIC_APP_SCHEMA})
        .then(() => clearCredentials())
        .then(() => {
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
      const authCreds = await authorize(
        {},
        {
          customScheme: process.env.EXPO_PUBLIC_APP_SCHEMA,
        },
      )

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

  return {getUserCredentials, logoutUser, authorizeUser}
}

export default useAuthentication
