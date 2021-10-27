import MapboxGL from '@react-native-mapbox-gl/maps';
import Logger from '@react-native-mapbox-gl/maps/javascript/utils/Logger';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Config from 'react-native-config';
import { SvgXml } from 'react-native-svg';
import { active_marker } from '../../../assets';
import { Colors, Typography } from '../../../styles';
import { MULTI, SAMPLE } from '../../../utils/inventoryConstants';
import Markers from '../Markers';
import SampleTreeMarkers from '../SampleTreeMarkers';
MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

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
        {(treeType === MULTI || treeType === SAMPLE) && (
          <Markers geoJSON={geoJSON} type={'LineString'} />
        )}
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
