import { StyleSheet } from 'react-native';
import React, { useMemo } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Colors } from 'src/utils/constants';
import { point, distance } from '@turf/turf';

interface Props {
  coordinates: Array<number[]>;
}

type DistanceUnits = 'meters' | 'kilometers';

const LineMarker = (props: Props) => {
  const calculateDistance = (
    coords1: number[],
    coords2: number[],
    units: DistanceUnits = 'meters'
  ) => {
    const from = point([coords1[0], coords1[1]]);
    const to = point([coords2[0], coords2[1]]);
    return Math.round(distance(from, to, { units }));
  };

  const features = useMemo(() => {
    if (props.coordinates.length < 2) {
      return [];
    }

    // Create the line feature
    const lineFeature = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [...props.coordinates],
      },
    };

    // Create distance label features
    const distanceFeatures = props.coordinates.slice(0, -1).map((coord, i) => {
      const nextCoord = props.coordinates[i + 1];
      const dist = calculateDistance(coord, nextCoord);
      const midpoint = [
        (coord[0] + nextCoord[0]) / 2,
        (coord[1] + nextCoord[1]) / 2,
      ];
      
      return {
        type: 'Feature' as const,
        properties: {
          distance: `${dist}m`,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: midpoint,
        },
      };
    });

    return [lineFeature, ...distanceFeatures];
  }, [props.coordinates]);

  if (props.coordinates.length < 2) {
    return null;
  }

  return (
    <MapLibreGL.ShapeSource
      id="polygon_line_marker"
      shape={{
        type: 'FeatureCollection',
        features: features,
      }}>
      <MapLibreGL.LineLayer id="poly_line_marker" style={styles.lineStyle} />
      <MapLibreGL.SymbolLayer
        id="distance_labels"
        style={styles.distanceLabel}
      />
    </MapLibreGL.ShapeSource>
  );
};

export default LineMarker;

const styles = StyleSheet.create({
  lineStyle: {
    lineColor: Colors.PRIMARY_DARK,
    lineWidth: 2,
  },
  distanceLabel: {
    textField: ['get', 'distance'],
    textSize: 16,
    textColor: Colors.PRIMARY_DARK,
    textHaloColor: '#FFFFFF',
    textHaloWidth: 2,
    symbolPlacement: 'point',
    textAnchor: 'center',
    textOffset: [0, -1],
    textAllowOverlap: false,
    textIgnorePlacement: false,
    textFont: ['Arial Regular'], // Changed from Ubuntu Italic to Arial Regular
  },
});