import { Credentials, useAuth0 } from 'react-native-auth0'
import { useCallback, useEffect, useState } from 'react'
import useInterventionManagement from './realm/useInterventionManagement'
import useProjectManagement from './realm/useProjectManagement'
import useManageScientificSpecies from './realm/useManageScientificSpecies'
import Bugsnag from '@bugsnag/expo'
import useLogManagement from './realm/useLogManagement'

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  loginAttempts: number
}

const MAX_LOGIN_ATTEMPTS = 3
const RETRY_DELAY = 1000

const useAuthentication = () => {
  const { authorize, getCredentials, clearSession, clearCredentials, user, error } = useAuth0()
  const { deleteAllSyncedIntervention } = useInterventionManagement()
  const { deleteAllProjects } = useProjectManagement()
  const { deleteAllUserSpecies } = useManageScientificSpecies()
  const { addNewLog } = useLogManagement()

  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    isAuthenticated: false,
    loginAttempts: 0
  })

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = useCallback(async () => {
    try {
      const credentials = await getCredentials()
      setAuthState(prev => ({ 
        ...prev, 
        isAuthenticated: !!credentials?.accessToken 
      }))
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isAuthenticated: false 
      }))
    }
  }, [getCredentials])

  const getUserCredentials = useCallback(async () => {
    try {
      return await getCredentials()
    } catch (error) {
      addNewLog({
        logType: 'USER',
        message: 'Error getting user credentials.',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return null
    }
  }, [getCredentials, addNewLog])

  const clearAuthState = useCallback(async () => {
    try {
      // Clear Auth0 session and credentials
      await clearSession()
      await clearCredentials()
      
      // Clear app data
      await Promise.all([
        deleteAllSyncedIntervention(),
        deleteAllProjects(),
        deleteAllUserSpecies()
      ])
      
      setAuthState(prev => ({ 
        ...prev, 
        isAuthenticated: false,
        loginAttempts: 0
      }))
    } catch (error) {
      console.warn('Error clearing auth state:', error)
    }
  }, [clearSession, clearCredentials, deleteAllSyncedIntervention, deleteAllProjects, deleteAllUserSpecies])

  const logoutUser = useCallback(async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      await clearAuthState()
      
      addNewLog({
        logType: 'USER',
        message: 'User logout successfully.',
        logLevel: 'info',
        statusCode: '',
      })
      
      return true
    } catch (error) {
      Bugsnag.notify(error)
      addNewLog({
        logType: 'USER',
        message: 'Error occurred while logging out user.',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [clearAuthState, addNewLog])

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const authorizeUser = useCallback(async (): Promise<{
    credentials: Credentials | null
    success: boolean
    needsRetry?: boolean
  }> => {
    if (authState.isLoading) {
      return { credentials: null, success: false }
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))

      // Clear any existing session before attempting login
      // This addresses the Samsung browser cache issue
      try {
        await clearSession()
        await clearCredentials()
      } catch (clearError) {
        console.warn('Error clearing session before login:', clearError)
      }

      // Small delay to ensure session is cleared
      await sleep(500)

      const authCred = await authorize({
        scope: 'openid email profile offline_access',
        audience: 'urn:plant-for-the-planet',
        // Force fresh login to bypass cache issues
        additionalParameters: {
          prompt: 'login',
          max_age: '0'
        }
      })

      if (!authCred?.accessToken) {
        throw new Error('No access token received')
      }

      setAuthState(prev => ({ 
        ...prev, 
        isAuthenticated: true,
        loginAttempts: 0
      }))

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
      const attempts = authState.loginAttempts + 1
      setAuthState(prev => ({ 
        ...prev, 
        loginAttempts: attempts,
        isAuthenticated: false
      }))

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const shouldRetry = attempts < MAX_LOGIN_ATTEMPTS && 
                         (errorMessage.includes('user_cancelled') === false)

      addNewLog({
        logType: 'USER',
        message: `Error occurred generating login token. Attempt ${attempts}/${MAX_LOGIN_ATTEMPTS}`,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })

      // If it's a Samsung-specific issue, try clearing everything
      if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        try {
          await clearAuthState()
        } catch (clearError) {
          console.warn('Error in emergency clear:', clearError)
        }
      }

      return {
        credentials: null,
        success: false,
        needsRetry: shouldRetry
      }
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [authorize, clearSession, clearCredentials, authState.isLoading, authState.loginAttempts, addNewLog, clearAuthState])

  const authorizeUserWithRetry = useCallback(async (): Promise<{
    credentials: Credentials | null
    success: boolean
  }> => {
    let lastResult = { credentials: null, success: false }

    for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAY * attempt) // Exponential backoff
      }

      lastResult = await authorizeUser()
      
      if (lastResult.success) {
        return lastResult
      }

      // Don't retry if user cancelled
      if (error?.message?.includes('user_cancelled')) {
        break
      }
    }

    return lastResult
  }, [authorizeUser, error])

  const refreshUserToken = useCallback(async (refreshToken?: string) => {
    try {
      const result = await getCredentials(refreshToken)
      
      if (result?.accessToken) {
        setAuthState(prev => ({ 
          ...prev, 
          isAuthenticated: true 
        }))
      }

      addNewLog({
        logType: 'USER',
        message: 'Refresh token generated successfully.',
        logLevel: 'info',
        statusCode: '',
      })

      return result
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isAuthenticated: false 
      }))

      addNewLog({
        logType: 'USER',
        message: 'Error occurred generating refresh token.',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })

      return null
    }
  }, [getCredentials, addNewLog])

  const forceLogout = useCallback(async () => {
    try {
      await clearAuthState()
      addNewLog({
        logType: 'USER',
        message: 'Force logout completed.',
        logLevel: 'info',
        statusCode: '',
      })
    } catch (error) {
      console.error('Force logout error:', error)
    }
  }, [clearAuthState, addNewLog])

  return { 
    getUserCredentials, 
    logoutUser, 
    authorizeUser: authorizeUserWithRetry, // Use retry version by default
    authorizeUserSingle: authorizeUser, // Single attempt version
    user, 
    refreshUserToken, 
    error,
    forceLogout,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    loginAttempts: authState.loginAttempts
  }
}

export default useAuthentication