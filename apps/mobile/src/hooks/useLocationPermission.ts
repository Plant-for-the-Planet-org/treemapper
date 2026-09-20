import { useCallback, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as Location from 'expo-location'
import { useDispatch } from 'react-redux'
import store from 'src/store'
import {
  updateAccuracyAuthorization,
  updatePermissionStatus,
  updateProviderStatus,
  updateServicesEnabled,
  updateUserFix,
} from 'src/store/slice/gpsStateSlice'
import { LocationAccuracyAuthorization } from 'src/types/interface/slice.interface'
import useLogManagement from './realm/useLogManagement'

// A receiver needs time to walk down from a network/cell fix (20-100 m) to a
// satellite fix (3-8 m). Until the stored fix is this old we keep the better of
// the two readings; past it we take whatever is newest, because by then the
// user has probably moved and a tight old fix is worse than a loose new one.
const FIX_STALE_MS = 20000

// GNSS accuracy legitimately fluctuates between consecutive fixes. Rejecting
// every slightly-worse reading would latch the store onto one lucky value and
// stop tracking the user, so allow this much regression when the fix is newer.
const ACCURACY_REGRESSION_TOLERANCE_M = 20

// getLastKnownPositionAsync is only a seed so the map has something to draw
// before the first live fix lands. Unbounded it will happily return a fix from
// another city recorded days ago, which is worse than showing nothing.
const LAST_KNOWN_MAX_AGE_MS = 30000
const LAST_KNOWN_MAX_ACCURACY_M = 100

// iOS exposes a navigation tier that fuses motion sensors with GNSS. It is the
// tier Apple Maps uses and it converges tighter than Highest. On Android both
// map onto PRIORITY_HIGH_ACCURACY, so Highest is already the ceiling there.
const TRACKING_ACCURACY = Platform.OS === 'ios'
  ? Location.LocationAccuracy.BestForNavigation
  : Location.LocationAccuracy.Highest

const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: TRACKING_ACCURACY,
  // Must stay 0. Any distance filter means a user standing still at a tree gets
  // no further updates, so the reading freezes at the first (worst) fix of the
  // session -- which is the single most common cause of "the GPS is wrong".
  distanceInterval: 0,
  timeInterval: 1000,
}

// One native watch shared by every mounted consumer. Each map screen mounts
// this hook (often more than one component per screen), and giving each its own
// watchPositionAsync subscription is what previously raced on mount and crashed
// Android. Refcount instead, and tear the watch down when the last one leaves.
let watchSubscription: Location.LocationSubscription | null = null
let watchStarting: Promise<void> | null = null
let watchRefCount = 0
let bestFix: { coords: number[]; accuracy: number; timestamp: number } | null = null

const readAccuracyAuthorization = (
  permission: Location.LocationPermissionResponse,
): LocationAccuracyAuthorization => {
  if (Platform.OS === 'ios') {
    if (permission.ios?.accuracy === 'reduced') return 'reduced'
    if (permission.ios?.accuracy === 'full') return 'full'
    return 'unknown'
  }
  if (permission.android?.accuracy === 'coarse') return 'reduced'
  if (permission.android?.accuracy === 'fine') return 'full'
  return 'unknown'
}

const isBetterFix = (next: Location.LocationObject): boolean => {
  if (!bestFix) return true
  const age = next.timestamp - bestFix.timestamp
  if (age > FIX_STALE_MS) return true
  if (age < 0) return false
  const nextAccuracy = next.coords.accuracy ?? Number.MAX_SAFE_INTEGER
  return nextAccuracy <= bestFix.accuracy + ACCURACY_REGRESSION_TOLERANCE_M
}

const commitFix = (location: Location.LocationObject | null) => {
  if (!location?.coords) return
  const { latitude, longitude, accuracy } = location.coords
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
  if (latitude === 0 && longitude === 0) return
  if (!isBetterFix(location)) return
  bestFix = {
    coords: [longitude, latitude],
    accuracy: accuracy ?? 0,
    timestamp: location.timestamp,
  }
  // Android reports when a fix came from a mock provider. Recorded rather than
  // rejected: a developer build legitimately mocks, but a field record built on
  // a mocked fix should be identifiable afterwards.
  store.dispatch(updateUserFix({ ...bestFix, mocked: location.mocked === true }))
}

