import { useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import { OneSignal } from 'react-native-onesignal'
import Bugsnag from '@bugsnag/expo'

interface StartupTask {
  name: string
  execute: () => Promise<void>
}

interface UseAppStartupResult {
  isInitialized: boolean
  fcmToken: string | null
  error: Error | null
}

const useAppStartup = (): UseAppStartupResult => {
  const isInitializedRef = useRef(false)
  const fcmTokenRef = useRef<string | null>(null)
  const errorRef = useRef<Error | null>(null)

  const initializeOneSignal = useCallback(async (): Promise<void> => {
    try {
      const permissionGranted = await OneSignal.Notifications.requestPermission(true)
      OneSignal.User.pushSubscription.addEventListener('change', (subscription) => {
        const newToken = subscription.current.id
        const optedIn = subscription.current.optedIn
        const pushToken = subscription.current.token
        console.log('[useAppStartup] Push subscription changed:', {
          id: newToken,
          optedIn,
          token: pushToken,
        })
        if (newToken) {
          fcmTokenRef.current = newToken
        }
      })

      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
        console.log('[useAppStartup] Notification received in foreground:', event.notification)
        event.getNotification().display()
      })

      OneSignal.Notifications.addEventListener('click', (event: any) => {
        console.log('[useAppStartup] Notification clicked:', event.notification)
      })

      const hasPermission = await OneSignal.Notifications.getPermissionAsync()
      const playerId = await OneSignal.User.pushSubscription.getIdAsync()
      const pushToken = await OneSignal.User.pushSubscription.getTokenAsync()
      const optedIn = await OneSignal.User.pushSubscription.getOptedInAsync()

      console.log('[useAppStartup] Status after permission request:', {
        hasPermission,
        optedIn,
        pushToken,
        playerId,
        platform: Platform.OS,
      })

      if (playerId) {
        fcmTokenRef.current = playerId
      }

    } catch (error) {
      console.error('[useAppStartup] OneSignal setup error:', error)
      Bugsnag.notify(error as Error)
      throw error
    }
  }, [])

  const runStartupTasks = useCallback(async (): Promise<void> => {
    if (isInitializedRef.current) {
      return
    }

    const tasks: StartupTask[] = [
      {
        name: 'OneSignal',
        execute: initializeOneSignal,
      },
      // Add more startup tasks here as needed
      // Example:
      // {
      //   name: 'Analytics',
      //   execute: initializeAnalytics,
      // },
    ]

    for (const task of tasks) {
      try {
        console.log(`[useAppStartup] Starting task: ${task.name}`)
        await task.execute()
        console.log(`[useAppStartup] Completed task: ${task.name}`)
      } catch (error) {
        console.error(`[useAppStartup] Task failed: ${task.name}`, error)
        errorRef.current = error as Error
        // Continue with other tasks even if one fails
        // The app should not crash due to startup task failures
      }
    }

    isInitializedRef.current = true
    console.log('[useAppStartup] All startup tasks completed')
  }, [initializeOneSignal])

  useEffect(() => {
    runStartupTasks()
  }, [runStartupTasks])

  return {
    isInitialized: isInitializedRef.current,
    fcmToken: fcmTokenRef.current,
    error: errorRef.current,
  }
}

export default useAppStartup
