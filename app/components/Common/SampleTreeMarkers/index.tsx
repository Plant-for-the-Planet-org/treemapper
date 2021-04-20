import MapboxGL from '@react-native-mapbox-gl/maps';
import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { marker_png } from '../../../assets';
import { Colors, Typography } from '../../../styles';
import { toLetters } from '../../../utils/mapMarkingCoordinate';

interface Props {
  geoJSON: any;
  isPointForMultipleTree?: boolean;
}

const SampleTreeMarkers = ({ geoJSON, isPointForMultipleTree }: Props) => {
  const markers = [];
  for (let i = isPointForMultipleTree ? 0 : 1; i < geoJSON.features.length; i++) {
    let onePoint = geoJSON.features[i];
    const markerText = isPointForMultipleTree ? toLetters(1) : `#${i}`;
    let oneMarker = onePoint.geometry.coordinates;
    markers.push(
      <MapboxGL.PointAnnotation
        key={`sampleTree-${i}`}
        id={`sampleTree-${i}`}
        coordinate={oneMarker}>
        <ImageBackground source={marker_png} style={styles.markerContainer} resizeMode={'cover'}>
          <Text style={styles.markerText}>{markerText}</Text>
        </ImageBackground>
      </MapboxGL.PointAnnotation>,
    );
  }
  return markers;
};

export default SampleTreeMarkers;

const styles = StyleSheet.create({
  markerContainer: {
    width: 30,
    height: 43,
    paddingBottom: 85,
  },
  markerText: {
    width: 30,
    height: 43,
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    textAlign: 'center',
    paddingTop: 4,
  },
});
