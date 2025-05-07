import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Colors } from 'src/utils/constants';
import MapPin from 'assets/images/svg/MapPin.svg'
import * as turf from '@turf/turf';
import { Feature } from '@turf/helpers';
import { useToast } from 'react-native-toast-notifications';


interface Coordinates {
  heading?: number;
  course?: number;
  speed?: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
}

export interface Location {
  coords: Coordinates;
  timestamp?: number;
}

interface Props {
  latestCoords: Location;
  isPaused: boolean
  startCoord: number[]
  handleCompletePress: boolean
  handleTrackComplete: (e: Feature) => void
  handleInvalidArea: () => void
  isSatellite: boolean
}


const BUFFER_SIZE = 3; // Number of points to collect before simplification
const EPSILON = 0.00001; // Simplification tolerance - adjust based on your needs

const calculatePerpendicularDistance = (
  point: Location,
  lineStart: Location,
  lineEnd: Location
): number => {
  const numerator = Math.abs(
    (lineEnd.coords.longitude - lineStart.coords.longitude) * (lineStart.coords.latitude - point.coords.latitude) -
    (lineStart.coords.longitude - point.coords.longitude) * (lineEnd.coords.latitude - lineStart.coords.latitude)
  );

  const denominator = Math.sqrt(
    Math.pow(lineEnd.coords.longitude - lineStart.coords.longitude, 2) +
    Math.pow(lineEnd.coords.latitude - lineStart.coords.latitude, 2)
  );

  return numerator / denominator;
};

const simplifyPath = (points: Location[], epsilon: number): Location[] => {
  if (points.length <= 2) {
    return points;
  }

  let maxDistance = 0;
  let maxDistanceIndex = 0;
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];



  // Find the point with the maximum perpendicular distance
  for (let i = 1; i < points.length - 1; i++) {
    const distance = calculatePerpendicularDistance(points[i], firstPoint, lastPoint);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxDistanceIndex = i;
    }
  }

  if (maxDistance > epsilon) {
    const firstHalf = simplifyPath(points.slice(0, maxDistanceIndex + 1), epsilon);
    const secondHalf = simplifyPath(points.slice(maxDistanceIndex), epsilon);
    return firstHalf.slice(0, -1).concat(secondHalf);
  }

  return [firstPoint, lastPoint];
};

const PolygonTracker: React.FC<Props> = ({ latestCoords, startCoord, isPaused, handleCompletePress, handleTrackComplete, isSatellite, handleInvalidArea }) => {
  const [simplifiedCoordinates, setSimplifiedCoordinates] = useState<Location[]>([]);
  const coordinatesBuffer = useRef<Location[]>([]);
  const toast = useToast()
  const [finalGeoJSON, setFinalGeoJSON] = useState(null)
  useEffect(() => {
    if (startCoord) {
      const firstCoord: Location = {
        coords: {
          latitude: startCoord[1],
          longitude: startCoord[0],
        }
      }
      coordinatesBuffer.current.push(firstCoord);
    }
  }, [startCoord])

  const processBuffer = useCallback(() => {
    if (coordinatesBuffer.current.length >= BUFFER_SIZE) {
      const simplified = simplifyPath(coordinatesBuffer.current, EPSILON);
      setSimplifiedCoordinates(prev => {
        // Keep the last point to ensure continuity
        const newPoints = prev.length > 0
          ? simplified.slice(1) // Remove first point to avoid duplication
          : simplified;
        return [...prev, ...newPoints];
      });
      // Keep the last point in buffer for continuity
      coordinatesBuffer.current = [coordinatesBuffer.current[coordinatesBuffer.current.length - 1]];
    }
  }, []);

  useEffect(() => {
    if (latestCoords && !isPaused) {
      setTimeout(() => {
        coordinatesBuffer.current.push(latestCoords);
        processBuffer();
      }, 1000);
    }
  }, [latestCoords, processBuffer, isPaused]);

  useEffect(() => {
    if (handleCompletePress) {
      handleComplete()
    }
  }, [handleCompletePress])


  const createGeoJSON = useCallback(() => {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: simplifiedCoordinates.map(coord => [
              coord.coords.longitude,
              coord.coords.latitude
            ])
          }
        }
      ]
    };
  }, [simplifiedCoordinates]);


  const handleComplete = () => {
    const finalCoord = simplifiedCoordinates.map(coord => [
      coord.coords.longitude,
      coord.coords.latitude
    ])
    const area = turf.area({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[...finalCoord, startCoord]]
      }
    });
    if (area === 0) {
      toast.show("Not a valid area")
      handleInvalidArea()
      return;
    }
    // Convert to hectares
    const areaInHectares = area / 10000;

    // If you want to format it to 2 decimal places
    const formattedArea = areaInHectares.toFixed(2) + ' ha';
    const center = turf.center({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[...finalCoord, startCoord]]
          }
        }
      ]
    });

    setFinalGeoJSON(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[...finalCoord, startCoord]]
            }
          },
          {
            type: 'Feature',
            properties: {
              area: `${formattedArea}` // Use your pre-calculated area here
            },
            geometry: center.geometry
          }
        ]
      },

    )
    handleTrackComplete({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[...finalCoord, startCoord]]
      }
    })
  }

  const renderStartingPoint = () => {
    if (!startCoord) {
      return null
    }
    return (
      <MapLibreGL.MarkerView coordinate={startCoord} id='start_cord' key={"Start"}>
        <View style={styles.container}>
          <View style={styles.mapPinContainer}>
            <MapPin fill={Colors.NEW_PRIMARY} />
          </View>
        </View>
      </MapLibreGL.MarkerView>
    )
  }

  if (finalGeoJSON) {
    return (
      <MapLibreGL.ShapeSource
        key={'feature.properties.id'}
        id={'finalgeojson'}
        shape={finalGeoJSON} >
        <MapLibreGL.FillLayer
          id={'poly_map_shape_fill' + 'feature.properties.id'}
          style={{
            fillOpacity: 0.8,
            fillColor: Colors.NEW_PRIMARY,
          }}
        />
        <MapLibreGL.LineLayer
          id={'poly_map_shape_source' + 'feature.properties.id'}
          style={{
            lineWidth: 2,
            lineOpacity: 0.5,
            lineJoin: 'bevel',
            lineColor: Colors.NEW_PRIMARY,
          }}
        />
        <MapLibreGL.SymbolLayer
          id="distance_labels"
          style={styles.distanceLabel}
          filter={['==', '$type', 'Point']}
        />
      </MapLibreGL.ShapeSource >
    )
  }

  return (
    <>
      {renderStartingPoint()}
      {simplifiedCoordinates.length > 1 && <MapLibreGL.ShapeSource
        id="polygon_tracker"
        shape={createGeoJSON()}>
        <MapLibreGL.LineLayer id="poly_tracker" style={{
          lineWidth: 4,
          lineColor: isSatellite ? "#fff" : Colors.PRIMARY_DARK,
        }} />
      </MapLibreGL.ShapeSource>}
    </>
  );
};

export default PolygonTracker;

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 100,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPinContainer: {
    position: 'absolute',
    left: '17%',
    top: '-0.1%',
  },
  distanceLabel: {
    textField: ['get', 'area'],
    textSize: 18,
    textColor: Colors.PRIMARY_DARK,
    textHaloColor: '#FFFFFF',
    textHaloWidth: 2,
    symbolPlacement: 'point',
    textAnchor: 'center',
    textOffset: [0, 0],
    textAllowOverlap: false,
    textIgnorePlacement: false,
    textFont: ['Arial Regular'], // Changed from Ubuntu Italic to Arial Regular
  },
});