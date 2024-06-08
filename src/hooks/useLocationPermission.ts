import { useEffect } from 'react'
import * as Location from 'expo-location'
import { useDispatch } from 'react-redux';
import { updaeBlockerModal, updateUserLocation } from 'src/store/slice/gpsStateSlice';

const useLocationPermission = () => {
  const [status, requestForegroundPermissionsAsync] = Location.useForegroundPermissions();
  const dispatch = useDispatch()

  useEffect(() => {
    if (status && status.status !== Location.PermissionStatus.GRANTED) {
      dispatch(updaeBlockerModal(true))
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
      }
    } else {
      await requestLocationPermission();
      return;
    }
  }

  const getLastKnowLocation = async () => {
    try {
      const lastLocation = await Location.getLastKnownPositionAsync()
      if (lastLocation && lastLocation.coords) {
        dispatch(updateUserLocation([lastLocation.coords.longitude, lastLocation.coords.latitude]))
      }
    } catch (error) {
      console.log("Error", error);
      //TODO error log
    }
  }



  const requestLocationPermission = async () => {
    await requestForegroundPermissionsAsync()
    await Location.enableNetworkProviderAsync()
  }


  return { userCurrentLocation }
}

export default useLocationPermission
