import MapboxGL from '@react-native-mapbox-gl/maps';
import Logger from '@react-native-mapbox-gl/maps/javascript/utils/Logger';
import React, { useState, createRef, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import Config from 'react-native-config';
import { SvgXml, Svg } from 'react-native-svg';
import { MULTI, SAMPLE } from '../../../utils/inventoryConstants';
import { active_marker, marker_png } from '../../../assets';
import { Colors, Typography } from '_styles';
import SampleTreeMarkers from '../SampleTreeMarkers';
import Markers from '../Markers';
MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);
const IS_ANDROID = Platform.OS === 'android';

Logger.setLogCallback((log) => {
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
}) {
  let shouldRenderShape = geoJSON.features[activePolygonIndex].geometry.coordinates.length > 1;
  console.log(JSON.stringify(geoJSON), 'geoJSON');
  const onChangeRegionStart = () => setLoader(true);

  const onChangeRegionComplete = () => {
    setLoader(false);
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        showUserLocation={true}
        style={styles.container}
        ref={map}
        compassViewPosition={3}
        compassViewMargins={{
          x: 30,
          y: 230,
        }}
        logo
        onRegionWillChange={onChangeRegionStart}
        onRegionDidChange={onChangeRegionComplete}>
        {(treeType === MULTI || treeType === SAMPLE) && <Markers geoJSON={geoJSON} />}
        {treeType === SAMPLE && <SampleTreeMarkers geoJSON={geoJSON} />}

        <MapboxGL.Camera
          ref={(el) => {
            camera.current = el;
            setIsCameraRefVisible(!!el);
          }}
        />
        {(treeType === MULTI || treeType === SAMPLE) && shouldRenderShape && (
          <MapboxGL.ShapeSource id={'polygon'} shape={geoJSON}>
            <MapboxGL.LineLayer id={'polyline'} style={polyline} />
            {/* <MapboxGL.SymbolLayer
              id="asd"
              sourceID="polygon"
              style={{
                iconSize: 1,
                iconAllowOverlap: true,
              }}>
              <View
                style={{ height: 40, width: 40 }}
                pointerEvents="none" // this is important for the onPress prop of ShapeSource to work
              >
                <SvgXml xml={active_marker} style={styles.markerImage} />

                <Text>something</Text>
              </View>
            </MapboxGL.SymbolLayer> */}
          </MapboxGL.ShapeSource>
        )}
        {location && (
          <MapboxGL.UserLocation showsUserHeadingIndicator onUpdate={(data) => setLocation(data)} />
        )}
      </MapboxGL.MapView>

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
