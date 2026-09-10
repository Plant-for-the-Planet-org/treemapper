import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import turfDistance from '@turf/distance'
import {Point, Units} from '@turf/helpers'
import {PlantedPlotSpecies, SampleTree} from 'src/types/interface/slice.interface'

export default function distanceCalculator(
  latLong1: [number, number],
  latLong2: [number, number],
  unit: Units,
) {
  if (latLong1[0] === latLong2[0] && latLong1[1] === latLong2[1]) {
    return 0
  } else {
    // calculate the distance between two latitudes and longitudes using @turf/distance.
    // Callers hand over [lat, long], but GeoJSON -- and so turf -- reads
    // Point.coordinates as [long, lat]. Passing the pair through unswapped
    // measures between mirrored points: a true 5 m north-south gap comes back
    // as 1 m at 20N, and a 5 m east-west gap comes back as 8 m at 51N.
    const point1: Point = {
      type: 'Point',
      coordinates: [latLong1[1], latLong1[0]],
    }
    const point2: Point = {
      type: 'Point',
      coordinates: [latLong2[1], latLong2[0]],
    }
    const distance = turfDistance(point1, point2, {
      units: unit,
    })

    return distance
  }
}

export const checkIsValidPolygonMarker = async (
  centerCoordinates: number[],
  geoJSONCoords,
) => {
  let isValidMarkers = true

  const distanceInMeters = distanceCalculator(
    [centerCoordinates[1], centerCoordinates[0]],
    [geoJSONCoords[1], geoJSONCoords[0]],
    'meters',
  )
  // if the current marker position is less than one meter to already present markers nearby,
  // then makes the current marker position invalid
  if (distanceInMeters < 1) {
    isValidMarkers = false
  }
  return isValidMarkers
}

const checkIsSampleMarkerValid = (
  centerCoordinates: number[],
  sampleTrees: any,
) => {
  let isValidMarker = true

  for (const sampleTree of sampleTrees) {
    const distanceInCentimeters = distanceCalculator(
      [centerCoordinates[1], centerCoordinates[0]],
      [sampleTree.latitude, sampleTree.longitude],
      'centimeters',
    )
    // if the current marker position is less than 300cm to already present sample tree nearby,
    // then makes the current marker position as invalid
    if (distanceInCentimeters < 30) {
      isValidMarker = false
      break
    }
  }
  return isValidMarker
}

export const validateMarkerForSampleTree = (
  activeCoords: number[],
  sampleTrees: SampleTree[] | PlantedPlotSpecies[],
) => {
  const validDistance = checkIsSampleMarkerValid(activeCoords, sampleTrees)
  return validDistance
}

export const isPointInPolygon = (activeCoords,polygonCoords) => {
  return booleanPointInPolygon(activeCoords, polygonCoords)
}

/**
 * Centre of a polygon, as [lng, lat], or null when there is nothing to average.
 *
 * `rings` is GeoJSON Polygon coordinates: an array of rings, each an array of
 * [lng, lat] pairs. Only the outer ring counts.
 *
 * The mean of the ring's vertices. That is exact for the shapes a monitoring
 * plot can be, a generated circle or a rectangle, and close enough for a
 * hand-drawn one. Doing it here avoids pulling the whole turf bundle into the
 * app for one number.
 */
export const polygonCenter = (rings?: number[][][]): [number, number] | null => {
  const ring = rings?.[0]
  if (!Array.isArray(ring) || ring.length === 0) return null
  // A closed ring repeats its first vertex. Counting it twice pulls the centre
  // toward that corner.
  const last = ring[ring.length - 1]
  const closed = ring.length > 2
    && Array.isArray(last)
    && last[0] === ring[0][0]
    && last[1] === ring[0][1]
  const points = closed ? ring.slice(0, -1) : ring

  let lng = 0
  let lat = 0
  let count = 0
  for (const p of points) {
    if (!Array.isArray(p) || typeof p[0] !== 'number' || typeof p[1] !== 'number') continue
    lng += p[0]
    lat += p[1]
    count += 1
  }
  if (count === 0) return null
  return [lng / count, lat / count]
}
