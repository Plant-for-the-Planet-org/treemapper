import turfDistance from '@turf/distance';
export default function distanceCalculator(lat1: number, lon1: number, lat2: number, lon2: number, unit: string) {
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    // calculate the distance between two latitudes and longitudes
    const point1 = {
      type: 'Point',
      coordinates: [lon1, lat1],
    };
    const point2 = {
      type: 'Point',
      coordinates: [lon2, lat2],
    };
    const distance = turfDistance(point1, point2, {
      units: unit,
    });

    return distance;
  }
}
