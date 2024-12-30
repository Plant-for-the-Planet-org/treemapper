import { useEffect } from 'react'
import * as Location from 'expo-location'
import { useDispatch } from 'react-redux';
import { updateAccuracy, updateUserLocation } from 'src/store/slice/gpsStateSlice';
import useLogManagement from './realm/useLogManagement';

const useLocationPermission = () => {
  const [status, requestForegroundPermissionsAsync] = Location.useForegroundPermissions();

  const dispatch = useDispatch()
  const { addNewLog } = useLogManagement()


  useEffect(() => {
    if (status && status.status === Location.PermissionStatus.DENIED) {
      addNewLog({
        logType: 'LOCATION',
        message: "Location permission denied",
        logLevel: 'warn',
        statusCode: '',
      })
    }

    if (status && status.status === Location.PermissionStatus.GRANTED) {
      userCurrentLocation()
    }
  }, [])


  useEffect(() => {
    requestLocationPermission()
  }, [])


  const userCurrentLocation = async () => {
    if (status && status.status === Location.PermissionStatus.GRANTED) {
      getLastKnowLocation()
      const userLocationDetails = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Highest
      })
      if (userLocationDetails?.coords?.longitude && userLocationDetails?.coords?.latitude) {
        dispatch(updateUserLocation([userLocationDetails.coords.longitude, userLocationDetails.coords.latitude]))
        dispatch(updateAccuracy(userLocationDetails.coords.accuracy))
      }
    } else {
      await requestLocationPermission();
    }
  }

  const getLastKnowLocation = async () => {
    try {
      const lastLocation = await Location.getLastKnownPositionAsync()
      if (lastLocation?.coords) {
        dispatch(updateUserLocation([lastLocation.coords.longitude, lastLocation.coords.latitude]))
        dispatch(updateAccuracy(lastLocation.coords.accuracy))
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
      await requestForegroundPermissionsAsync()
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
