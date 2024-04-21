import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import turfDistance from '@turf/distance'
import {Point, Units} from '@turf/helpers'
import {SampleTree} from 'src/types/interface/slice.interface'

export default function distanceCalculator(
  latLong1: [number, number],
  latLong2: [number, number],
  unit: Units,
) {
  if (latLong1[0] === latLong2[0] && latLong1[1] === latLong2[1]) {
    return 0
  } else {
    // calculate the distance between two latitudes and longitudes using @turf/distance
    const point1: Point = {
      type: 'Point',
      coordinates: latLong1,
    }
    const point2: Point = {
      type: 'Point',
      coordinates: latLong2,
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
    console.log('distanceInCentimeters', distanceInCentimeters)
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
  polygonCoords: any,
  sampleTrees: SampleTree[],
) => {
  console.log('Params', activeCoords, polygonCoords, sampleTrees)
  const isPointInPolygon = booleanPointInPolygon(activeCoords, polygonCoords)
  console.log('isPointInPolygon', isPointInPolygon)

  if (!isPointInPolygon) {
    return false
  }
  const validDistance = checkIsSampleMarkerValid(activeCoords, sampleTrees)
  console.log('validDistance', validDistance)

  if (!validDistance) {
    return false
  }

  return true
}

export const isPointInPolygon = (activeCoords,polygonCoords) => {
  return booleanPointInPolygon(activeCoords, polygonCoords)
}
