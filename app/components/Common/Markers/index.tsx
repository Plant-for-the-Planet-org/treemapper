import * as React from 'react';
import Config from 'react-native-config';
import { StyleSheet } from 'react-native';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { useEffect, useRef, useState } from 'react';

import { Colors } from '../../../styles';
import MarkerSVG from '../../Common/MarkerSVG';
import { geoJSONType, ON_SITE } from '../../../utils/inventoryConstants';
import { toLetters } from '../../../utils/mapMarkingCoordinate';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

interface MarkersProps {
  geoJSON: geoJSONType;
  onPressMarker?: any;
  locateTree?: string;
  draggable?: boolean;
  onDeselected?: () => void;
  onDragStart?: (e: any, index: number) => void;
  onDrag?: (e: any, index: number) => void;
  onDragEnd?: (e: any, index: number) => void;
  ignoreLastMarker?: boolean;
  type?: 'LineString' | 'Polygon';
  nonDragablePoint?: boolean;
  setCoordinateModalShow: React.Dispatch<React.SetStateAction<boolean>>;
  setCoordinateIndex: React.Dispatch<React.SetStateAction<number | null | undefined>>;
  setIsSampleTree: React.Dispatch<React.SetStateAction<boolean | null>>;
}
const Markers = ({
  geoJSON,
  onPressMarker,
  locateTree,
  draggable,
  onDeselected,
  onDragStart,
  onDrag,
  onDragEnd,
  ignoreLastMarker = false,
  type = 'Polygon',
  nonDragablePoint = false,
}: MarkersProps) => {
  const [alphabets, setAlphabets] = useState<string[]>([]);
  const markers: JSX.Element[] = [];

  useEffect(() => {
    let alphabetsArray = [];
    for (var x = 1, y; x <= 130; x++) {
      y = toLetters(x);
      alphabetsArray.push(y);
    }
    setAlphabets(alphabetsArray);
  }, []);
  for (let i = 0; i < geoJSON.features.length; i++) {
    return (
      <PointAnnotationMarker
        markers={markers}
        geoJSON={geoJSON}
        i={i}
        alphabets={alphabets}
        onPressMarker={onPressMarker}
        locateTree={locateTree}
        draggable={draggable}
        onDeselected={onDeselected}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        ignoreLastMarker={ignoreLastMarker}
        type={type}
        nonDragablePoint={nonDragablePoint}
      />
    );
  }
  return <>{markers}</>;
};

interface PointAnnotationMarkerProps {
  markers: JSX.Element[];
  geoJSON: geoJSONType;
  i: number;
  alphabets: string[];
  onPressMarker: any;
  locateTree: string | undefined;
  draggable?: boolean;
  onDeselected?: () => void;
  onDragStart?: (e: any, index: number) => void;
  onDrag?: (e: any, index: number) => void;
  onDragEnd?: (e: any, index: number) => void;
  ignoreLastMarker?: boolean;
  type?: 'LineString' | 'Polygon';
  nonDragablePoint?: boolean;
  setCoordinateModalShow: React.Dispatch<React.SetStateAction<boolean>>;
  setCoordinateIndex: React.Dispatch<React.SetStateAction<number | null | undefined>>;
  setIsSampleTree: React.Dispatch<React.SetStateAction<boolean | null>>;
}

const PointAnnotationMarker = ({
  markers,
  geoJSON,
  i,
  alphabets,
  onPressMarker,
  locateTree,
  draggable = false,
  onDeselected = () => {},
  onDragStart = () => {},
  onDrag = () => {},
  onDragEnd = () => {},
  ignoreLastMarker = false,
  type = 'Polygon',
  nonDragablePoint = false,
}: PointAnnotationMarkerProps): JSX.Element => {
  const annotationRefList = useRef<MapboxGL.PointAnnotation[] | null>([]);
  const calloutRefList = useRef<MapboxGL.Callout[] | null>([]);

  let onePolygon = geoJSON.features[i];
  let coordinates =
    type === 'Polygon' ? onePolygon.geometry.coordinates[0] : onePolygon.geometry.coordinates;

  useEffect(() => {
    annotationRefList.current = annotationRefList.current.slice(0, coordinates.length);
    calloutRefList.current = calloutRefList.current.slice(0, coordinates.length);
  }, [onePolygon.geometry.coordinates]);

  if (onePolygon.geometry.type === 'Point') {
    markers.push(
      <MapboxGL.PointAnnotation
        key={`${i}-point-${nonDragablePoint ? 'nonDragablePoint' : ''}`}
        id={`${i}-point-${nonDragablePoint ? 'nonDragablePoint' : ''}`}
        coordinate={onePolygon.geometry.coordinates}
        ref={el => {
          annotationRefList.current[i] = el;
        }}
        draggable={draggable}
        onDeselected={onDeselected}
        onDragStart={e => onDragStart(e, i)}
        onDrag={e => onDrag(e, i)}
        onDragEnd={e => onDragEnd(e, i)}>
        <MarkerSVG
          point={alphabets[i]}
          color={nonDragablePoint ? Colors.GRAY_LIGHTEST : Colors.PRIMARY}
        />
        {/* <View style={styles.annotationContainer} /> */}
      </MapboxGL.PointAnnotation>,
    );
  } else {
    const iterationCount = ignoreLastMarker ? coordinates.length - 1 : coordinates.length;
    for (let j = 0; j < iterationCount; j++) {
      let oneMarker = coordinates[j];

      markers.push(
        <MapboxGL.PointAnnotation
          key={`${i}${j}`}
          id={`${i}${j}`}
          coordinate={oneMarker}
          ref={el => {
            annotationRefList.current[j] = el;
          }}
          onSelected={feature => {
            if (locateTree && locateTree === ON_SITE && onPressMarker) {
              onPressMarker({
                isSampleTree: false,
                coordinate: feature.geometry.coordinates,
                coordinateIndex: j,
              });
            }
          }}
          draggable={draggable}
          onDeselected={onDeselected}
          onDragStart={e => onDragStart(e, j)}
          onDrag={e => onDrag(e, j)}
          onDragEnd={e => onDragEnd(e, j)}>
          <MarkerSVG point={alphabets[j]} color={Colors.PRIMARY} />
        </MapboxGL.PointAnnotation>,
      );
    }
  }

  return <>{markers}</>;
};
const ANNOTATION_SIZE = 45;

const styles = StyleSheet.create({
  annotationContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: ANNOTATION_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    height: ANNOTATION_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: ANNOTATION_SIZE,
  },
  annotationFill: {
    width: ANNOTATION_SIZE - 3,
    height: ANNOTATION_SIZE - 3,
    borderRadius: (ANNOTATION_SIZE - 3) / 2,
    backgroundColor: 'orange',
    transform: [{ scale: 0.6 }],
  },
  imageView: {
    width: 150,
    height: 100,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'green',
  },
});

export default Markers;
