import store from "src/store"

// Beyond this a stored fix no longer describes where the user is standing.
const FIX_MAX_AGE_MS = 60000

// `user_location` is held in GeoJSON order, [longitude, latitude] -- the same
// order the map cameras and the intervention geometry use. Index 0 is the
// longitude; reading it as the latitude transposes the point.
const getUserLocation = () => {
  const { user_location, accuracy, last_fix_at } = store.getState().gpsState
  return {
    lat: user_location[1],
    long: user_location[0],
    accuracy,
    // Callers that write a coordinate or gate on proximity should refuse a
    // stale fix rather than treat the last known position as current.
    isStale: !last_fix_at || Date.now() - last_fix_at > FIX_MAX_AGE_MS,
  }
}

export default getUserLocation
