import { Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import MarkerSVG from '../../Common/MarkerSVG';
import { Colors, Typography } from '../../../styles';
import { toLetters } from '../../../utils/mapMarkingCoordinate';
import { FIX_NEEDED, ON_SITE } from '../../../utils/inventoryConstants';
import { getIsDateInRemeasurementRange } from '../../../utils/remeasurement';
import { useSelector } from 'react-redux';

interface Props {
  geoJSON: any;
  isPointForMultipleTree?: boolean;
  setCoordinateModalShow?: React.Dispatch<React.SetStateAction<boolean>>;
  setCoordinateIndex?: React.Dispatch<React.SetStateAction<number | null | undefined>>;
  onPressMarker?: (isSampleTree: boolean, coordinate: []) => void;
  setIsSampleTree?: React.Dispatch<React.SetStateAction<boolean | null>>;
  locateTree?: string;
  activeSampleCarouselIndex?: number | null;
  setActiveSampleCarouselIndex?: any;
  sampleCarouselRef?: any;
}

const SampleTreeMarkers = ({
  geoJSON,
  isPointForMultipleTree,
  setCoordinateModalShow,
  setCoordinateIndex,
  onPressMarker,
  setIsSampleTree,
  sampleCarouselRef,
}: Props) => {
  const markers = [];
  const { treeMarkerCarousel } = useSelector(state => state.appSlice);


  for (let i = isPointForMultipleTree ? 0 : 1; i < geoJSON.features.length; i++) {
    let onePoint = geoJSON.features[i];
    const markerText = isPointForMultipleTree ? toLetters(1) : `${i}`;
    let oneMarker = onePoint.geometry.coordinates;

    let shouldRemeasure = getIsDateInRemeasurementRange(
      geoJSON.features[i].properties?.app?.plantationDate,
    );

    let color = Colors.PRIMARY_DARK;
    let opacity = 1;

    if (treeMarkerCarousel !== i - 1) {
      color = Colors.GRAY_LIGHTEST;
      opacity = 0.6;
    }
    if (shouldRemeasure) {
      color = Colors.PLANET_CRIMSON;
    }
    if (geoJSON?.features[i].properties?.app?.status === FIX_NEEDED) {
      color = Colors.PLANET_RED;
    }

    markers.push(
      <Pressable 
      key={`sampleTree-${i}`}
      onPress={()=>{
        if (sampleCarouselRef && sampleCarouselRef?.current) {
          sampleCarouselRef.current.scrollTo({ index: i-1, animated: true});
        }
        if (
          // locateTree == ON_SITE &&
          onPressMarker &&
          setCoordinateIndex &&
          setIsSampleTree &&
          setCoordinateModalShow
        ) {
          onPressMarker(true, geoJSON?.features[i].geometry.coordinates);
          setCoordinateIndex(i);
          setIsSampleTree(true);
          setCoordinateModalShow(true);
        }
      }}>
      <MapLibreGL.MarkerView
        key={`sampleTree-${i}`}
        id={`sampleTree-${i}`}
        coordinate={oneMarker}>
        <MarkerSVG
          point={markerText}
          color={color}
          opacity={i == treeMarkerCarousel ? 1 : opacity}
        />
      </MapLibreGL.MarkerView>
      </Pressable>
    );
  }
  return <>{markers}</>;
};

export default SampleTreeMarkers;
