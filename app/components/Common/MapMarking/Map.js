import MapboxGL from '@react-native-mapbox-gl/maps';
import React from 'react';
import { StyleSheet, View, ImageBackground, Text, ActivityIndicator } from 'react-native';
import Config from 'react-native-config';
import { SvgXml } from 'react-native-svg';
import { MULTI, SAMPLE } from '../../../utils/inventoryConstants';
import { active_marker, marker_png } from '../../../assets';
import { Colors, Typography } from '_styles';

MapboxGL.setAccessToken(Config.MAPBOXGL_ACCCESS_TOKEN);

export default function Map({
  geoJSON,
  treeType,
  setLoader,
  map,
  camera,
  setIsCameraRefVisible,
  updateCurrentPosition,
  location,
  loader,
  markerText,
  activePolygonIndex,
  alphabets,
}) {
  let shouldRenderShape = geoJSON.features[activePolygonIndex].geometry.coordinates.length > 1;

  const onChangeRegionStart = () => setLoader(true);

  const onChangeRegionComplete = () => setLoader(false);

  const Markers = () => {
    const markers = [];
    for (let i = 0; i < geoJSON.features.length; i++) {
      let onePolygon = geoJSON.features[i];

      for (let j = 0; j < onePolygon.geometry.coordinates.length; j++) {
        let oneMarker = onePolygon.geometry.coordinates[j];
        markers.push(
          <MapboxGL.PointAnnotation key={`${i}${j}`} id={`${i}${j}`} coordinate={oneMarker}>
            <ImageBackground
              source={marker_png}
              style={styles.markerContainer}
              resizeMode={'cover'}>
              <Text style={styles.markerText}>{alphabets[j]}</Text>
            </ImageBackground>
          </MapboxGL.PointAnnotation>,
        );
      }
    }
    return markers;
  };

  const SampleTreeMarkers = () => {
    const markers = [];
    for (let i = 1; i < geoJSON.features.length; i++) {
      let onePoint = geoJSON.features[i];

      let oneMarker = onePoint.geometry.coordinates;
      markers.push(
        <MapboxGL.PointAnnotation
          key={`sampleTree-${i}`}
          id={`sampleTree-${i}`}
          coordinate={oneMarker}>
          <ImageBackground source={marker_png} style={styles.markerContainer} resizeMode={'cover'}>
            <Text style={styles.markerText}>#{i}</Text>
          </ImageBackground>
        </MapboxGL.PointAnnotation>,
      );
    }
    return markers;
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
        {treeType === MULTI && Markers()}
        {treeType === SAMPLE && SampleTreeMarkers()}

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
          <MapboxGL.UserLocation showsUserHeadingIndicator onUpdate={updateCurrentPosition} />
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
