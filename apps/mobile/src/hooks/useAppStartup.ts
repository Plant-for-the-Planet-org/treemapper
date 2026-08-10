import { useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import { OneSignal } from 'react-native-onesignal'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Bugsnag from '@bugsnag/expo'

// Set once we have shown the OS notification prompt, so we never ask again.
const NOTIFICATION_ASKED_KEY = 'notification-permission-asked'

interface StartupTask {
  name: string
  execute: () => Promise<void>
}

// Ask for notification permission at most once. If permission is already
// granted, or we have asked before, do nothing. We pass fallbackToSettings
// = false so a previous denial never force-opens the OS Settings app.
const requestNotificationPermissionOnce = async (): Promise<void> => {
  try {
    const hasPermission = await OneSignal.Notifications.getPermissionAsync()
    if (hasPermission) {
      return
    }
    const alreadyAsked = await AsyncStorage.getItem(NOTIFICATION_ASKED_KEY)
    if (alreadyAsked) {
      return
    }
    await OneSignal.Notifications.requestPermission(false)
    await AsyncStorage.setItem(NOTIFICATION_ASKED_KEY, 'true')
  } catch (error) {
    Bugsnag.notify(error as Error)
  }
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
      await requestNotificationPermissionOnce()
      OneSignal.User.pushSubscription.addEventListener('change', (subscription) => {
        const newToken = subscription.current.id
        const optedIn = subscription.current.optedIn
        const pushToken = subscription.current.token
        if (newToken) {
          fcmTokenRef.current = newToken
        }
      })

      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
        event.getNotification().display()
      })

      OneSignal.Notifications.addEventListener('click', (event: any) => {
      })

      const hasPermission = await OneSignal.Notifications.getPermissionAsync()
      const playerId = await OneSignal.User.pushSubscription.getIdAsync()
      const pushToken = await OneSignal.User.pushSubscription.getTokenAsync()
      const optedIn = await OneSignal.User.pushSubscription.getOptedInAsync()


      if (playerId) {
        fcmTokenRef.current = playerId
      }

    } catch (error) {
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
        await task.execute()
      } catch (error) {
        errorRef.current = error as Error
        // Continue with other tasks even if one fails
        // The app should not crash due to startup task failures
      }
    }

    isInitializedRef.current = true
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