const acquireWatch = async () => {
  watchRefCount += 1
  if (watchSubscription) return
  if (!watchStarting) {
    watchStarting = (async () => {
      const subscription = await Location.watchPositionAsync(WATCH_OPTIONS, commitFix)
      // Every consumer may have unmounted while the native call was in flight.
      if (watchRefCount === 0) {
        subscription.remove()
        return
      }
      watchSubscription = subscription
    })().finally(() => {
      watchStarting = null
    })
  }
  await watchStarting
}

const releaseWatch = () => {
  watchRefCount = Math.max(0, watchRefCount - 1)
  if (watchRefCount > 0) return
  watchSubscription?.remove()
  watchSubscription = null
  // Drop the convergence baseline so the next screen starts clean rather than
  // comparing new fixes against one recorded somewhere else.
  bestFix = null
}

interface Options {
  // Opt in to the shared live watch. Screens that capture or display the user's
  // position want this; transient sheets that only read the last value do not.
  track?: boolean
}

const useLocationPermission = (options: Options = {}) => {
  const { track = false } = options
  const [status, requestForegroundPermissionsAsync] = Location.useForegroundPermissions()
  const hasRequestedPermission = useRef(false)

  const dispatch = useDispatch()
  const { addNewLog } = useLogManagement()

  const logLocationError = useCallback((message: string, error: unknown) => {
    addNewLog({
      logType: 'LOCATION',
      message,
      logLevel: 'error',
      statusCode: '',
      logStack: JSON.stringify(error),
    })
  }, [addNewLog])

  // Lets the watch effect log without taking a dependency on the logger.
  const logLocationErrorRef = useRef(logLocationError)
  logLocationErrorRef.current = logLocationError

  // The device-level location toggle is independent of app permission: it can
  // be off while the permission reads as granted, and then every fix request
  // simply never resolves. getProviderStatusAsync additionally reports which
  // Android providers are switched on -- GPS for satellites, NETWORK for the
  // Wi-Fi and cell assist that makes a first fix arrive in seconds instead of
  // a minute. iOS exposes neither, so those flags stay at their defaults there.
  const refreshProviderStatus = useCallback(async (
    authorization: LocationAccuracyAuthorization,
  ) => {
    try {
      const status = await Location.getProviderStatusAsync()
      dispatch(updateServicesEnabled(status.locationServicesEnabled))
      if (Platform.OS === 'android') {
        dispatch(updateProviderStatus({
          gps: status.gpsAvailable ?? true,
          network: status.networkAvailable ?? true,
        }))
      }
      // One readable line per grant, so a field report can be checked against
      // what the device was actually doing rather than guessed at.
      addNewLog({
        logType: 'LOCATION',
        message: `GPS state: permission=${authorization}`
          + `, services=${status.locationServicesEnabled}`
          + (Platform.OS === 'android'
            ? `, gpsProvider=${status.gpsAvailable}, networkProvider=${status.networkAvailable}`
            : ''),
        logLevel: status.locationServicesEnabled && authorization === 'full' ? 'info' : 'warn',
        statusCode: '',
      })
      if (!status.locationServicesEnabled && Platform.OS === 'android') {
        // Shows Android's own "improve location accuracy" dialog, which turns
        // the network provider back on. Rejects when the user declines, which
        // is a choice rather than an error.
        await Location.enableNetworkProviderAsync().catch(() => null)
      }
      return status.locationServicesEnabled
    } catch (error) {
      logLocationError('Location provider status', error)
      return true
    }
  }, [dispatch, addNewLog, logLocationError])

  const seedFromLastKnown = useCallback(async () => {
    try {
      const lastLocation = await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
        requiredAccuracy: LAST_KNOWN_MAX_ACCURACY_M,
      })
      commitFix(lastLocation)
    } catch (error) {
      logLocationError('Last Known location', error)
    }
  }, [logLocationError])

  const fetchAndDispatchLocation = useCallback(async () => {
    await seedFromLastKnown()
    try {
      const fix = await Location.getCurrentPositionAsync({ accuracy: TRACKING_ACCURACY })
      commitFix(fix)
    } catch (error) {
      logLocationError('Current location', error)
    }
  }, [seedFromLastKnown, logLocationError])

  const applyGrantedPermission = useCallback(
    async (permission: Location.LocationPermissionResponse) => {
      dispatch(updatePermissionStatus('granted'))
      const authorization = readAccuracyAuthorization(permission)
      dispatch(updateAccuracyAuthorization(authorization))
      if (authorization === 'reduced') {
        // Nothing we pass to the location manager can lift this; only the user
        // can, in Settings. Record it so the UI can say so instead of showing a
        // kilometre-wide fix as though it were a GPS reading.
        addNewLog({
          logType: 'LOCATION',
          message: 'Approximate location granted, precise location is off',
          logLevel: 'warn',
          statusCode: '',
        })
      }
      await refreshProviderStatus(authorization)
      await fetchAndDispatchLocation()
    },
    [dispatch, addNewLog, refreshProviderStatus, fetchAndDispatchLocation],
  )

  const requestLocationPermission = useCallback(async () => {
    try {
      const result = await requestForegroundPermissionsAsync()
      if (result?.status === Location.PermissionStatus.GRANTED) {
        await applyGrantedPermission(result)
      } else if (result?.status === Location.PermissionStatus.DENIED) {
        dispatch(updatePermissionStatus('denied'))
      }
    } catch (error) {
      logLocationError('Location Permission', error)
    }
  }, [requestForegroundPermissionsAsync, applyGrantedPermission, dispatch, logLocationError])

  useEffect(() => {
    // status is null while the initial native fetch is in progress -- wait for it
    if (status === null) return

    if (status.status === Location.PermissionStatus.UNDETERMINED && !hasRequestedPermission.current) {
      hasRequestedPermission.current = true
      requestLocationPermission()
      return
    }

    if (status.status === Location.PermissionStatus.DENIED) {
      dispatch(updatePermissionStatus('denied'))
      addNewLog({
        logType: 'LOCATION',
        message: "Location permission denied",
        logLevel: 'warn',
        statusCode: '',
      })
      return
    }

    if (status.status === Location.PermissionStatus.GRANTED) {
      applyGrantedPermission(status)
    }
  }, [status])

  // Hold the shared watch for as long as this consumer is mounted and allowed.
  // Keyed only on those two facts: any other dependency here would tear the
  // native watch down and rebuild it on unrelated re-renders.
  useEffect(() => {
    if (!track) return
    if (status?.status !== Location.PermissionStatus.GRANTED) return
    // acquireWatch increments the refcount before it awaits, so this release
    // stays balanced even when the native call rejects.
    acquireWatch().catch(error => logLocationErrorRef.current('Location watch', error))
    return releaseWatch
  }, [track, status?.status])

  // Re-check permission at call time instead of trusting the (possibly stale)
  // `status` closure. This is what the recenter button / auto-focus relies on,
  // so it must work on the very first grant without an app restart.
  const userCurrentLocation = useCallback(async () => {
    let permission = await Location.getForegroundPermissionsAsync()
    if (permission.status === Location.PermissionStatus.UNDETERMINED) {
      permission = await requestForegroundPermissionsAsync()
    }
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      dispatch(updatePermissionStatus(permission.status === Location.PermissionStatus.DENIED ? 'denied' : 'undetermined'))
      return
    }
    // An explicit recenter should always move the map, so drop the convergence
    // baseline and take the fresh reading even if it is looser than the last.
    bestFix = null
    await applyGrantedPermission(permission)
  }, [requestForegroundPermissionsAsync, applyGrantedPermission, dispatch])

  return { userCurrentLocation }
}

export default useLocationPermission
