import { StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';

import MarkerSVG from '../../Common/MarkerSVG';
import { Colors, Typography } from '../../../styles';
import { toLetters } from '../../../utils/mapMarkingCoordinate';
import { FIX_NEEDED, ON_SITE } from '../../../utils/inventoryConstants';
import { getIsDateInRemeasurementRange } from '../../../utils/remeasurement';

interface Props {
  geoJSON: any;
  isPointForMultipleTree?: boolean;
  setCoordinateModalShow?: React.Dispatch<React.SetStateAction<boolean>>;
  setCoordinateIndex?: React.Dispatch<React.SetStateAction<number | null | undefined>>;
  onPressMarker?: (isSampleTree: boolean, coordinate: []) => void;
  setIsSampleTree?: React.Dispatch<React.SetStateAction<boolean | null>>;
  locateTree?: string;
  isCarouselSample?: boolean;
  activeSampleCarouselIndex?: number | null;
  setActiveSampleCarouselIndex?: any;
  sampleCarouselRef?: any;
}
function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value => value + 1); // update the state to force render
}
const SampleTreeMarkers = ({
  geoJSON,
  isPointForMultipleTree,
  setCoordinateModalShow,
  setCoordinateIndex,
  onPressMarker,
  setIsSampleTree,
  locateTree = '',
  isCarouselSample = false,
  activeSampleCarouselIndex = null,
  setActiveSampleCarouselIndex,
  sampleCarouselRef,
}: Props) => {
  const markers = [];
  const [selectedMarker, setSelectedMarker] = useState();
  const forceUpdate = useForceUpdate();
  useEffect(() => {
    forceUpdate();
  }, [isCarouselSample, activeSampleCarouselIndex]);

  for (let i = isPointForMultipleTree ? 0 : 1; i < geoJSON.features.length; i++) {
    let onePoint = geoJSON.features[i];
    const markerText = isPointForMultipleTree ? toLetters(1) : `${i}`;
    let oneMarker = onePoint.geometry.coordinates;

    let shouldRemeasure = getIsDateInRemeasurementRange(
      geoJSON.features[i].properties?.app?.plantationDate,
    );

    let color = Colors.PRIMARY_DARK;
    let opacity = 1;

    if (isCarouselSample && activeSampleCarouselIndex !== i - 1) {
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
      <MapLibreGL.PointAnnotation
        key={`sampleTree-${i}`}
        id={`sampleTree-${i}`}
        coordinate={oneMarker}
        onSelected={feature => {
          if (sampleCarouselRef && sampleCarouselRef?.current) {
            sampleCarouselRef.current.snapToItem(i - 1);
            setActiveSampleCarouselIndex(i - 1);
            setSelectedMarker(i);
          }

          if (
            // locateTree == ON_SITE &&
            onPressMarker &&
            setCoordinateIndex &&
            setIsSampleTree &&
            setCoordinateModalShow
          ) {
            onPressMarker(true, feature.geometry.coordinates);
            setCoordinateIndex(i);
            setIsSampleTree(true);
            setCoordinateModalShow(true);
          }
        }}>
        <MarkerSVG
          point={markerText}
          color={color}
          opacity={i == activeSampleCarouselIndex ? 1 : opacity}
        />
      </MapLibreGL.PointAnnotation>,
    );
  }
  return <>{markers}</>;
};

export default SampleTreeMarkers;
