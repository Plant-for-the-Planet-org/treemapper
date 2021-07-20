import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import MarkerSVG from '../../Common/MarkerSVG';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { Platform } from 'react-native';
import Config from 'react-native-config';
import { toLetters } from '../../../utils/mapMarkingCoordinate';
import { Colors } from '../../../styles';

const IS_ANDROID = Platform.OS === 'android';
MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

type geoJSONType = {
  type: string;
  features: {
    type: string;
    properties: {
      isPolygonComplete: boolean;
    };
    geometry: {
      type: string;
      coordinates: never[];
    };
  }[];
};
const Markers = ({ geoJSON }: { geoJSON: geoJSONType }) => {
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
    console.log(i, 'i');

    return (
      <PointAnnotationMarker markers={markers} geoJSON={geoJSON} i={i} alphabets={alphabets} />
    );
  }
  return markers;
};

interface PointAnnotationMarkerProps {
  markers: JSX.Element[];
  geoJSON: geoJSONType;
  i: number;
  alphabets: string[];
}

const PointAnnotationMarker = ({
  markers,
  geoJSON,
  i,
  alphabets,
}: PointAnnotationMarkerProps): JSX.Element[] => {
  const annotationRefList = useRef<MapboxGL.PointAnnotation[] | null>([]);

  let onePolygon = geoJSON.features[i];

  useEffect(() => {
    annotationRefList.current = annotationRefList.current.slice(
      0,
      onePolygon.geometry.coordinates.length,
    );
  }, [onePolygon.geometry.coordinates]);

  for (let j = 0; j < onePolygon.geometry.coordinates.length; j++) {
    let oneMarker = onePolygon.geometry.coordinates[j];
    markers.push(
      <MapboxGL.PointAnnotation
        key={`${i}${j}`}
        id={`${i}${j}`}
        coordinate={oneMarker}
        ref={(el) => {
          annotationRefList.current[j] = el;
        }}>
        <MarkerSVG point={alphabets[j]} color={Colors.PRIMARY} />
      </MapboxGL.PointAnnotation>,
    );
  }
  return markers;
};

export default Markers;
