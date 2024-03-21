import {useEffect, useState} from 'react'
import * as Location from 'expo-location'

const useLocationPermission = () => {
  const [isPermissionGranted, setIsPermissionGranted] = useState(
    Location.PermissionStatus.UNDETERMINED,
  )

  useEffect(() => {
    const requestLocationPermission = async () => {
      const {status} = await Location.requestForegroundPermissionsAsync()

      if (status === Location.PermissionStatus.GRANTED) {
        setIsPermissionGranted(Location.PermissionStatus.GRANTED)
      } else {
        setIsPermissionGranted(Location.PermissionStatus.DENIED)
      }
    }

    requestLocationPermission()
  }, [])

  return isPermissionGranted
}

export default useLocationPermission
