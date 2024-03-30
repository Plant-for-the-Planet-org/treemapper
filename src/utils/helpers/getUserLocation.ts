import * as Location from 'expo-location'

const getUserLocation = async () => {
  const {coords} = await Location.getCurrentPositionAsync()

  if (coords) {
    return {lat: coords.latitude, long: coords.longitude}
  } else {
    return {lat: 0, long: 0}
  }
}

export default getUserLocation
