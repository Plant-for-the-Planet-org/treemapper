import MapboxGL from '@react-native-mapbox-gl/maps';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Config from 'react-native-config';
import { Colors } from '../../../styles';
import { ON_SITE } from '../../../utils/inventoryConstants';
import { toLetters } from '../../../utils/mapMarkingCoordinate';
import MarkerSVG from '../../Common/MarkerSVG';

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
interface MarkersProps {
  geoJSON: geoJSONType;
  setCoordinateModalShow: React.Dispatch<React.SetStateAction<boolean>>;
  setCoordinateIndex: React.Dispatch<React.SetStateAction<number | null | undefined>>;
  onPressMarker: (isSampleTree: boolean, coordinate: []) => void;
  setIsSampleTree: React.Dispatch<React.SetStateAction<boolean | null>>;
  locateTree: string;
}
const Markers = ({
  geoJSON,
  setCoordinateModalShow,
  setCoordinateIndex,
  onPressMarker,
  setIsSampleTree,
  locateTree,
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
        setCoordinateModalShow={setCoordinateModalShow}
        setCoordinateIndex={setCoordinateIndex}
        onPressMarker={onPressMarker}
        setIsSampleTree={setIsSampleTree}
        locateTree={locateTree}
      />
    );
  }
  return markers;
};

interface PointAnnotationMarkerProps {
  markers: JSX.Element[];
  geoJSON: geoJSONType;
  i: number;
  alphabets: string[];
  setCoordinateModalShow: React.Dispatch<React.SetStateAction<boolean>>;
  setCoordinateIndex: React.Dispatch<React.SetStateAction<number | null | undefined>>;
  onPressMarker: (isSampleTree: boolean, coordinate: []) => void;
  setIsSampleTree: React.Dispatch<React.SetStateAction<boolean | null>>;
  locateTree: string;
}

const PointAnnotationMarker = ({
  markers,
  geoJSON,
  i,
  alphabets,
  setCoordinateModalShow,
  setCoordinateIndex,
  onPressMarker,
  setIsSampleTree,
  locateTree,
}: PointAnnotationMarkerProps): JSX.Element[] => {
  const [activeAnnotationIndex, setActiveAnnotationIndex] = useState<number>(-1);
  const [previousActiveAnnotationIndex, setPreviousActiveAnnotationIndex] = useState<number>(-1);
  const [backgroundColor, setBackgroundColor] = useState<string>('blue');
  const [coordinates, setCoordinates] = useState([]);

  const annotationRefList = useRef<MapboxGL.PointAnnotation[] | null>([]);
  const calloutRefList = useRef<MapboxGL.Callout[] | null>([]);
  let scaleIn;
  let scaleOut;
  let onePolygon = geoJSON.features[i];

  useEffect(() => {
    annotationRefList.current = annotationRefList.current.slice(
      0,
      onePolygon.geometry.coordinates.length,
    );
    calloutRefList.current = calloutRefList.current.slice(
      0,
      onePolygon.geometry.coordinates.length,
    );
  }, [onePolygon.geometry.coordinates]);

  const onAnnotationSelected = (activeIndex, feature) => {
    if (activeAnnotationIndex === activeIndex) {
      return;
    }

    scaleIn = new Animated.Value(0.6);
    Animated.timing(scaleIn, { toValue: 1.0, duration: 200 }).start();
    // setState({ activeAnnotationIndex: activeIndex });
    setActiveAnnotationIndex(activeIndex);

    if (previousActiveAnnotationIndex !== -1) {
      // this._map.moveTo(feature.geometry.coordinates, 500);
    }
  };

  if (onePolygon.geometry.type === 'Point') {
    markers.push(
      <MapboxGL.PointAnnotation
        key={`${i}-point`}
        id={`${i}-point`}
        title="Test"
        coordinate={onePolygon.geometry.coordinates}
        // selected={i === 0}
        ref={(el) => {
          annotationRefList.current[i] = el;
        }}
        // onSelected={(feature) => onAnnotationSelected(i, feature)}
        // onDeselected={() => onAnnotationDeselected(i)}
      >
        <MarkerSVG point={alphabets[i]} color={Colors.PRIMARY} />
        {/* <MapboxGL.Callout title={'Marker'}>
          <View style={{ borderWidth: 1, height: 30, width: 60, borderColor: '#c7271c' }}>
            <Text>Something</Text>
          </View>
        </MapboxGL.Callout> */}
        <View style={styles.annotationContainer} />
        <MapboxGL.Callout title="This is a sample with image" />
      </MapboxGL.PointAnnotation>,
    );
  } else {
    for (let j = 0; j < onePolygon.geometry.coordinates.length; j++) {
      let oneMarker = onePolygon.geometry.coordinates[j];
      markers.push(
        <MapboxGL.PointAnnotation
          key={`${i}${j}`}
          id={`${i}${j}`}
          coordinate={oneMarker}
          ref={(el) => {
            annotationRefList.current[j] = el;
          }}
          onSelected={(feature) => {
            if (locateTree == ON_SITE) {
              onPressMarker(false, feature.geometry.coordinates);
              setCoordinateIndex(j);
              setIsSampleTree(false);
              setCoordinateModalShow(true);
            }
          }}
          // onDeselected={() => {
          //   setCoordinateModalShow(false);
          // }}
        >
          <MarkerSVG point={alphabets[j]} color={Colors.PRIMARY} />
          {/* <View style={styles.annotationContainer}>
            <Image
              source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
              style={{ width: ANNOTATION_SIZE, height: ANNOTATION_SIZE }}
              onLoad={() => {
                annotationRefList.current[j].refresh();
              }}
            />
          </View> */}
          {/* <MapboxGL.Callout
            ref={(el) => {
              calloutRefList.current[j] = el;
            }}>
            <View
              style={{
                // flex: 1,
                borderWidth: 1,
                height: 200,
                width: 450,
                borderColor: 'black',
                backgroundColor: 'pink',
              }}>
              <Svg
                xmlns="http://www.w3.org/2000/svg"
                width="100"
                height="100"
                viewBox="0 0 100 100">
                <Image x="0" y="0" width="50" height="50" href={species_default} />
              </Svg>

              <Text>Something</Text>
            </View>
          </MapboxGL.Callout> */}
        </MapboxGL.PointAnnotation>,
      );
    }
  }

  return markers;
};
const ANNOTATION_SIZE = 45;

const styles = StyleSheet.create({
  // annotationContainer: {
  //   width: ANNOTATION_SIZE,
  //   height: ANNOTATION_SIZE,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   backgroundColor: 'white',
  //   borderRadius: ANNOTATION_SIZE / 2,
  //   borderWidth: StyleSheet.hairlineWidth,
  //   borderColor: 'rgba(0, 0, 0, 0.45)',
  // },
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
    // alignSelf: 'center',
    // marginVertical: 20,
    width: 150,
    height: 100,
    borderRadius: 5,
    // resizeMode: 'contain',
    borderWidth: 2,
    borderColor: 'green',
  },
});

export default Markers;
