import store from "src/store"




const getUserLocation = () => {
  const { user_location, accuracy } = store.getState().gpsState
  return { lat: user_location[0], long: user_location[1], accuracy }
}

export default getUserLocation
