import * as Location from 'expo-location'

const getUserLocation = async () => {
  const Data= await Location.getCurrentPositionAsync()
  if (Data.coords) {
    return {lat: Data.coords.latitude, long: Data.coords.longitude}
  } else {
    return {lat: 0, long: 0}
  }
}

export default getUserLocation
