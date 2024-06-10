import { useEffect } from 'react'
import * as Location from 'expo-location'
import { useDispatch } from 'react-redux';
import { updaeBlockerModal, updateAccurracy, updateUserLocation } from 'src/store/slice/gpsStateSlice';
import useLogManagement from './realm/useLogManagement';

const useLocationPermission = () => {
  const [status, requestForegroundPermissionsAsync] = Location.useForegroundPermissions();
  const dispatch = useDispatch()
  const { addNewLog } = useLogManagement()

  useEffect(() => {
    if (status && status.status !== Location.PermissionStatus.GRANTED) {
      dispatch(updaeBlockerModal(true))
      addNewLog({
        logType: 'LOCATION',
        message: "Location Permission Deined",
        logLevel: 'warn',
        statusCode: '',
      })
    }

    if (status && status.status === Location.PermissionStatus.GRANTED) {
      dispatch(updaeBlockerModal(false))
      userCurrentLocation()
    }

  }, [status])


  useEffect(() => {
    requestLocationPermission()
  }, [])


  const userCurrentLocation = async () => {
    if (status && status.status === Location.PermissionStatus.GRANTED) {
      getLastKnowLocation()
      const userLocationDetails = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Highest
      })
      if (userLocationDetails.coords && userLocationDetails.coords.longitude && userLocationDetails.coords.latitude) {
        dispatch(updateUserLocation([userLocationDetails.coords.longitude, userLocationDetails.coords.latitude]))
        dispatch(updateAccurracy(userLocationDetails.coords.accuracy))
      }
    } else {
      await requestLocationPermission();
    }
  }

  const getLastKnowLocation = async () => {
    try {
      const lastLocation = await Location.getLastKnownPositionAsync()
      if (lastLocation && lastLocation.coords) {
        dispatch(updateUserLocation([lastLocation.coords.longitude, lastLocation.coords.latitude]))
        dispatch(updateAccurracy(lastLocation.coords.accuracy))
      }
    } catch (error) {
      addNewLog({
        logType: 'LOCATION',
        message: JSON.stringify(error),
        logLevel: 'error',
        statusCode: ''
      })
    }
  }



  const requestLocationPermission = async () => {
    await requestForegroundPermissionsAsync()
    await Location.enableNetworkProviderAsync()
  }


  return { userCurrentLocation }
}

export default useLocationPermission
