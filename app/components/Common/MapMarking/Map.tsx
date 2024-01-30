import React from 'react';
import Config from 'react-native-config';
import { SvgXml } from 'react-native-svg';
import MapLibreGL, { Logger } from '@maplibre/maplibre-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import Markers from '../Markers';
import { active_marker } from '../../../assets';
import { Colors, Typography } from '../../../styles';
import SampleTreeMarkers from '../SampleTreeMarkers';
import { MULTI, SAMPLE } from '../../../utils/inventoryConstants';

const IS_ANDROID = Platform.OS === 'android';

const mapStyle = JSON.stringify(require('../../../assets/mapStyle/mapStyleOutput.json'));

MapLibreGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

Logger.setLogCallback(log => {
  const { message } = log;
  // expected warnings - see https://github.com/mapbox/mapbox-gl-native/issues/15341#issuecomment-522889062
  if (
    message.match('Request failed due to a permanent error: Canceled') ||
    message.match('Request failed due to a permanent error: Socket Closed')
  ) {
    return true;
  }
  return false;
});

let attributionPosition: any = {
  bottom: IS_ANDROID ? 160 : 85,
  left: IS_ANDROID ? 30 : 20,
};

interface IMapProps {
  geoJSON?: any;
  treeType?: any;
  setLoader?: any;
  map?: any;
  camera?: any;
  setIsCameraRefVisible?: any;
  location?: any;
  loader?: any;
  markerText?: any;
  activePolygonIndex?: any;
  setLocation?: any;
}

export default function Map({
  geoJSON,
  treeType,
  setLoader,
  map,
  camera,
  setIsCameraRefVisible,
  location,
  loader,
  markerText,
  activePolygonIndex,
  setLocation,
}: IMapProps) {
  let shouldRenderShape = geoJSON.features[activePolygonIndex].geometry.coordinates.length > 1;
  const onChangeRegionStart = () => setLoader(true);

  const onChangeRegionComplete = () => {
    setLoader(false);
  };

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.container}
        ref={map}
        compassViewPosition={3}
        compassViewMargins={{
          x: 30,
          y: 230,
        }}
        attributionPosition={attributionPosition}
        styleJSON={mapStyle}
        onRegionWillChange={onChangeRegionStart}
        onRegionDidChange={onChangeRegionComplete}>
        {(treeType === MULTI || treeType === SAMPLE) && (
          <Markers geoJSON={geoJSON} type={'LineString'} />
        )}
        {treeType === SAMPLE && <SampleTreeMarkers geoJSON={geoJSON} />}

        <MapLibreGL.Camera
          ref={el => {
            camera.current = el;
            setIsCameraRefVisible(!!el);
          }}
        />
        {(treeType === MULTI || treeType === SAMPLE) && shouldRenderShape && (
          <MapLibreGL.ShapeSource id={'polygon'} shape={geoJSON}>
            <MapLibreGL.LineLayer id={'polyline'} style={polyline} />
          </MapLibreGL.ShapeSource>
        )}
        {location && (
          <MapLibreGL.UserLocation showsUserHeadingIndicator onUpdate={data => setLocation(data)} />
        )}
      </MapLibreGL.MapView>

      <View style={styles.fakeMarkerCont}>
        <SvgXml xml={active_marker} style={styles.markerImage} />
        {treeType === MULTI ? (
          loader ? (
            <ActivityIndicator color={Colors.WHITE} style={styles.loader} />
          ) : (
            <Text style={styles.activeMarkerLocation}>{markerText}</Text>
          )
        ) : (
          []
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  fakeMarkerCont: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImage: {
    position: 'absolute',
    resizeMode: 'contain',
    bottom: 0,
  },
  markerContainer: {
    width: 30,
    height: 43,
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
  loader: {
    position: 'absolute',
    bottom: 67,
  },
  activeMarkerLocation: {
    position: 'absolute',
    bottom: 67,
    color: Colors.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const polyline = { lineWidth: 2, lineColor: Colors.BLACK };
