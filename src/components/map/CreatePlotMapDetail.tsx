import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapLibreGL, { Camera } from '@maplibre/maplibre-react-native';
import ActiveMarkerIcon from '../common/ActiveMarkerIcon';
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import CustomButton from '../common/CustomButton';
import * as turf from '@turf/turf'
import { PLOT_SHAPE } from 'src/types/type/app.type';
import PlotShapeSource from './PlotShapeSource';
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement';
import { Typography, Colors } from 'src/utils/constants';
import { scaleSize, scaleFont } from 'src/utils/constants/mixins';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';
import { useToast } from 'react-native-toast-notifications';
import bbox from '@turf/bbox'


// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')


interface Props {
  plot_shape: PLOT_SHAPE,
  radius: number,
  length: number,
  width: number,
  plotId: string
}


const CreatePlotMapDetail = (props: Props) => {
  const { plot_shape, radius, length, width, plotId } = props
  const cameraRef = useRef<Camera>(null)
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const [plotCoordinates, setPlotCoordinates] = useState<Array<number[]>>([])
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { updatePlotLocation } = useMonitoringPlotMangement()
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (currentUserLocation && cameraRef.current !== null) {
      handleCamera()
    }
  }, [currentUserLocation])


  const handleCamera = () => {
    if (plotCoordinates.length > 0) {
      const bounds = bbox({
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "coordinates": [...plotCoordinates],
              "type": "Polygon"
            }
          }
        ]
      })
      cameraRef.current.fitBounds(
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
        20,
        1000,
      )
    }
    cameraRef.current.setCamera({
      centerCoordinate: [...currentUserLocation],
      zoomLevel: 20,
      animationDuration: 1000,
    })
  }

  const calculateCorner = (center: number[], distance: number, bearing: number) => {
    const point = turf.point(center);
    return turf.destination(point, distance, bearing, { units: 'meters' }).geometry.coordinates;
  }

  const getPolygonCoords = (center: number[]) => {
    const lengthMeters = length;
    const widthMeters = width;
    const halfLength = lengthMeters / 2;
    const halfWidth = widthMeters / 2;
    const bottomLeft = calculateCorner(center, Math.sqrt(halfLength ** 2 + halfWidth ** 2), -135);
    const bottomRight = calculateCorner(center, Math.sqrt(halfLength ** 2 + halfWidth ** 2), -45);
    const topRight = calculateCorner(center, Math.sqrt(halfLength ** 2 + halfWidth ** 2), 45);
    const topLeft = calculateCorner(center, Math.sqrt(halfLength ** 2 + halfWidth ** 2), 135);
    return [bottomLeft, bottomRight, topRight, topLeft, bottomLeft]
  }

  const getCircularCoords = (center: number[]) => {
    const circleGeoJSON = turf.circle(center, radius, {
      steps: 64, // Number of steps to approximate the circle (higher number = smoother circle)
      units: 'meters' // Units for the radius
    });
    return circleGeoJSON.geometry.coordinates[0]
  }

  const handleContinuePress = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
    let updatedCoords = []
    if (plot_shape === 'CIRCULAR') {
      updatedCoords = getCircularCoords(centerCoordinates)
    } else {
      updatedCoords = getPolygonCoords(centerCoordinates)
    }
    setPlotCoordinates([updatedCoords])
  }

  const continueForm = async () => {
    const result = await updatePlotLocation(plotId, plotCoordinates)
    if (result) {
      navigation.replace("PlotDetails", { id: plotId })
    } else {
      toast.show('Error showing result')
    }
  }

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        ref={mapRef}
        logoEnabled={false}
        onDidFinishRenderingMapFully={() => { handleCamera() }}
        attributionEnabled={false}
        onRegionDidChange={() => {
          setLoading(false)
        }}
        onRegionIsChanging={() => {
          setLoading(true)
        }}
        styleURL={JSON.stringify(MapStyle)}>
        <MapLibreGL.Camera ref={cameraRef} />
        <MapLibreGL.UserLocation
          showsUserHeadingIndicator
          androidRenderMode="gps"
          minDisplacement={1}
        />
        {plotCoordinates.length > 0 && <PlotShapeSource geoJSON={{
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "properties": {},
              "geometry": {
                "coordinates": [...plotCoordinates],
                "type": "Polygon"
              }
            }
          ]
        }} />}
      </MapLibreGL.MapView>
      {plotCoordinates.length === 0 && <ActiveMarkerIcon />}
      {plotCoordinates.length > 0 && (
        <View style={styles.btnFooter}>
          <CustomButton
            label="Reset"
            containerStyle={styles.btnWrapper}
            pressHandler={() => { setPlotCoordinates([]) }}
            wrapperStyle={styles.borderWrapper}
            labelStyle={styles.highlightLabel}
          />
          <CustomButton
            label="Continue"
            containerStyle={styles.btnWrapper}
            pressHandler={continueForm}
            wrapperStyle={styles.opaqueWrapper}
            labelStyle={styles.normalLable}
          />
        </View>
      )}

      {plotCoordinates.length === 0 && (
        <CustomButton
          label="Select center of plot"
          containerStyle={styles.btnContainer}
          pressHandler={handleContinuePress}
          disable={loading}
          loading={loading}
        />
      )}
    </View>
  );
}

export default CreatePlotMapDetail

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
    alignSelf: 'stretch',
  },

  btnFooter: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: scaleSize(70),
  },
  btnWrapper: {
    flex: 1,
    height: '100%',
  },
  borderWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '70%',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.PRIMARY_DARK,
  },
  opaqueWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '70%',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 12,
  },
  highlightLabel: {
    fontSize: scaleFont(16),
    color: Colors.PRIMARY_DARK,
    fontFamily: Typography.FONT_FAMILY_BOLD
  },
  normalLable: {
    fontSize: scaleFont(16),
    color: Colors.WHITE,
    textAlign: 'center',
    fontFamily: Typography.FONT_FAMILY_BOLD
  },
});