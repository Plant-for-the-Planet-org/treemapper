import { useEffect, useRef } from 'react'
import * as Location from 'expo-location'
import { useDispatch } from 'react-redux';
import { updateAccuracy, updatePermissionStatus, updateUserLocation } from 'src/store/slice/gpsStateSlice';
import useLogManagement from './realm/useLogManagement';
import { AnalyticsEvents, trackEvent } from 'src/utils/analytics';

/**
 * Above this many metres a fix is too coarse to place a tree properly. Worth
 * knowing how often field workers are recording at this quality, because it
 * caps how much the resulting data is worth.
 */
const POOR_ACCURACY_METERS = 30;

const useLocationPermission = () => {
  const [status, requestForegroundPermissionsAsync] = Location.useForegroundPermissions();
  const hasRequestedPermission = useRef(false)

  const dispatch = useDispatch()
  const { addNewLog } = useLogManagement()

  useEffect(() => {
    // status is null while the initial native fetch is in progress — wait for it
    if (status === null) return

    if (status.status === Location.PermissionStatus.UNDETERMINED && !hasRequestedPermission.current) {
      hasRequestedPermission.current = true
      requestLocationPermission()
      return
    }

    if (status.status === Location.PermissionStatus.DENIED) {
      dispatch(updatePermissionStatus('denied'))
      // Without location the app cannot record a tree at all, so this is the
      // hardest stop in the funnel.
      trackEvent(AnalyticsEvents.GPS_PERMISSION_DENIED, { source: 'initial_check' })
      addNewLog({
        logType: 'LOCATION',
        message: "Location permission denied",
        logLevel: 'warn',
        statusCode: '',
      })
      return
    }

    if (status.status === Location.PermissionStatus.GRANTED) {
      dispatch(updatePermissionStatus('granted'))
      fetchAndDispatchLocation()
    }
  }, [status])

  // Re-check permission at call time instead of trusting the (possibly stale)
  // `status` closure. This is what the recenter button / auto-focus relies on,
  // so it must work on the very first grant without an app restart.
  const userCurrentLocation = async () => {
    let permission = await Location.getForegroundPermissionsAsync()
    if (permission.status === Location.PermissionStatus.UNDETERMINED) {
      permission = await requestForegroundPermissionsAsync()
    }
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      dispatch(updatePermissionStatus(permission.status === Location.PermissionStatus.DENIED ? 'denied' : 'undetermined'))
      // The user asked for their location (recenter, auto-focus) and was
      // refused. Tagged apart from the startup check because here they were
      // actively trying to do something.
      trackEvent(AnalyticsEvents.GPS_PERMISSION_DENIED, {
        source: 'user_requested',
        status: permission.status,
      })
      return
    }
    dispatch(updatePermissionStatus('granted'))
    await fetchAndDispatchLocation()
  }

  const fetchAndDispatchLocation = async () => {
    await getLastKnowLocation()
    const startedAt = Date.now()
    try {
      const userLocationDetails = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Highest
      })
      if (userLocationDetails?.coords?.longitude && userLocationDetails?.coords?.latitude) {
        dispatch(updateUserLocation([userLocationDetails.coords.longitude, userLocationDetails.coords.latitude]))
        const accuracy = userLocationDetails.coords.accuracy ?? 0
        dispatch(updateAccuracy(accuracy))
        // No coordinates are sent, only how good the fix was and how long it
        // took. Where a user is standing is their business; whether the app
        // can locate them is ours.
        if (accuracy > POOR_ACCURACY_METERS) {
          trackEvent(AnalyticsEvents.GPS_ACCURACY_POOR, {
            accuracy_meters: Math.round(accuracy),
            time_to_fix_ms: Date.now() - startedAt,
          })
        }
      } else {
        trackEvent(AnalyticsEvents.GPS_FIX_FAILED, {
          reason: 'no_coordinates_returned',
          time_to_fix_ms: Date.now() - startedAt,
        })
      }
    } catch (error) {
      // Location services off, or the fix timed out. Either way the user is
      // now stuck on a screen that needs a position.
      trackEvent(AnalyticsEvents.GPS_FIX_FAILED, {
        reason: 'position_request_threw',
        time_to_fix_ms: Date.now() - startedAt,
      })
      addNewLog({
        logType: 'LOCATION',
        message: "Current location fetch failed",
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
    }
  }

  const getLastKnowLocation = async () => {
    try {
      const lastLocation = await Location.getLastKnownPositionAsync()
      if (lastLocation?.coords) {
        dispatch(updateUserLocation([lastLocation.coords.longitude, lastLocation.coords.latitude]))
        dispatch(updateAccuracy(lastLocation.coords.accuracy ?? 0))
      }
    } catch (error) {
      addNewLog({
        logType: 'LOCATION',
        message: "Last Known location",
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
    }
  }

  const requestLocationPermission = async () => {
    try {
      const result = await requestForegroundPermissionsAsync()
      if (result?.status === Location.PermissionStatus.GRANTED) {
        dispatch(updatePermissionStatus('granted'))
        await fetchAndDispatchLocation()
      } else if (result?.status === Location.PermissionStatus.DENIED) {
        dispatch(updatePermissionStatus('denied'))
      }
    } catch (error) {
      addNewLog({
        logType: 'LOCATION',
        message: "Location Permission",
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
    }
  }


  return { userCurrentLocation }
}

export default useLocationPermission
