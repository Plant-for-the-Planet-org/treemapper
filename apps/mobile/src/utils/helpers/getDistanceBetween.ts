// Haversine distance between two [longitude, latitude] points, in meters.
// Used to tell the user how far they are from a planted tree as they walk.

const EARTH_RADIUS_M = 6371000

const toRad = (deg: number): number => (deg * Math.PI) / 180

const getDistanceBetween = (
  from: [number, number],
  to: [number, number],
): number => {
  const [lng1, lat1] = from
  const [lng2, lat2] = to
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

// "12 m away" under a kilometer, "1.3 km away" beyond.
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m away`
  }
  return `${(meters / 1000).toFixed(1)} km away`
}

export default getDistanceBetween
