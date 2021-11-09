import turfDistance from '@turf/distance';
import { Point, Units } from '@turf/helpers';

export default function distanceCalculator(latLong1: [number, number], latLong2: [number, number], unit: Units) {
  if (latLong1[0] === latLong2[0] && latLong1[1] === latLong2[1]) {
    return 0;
  } else {
    // calculate the distance between two latitudes and longitudes using @turf/distance
    const point1: Point = {
      type: "Point",
      coordinates: latLong1,
    };
    const point2: Point = {
      type: "Point",
      coordinates: latLong2,
    };
    const distance = turfDistance(point1, point2, {
      units: unit,
    });

    return distance;
  }
}
