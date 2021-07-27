import MapboxGL from '@react-native-mapbox-gl/maps';
import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { marker_png } from '../../../assets';
import { Colors, Typography } from '../../../styles';
import { ON_SITE } from '../../../utils/inventoryConstants';
import { toLetters } from '../../../utils/mapMarkingCoordinate';
import MarkerSVG from '../../Common/MarkerSVG';

interface Props {
  geoJSON: any;
  isPointForMultipleTree?: boolean;
  setCoordinateModalShow: React.Dispatch<React.SetStateAction<boolean>>;
  setCoordinateIndex: React.Dispatch<React.SetStateAction<number | null | undefined>>;
  onPressMarker: (scrollX: number, scrollY: number, coordinate: []) => void;
  setIsSampleTree: React.Dispatch<React.SetStateAction<boolean | null>>;
  locateTree: string;
}

const SampleTreeMarkers = ({
  geoJSON,
  isPointForMultipleTree,
  setCoordinateModalShow,
  setCoordinateIndex,
  onPressMarker,
  setIsSampleTree,
  locateTree,
}: Props) => {
  const markers = [];
  for (let i = isPointForMultipleTree ? 0 : 1; i < geoJSON.features.length; i++) {
    let onePoint = geoJSON.features[i];
    const markerText = isPointForMultipleTree ? toLetters(1) : `${i}`;
    let oneMarker = onePoint.geometry.coordinates;
    markers.push(
      <MapboxGL.PointAnnotation
        key={`sampleTree-${i}`}
        id={`sampleTree-${i}`}
        coordinate={oneMarker}
        onSelected={(feature) => {
          if (locateTree == ON_SITE) {
            onPressMarker(
              feature.properties.screenPointX,
              feature.properties.screenPointY,
              feature.geometry.coordinates,
            );
            setCoordinateIndex(i);
            setIsSampleTree(true);
            setCoordinateModalShow(true);
          }
        }}>
        <MarkerSVG point={markerText} color={isPointForMultipleTree ? Colors.PRIMARY : '#007A49'} />
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
