import { useEffect, useState } from 'react'
import * as Location from 'expo-location'
import { useDispatch } from 'react-redux';
import { updaeBlockerModal, updateUserLocation } from 'src/store/slice/gpsStateSlice';

const useLocationPermission = () => {
  const [status, requestForegroundPermissionsAsync] = Location.useForegroundPermissions();
  const [permissionStatus, setPermissionStatus] = useState('undetermined')
  const dispatch = useDispatch()

  useEffect(() => {
    if (status && status.granted) {
      setPermissionStatus('granted')
      dispatch(updaeBlockerModal(false))
      userCurrentLocation()
    }
    if (status && status.status === Location.PermissionStatus.DENIED) {
      setPermissionStatus('denied')
      dispatch(updaeBlockerModal(true))
    }

  }, [status])


  const userCurrentLocation = async () => {
    if(permissionStatus!=='granted'){
      requestForegroundPermissionsAsync();
      return;
    }
    const Data= await Location.getCurrentPositionAsync()
    if (Data.coords && Data.coords.longitude && Data.coords.latitude) {
      const coorinatesData = JSON.parse(JSON.stringify(Data)) 
      dispatch(updateUserLocation([coorinatesData.coords.longitude.toFixed(6), coorinatesData.coords.latitude.toFixed(6)]))
    }
  }

  const requestLocationPermission = async () => {
    await requestForegroundPermissionsAsync()
  }


  return { requestLocationPermission, permissionStatus , userCurrentLocation}
}

export default useLocationPermission
