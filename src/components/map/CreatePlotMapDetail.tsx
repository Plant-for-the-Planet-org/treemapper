import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import ActiveMarkerIcon from '../common/ActiveMarkerIcon';
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import CustomButton from '../common/CustomButton';
import * as turf from '@turf/turf'
import { PLOT_SHAPE } from 'src/types/type/app.type';
import PlotShapeSource from './PlotShapeSource';
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement';
import { Typography, Colors } from 'src/utils/constants';
import { scaleSize, scaleFont } from 'src/utils/constants/mixins';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';
import { useToast } from 'react-native-toast-notifications';
import bbox from '@turf/bbox'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper';
import { PlantedPlotSpecies } from 'src/types/interface/slice.interface';
import { isPointInPolygon, validateMarkerForSampleTree } from 'src/utils/helpers/turfHelpers';
import PlotMarker from './PlotMarker';
import i18next from 'src/locales/index'


// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')


interface Props {
  plot_shape: PLOT_SHAPE,
  radius: number,
  length: number,
  width: number,
  plotId: string
  initialPolygon: Array<number[]>
  isMarking?: boolean
  plantId?: string
  plantedTrees?: PlantedPlotSpecies[]
  isEdit: boolean
  showNewDimensionModal: () => void
}


const CreatePlotMapDetail = (props: Props) => {
  const { showNewDimensionModal, isEdit, plot_shape, radius, length, width, plotId, initialPolygon, isMarking, plantId, plantedTrees } = props
  const cameraRef = useRef<MapLibreGL.CameraRef>(null)
  const mapRef = useRef<MapLibreGL.MapViewRef>(null)
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const [plotCoordinates, setPlotCoordinates] = useState<Array<number[]>>([])
  const [updatedCoords, setUpdatedCoords] = useState<Array<number[]>>([])
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { updatePlotLocation, updatePlotPlantLocation } = useMonitoringPlotManagement()
  const [loading, setLoading] = useState(false)
  const toast = useToast()



  useEffect(() => {
    if (currentUserLocation && cameraRef.current !== null) {
      handleCamera()
    }
  }, [currentUserLocation])


  useEffect(() => {
    if (initialPolygon?.length) {
      setPlotCoordinates(initialPolygon)
    }
  }, [initialPolygon, isEdit])

  useEffect(() => {
    if (plotCoordinates.length > 0) {
      setTimeout(() => {
        setBounds()
      }, 300);
    }
  }, [plotCoordinates])


  const setBounds = () => {
    // @ts-expect-error: Property 'foo' does not exist on type 'Bar'.
    const { geoJSON } = makeInterventionGeoJson('Polygon', plotCoordinates[0], '');
    const bounds = bbox(geoJSON)
    cameraRef.current.fitBounds(
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
      20,
      1000,
    )
  }

  const handleCamera = () => {
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
    // Calculate the four corners
    const topCenter = calculateCorner(center, halfLength, 0);
    const bottomCenter = calculateCorner(center, halfLength, 180);

    const topLeft = calculateCorner(topCenter, halfWidth, 270);
    const topRight = calculateCorner(topCenter, halfWidth, 90);
    const bottomLeft = calculateCorner(bottomCenter, halfWidth, 270);
    const bottomRight = calculateCorner(bottomCenter, halfWidth, 90);
    return [topRight, bottomRight, bottomLeft, topLeft, topRight]
  }

  const getCircularCoords = (center: number[]) => {
    const circleGeoJSON = turf.circle(center, radius, {
      steps: 100, // Number of steps to approximate the circle (higher number = smoother circle)
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
    if (isEdit) {
      setUpdatedCoords([updatedCoords])
    } else {
      setPlotCoordinates([updatedCoords])
    }
  }


  const setSampleMarker = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
    const validMarker = isPointInPolygon(centerCoordinates, {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": plotCoordinates,
        "type": "Polygon"
      }
    })
    if (!validMarker) {
      toast.show('Selected point is outside polygon')
      return
    }

    const isValidPoint = validateMarkerForSampleTree(
      centerCoordinates,
      plantedTrees,
    )
    if (!isValidPoint) {
      toast.show('Selected point is close to already existing point')
      return
    }
    await updatePlotPlantLocation(plotId, plantId, centerCoordinates[1], centerCoordinates[0])
    navigation.replace("PlotDetails", { id: plotId })
  }

  const continueForm = async () => {
    const result = await updatePlotLocation(plotId, plotCoordinates, false)
    if (result) {
      navigation.replace("PlotDetails", { id: plotId })
    } else {
      toast.show('Error showing result')
    }
  }

  const checkForWithinPolygon = async (geoJSON) => {
    for (const el of plantedTrees) {
      const validMarker = isPointInPolygon([el.longitude, el.latitude], geoJSON);
      if (!validMarker) {
        return false;
      }
    }
    return true;
  };



  const continueUPdateForm = async () => {
    const isValid = await checkForWithinPolygon({
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": updatedCoords,
        "type": "Polygon"
      }
    })
    if (!isValid) {
      toast.show("Previously marked points are not within new location")
      return
    }
    const result = await updatePlotLocation(plotId, updatedCoords, isEdit, {
      h: length,
      w: width,
      r: radius
    })
    if (result) {
      navigation.replace("PlotDetails", { id: plotId })
    } else {
      toast.show('Error showing result')
    }
  }

  const handlePress = () => {
    setUpdatedCoords([])
    showNewDimensionModal()
  }


  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        ref={mapRef}
        logoEnabled={false}
        attributionEnabled={false}
        onRegionDidChange={() => {
          setLoading(false)
        }}
        onDidFinishLoadingMap={handleCamera}
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
        {plotCoordinates.length > 0 && <PlotShapeSource
          isEdit={isEdit}
          geoJSON={{
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "properties": {},
                "geometry": {
                  "coordinates": plotCoordinates,
                  "type": "Polygon"
                }
              }
            ]
          }} />}
        {updatedCoords.length > 0 && <PlotShapeSource
          isEdit={false}
          geoJSON={{
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "properties": {},
                "geometry": {
                  "coordinates": updatedCoords,
                  "type": "Polygon"
                }
              }
            ]
          }} />}
        {plantedTrees.length > 0 && <PlotMarker sampleTreeData={plantedTrees} onMarkerPress={() => { }} />}
      </MapLibreGL.MapView>
      {plotCoordinates.length === 0 || isMarking ? <ActiveMarkerIcon /> : null}
      {isEdit ? <ActiveMarkerIcon /> : null}

      {plotCoordinates.length > 0 && !isMarking && !isEdit ? (
        <View style={styles.btnFooter}>
          <CustomButton
            label={i18next.t('label.reset')}
            containerStyle={styles.btnWrapper}
            pressHandler={() => { setPlotCoordinates([]) }}
            wrapperStyle={styles.borderWrapper}
            labelStyle={styles.highlightLabel}
          />
          <CustomButton
            label={i18next.t('label.continue')}
            containerStyle={styles.btnWrapper}
            pressHandler={continueForm}
            wrapperStyle={styles.opaqueWrapper}
            labelStyle={styles.normalLabel}
          />
        </View>
      ) : null}

      {isMarking && (
        <CustomButton
          label={"Save & Continue"}
          containerStyle={styles.btnContainer}
          pressHandler={setSampleMarker}
          disable={loading}
          loading={loading}
        />
      )}

      {plotCoordinates.length === 0 || isEdit && updatedCoords.length === 0 ? (
        <CustomButton
        label={i18next.t('label.select_center')}
        containerStyle={styles.btnContainer}
          pressHandler={handleContinuePress}
          disable={loading}
          loading={loading}
        />
      ) : null}

      {updatedCoords.length && isEdit ? (
        <View style={styles.btnFooter}>
          <CustomButton
            label="Reset"
            containerStyle={styles.btnWrapper}
            pressHandler={handlePress}
            wrapperStyle={styles.borderWrapper}
            labelStyle={styles.highlightLabel}
          />
          <CustomButton
            label="Save"
            containerStyle={styles.btnWrapper}
            pressHandler={continueUPdateForm}
            wrapperStyle={styles.opaqueWrapper}
            labelStyle={styles.normalLabel}
          />
        </View>
      ) : null}
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
    bottom: 20,
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnContainer: {
    position: 'absolute',
    bottom: 30,
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
  normalLabel: {
    fontSize: scaleFont(16),
    color: Colors.WHITE,
    textAlign: 'center',
    fontFamily: Typography.FONT_FAMILY_BOLD
  },
});