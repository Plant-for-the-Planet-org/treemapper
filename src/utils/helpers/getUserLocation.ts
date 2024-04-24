import * as Location from 'expo-location'

const getUserLocation = async () => {
  const Data= await Location.getCurrentPositionAsync()
  if (Data.coords) {
    return {lat: Data.coords.latitude, long: Data.coords.longitude, accuracy: Data.coords.accuracy}
  } else {
    return {lat: 0, long: 0, accuracy:0}
  }
}

export default getUserLocation
