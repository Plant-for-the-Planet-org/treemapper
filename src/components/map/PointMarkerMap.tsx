import { StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import CustomButton from '../common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import ActiveMarkerIcon from '../common/ActiveMarkerIcon'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { StackNavigationProp } from '@react-navigation/stack'
import { SampleTree } from 'src/types/interface/slice.interface'
import { v4 as uuid } from 'uuid'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import { updateSampleTreeCoordinates } from 'src/store/slice/sampleTreeSlice'
import MapShapeSource from './MapShapeSource'
import i18next from 'i18next'
import AlertModal from '../common/AlertModal'
import {
  isPointInPolygon,
  validateMarkerForSampleTree,
} from 'src/utils/helpers/turfHelpers'
import MapMarkers from './MapMarkers'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { useToast } from 'react-native-toast-notifications'
import getUserLocation from 'src/utils/helpers/getUserLocation'
import { errorHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { INTERVENTION_TYPE } from 'src/types/type/app.type'
import MapLibreGL from '@maplibre/maplibre-react-native'
import SatelliteIconWrapper from './SatelliteIconWrapper'
import SatelliteLayer from 'assets/mapStyle/satelliteView'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

interface Props {
  form_id: string
  interventionKey: INTERVENTION_TYPE
  tree_details: SampleTree[]
}

const PointMarkerMap = (props: Props) => {

  const { tree_details, interventionKey, form_id } = props
  const [geoJSON, setGeoJSON] = useState(null)
  const [alertModal, setAlertModal] = useState(false)
  const [outOfBoundary, setOutOfBoundary] = useState(false)
  const [loading, setLoading] = useState(true)
  const MapBounds = useSelector((state: RootState) => state.mapBoundState)
  const { boundary } = useSelector((state: RootState) => state.sampleTree)
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const mainMapView = useSelector(
    (state: RootState) => state.displayMapState.mainMapView
  )
  const { updateInterventionLocation } = useInterventionManagement()
  const dispatch = useDispatch()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const toast = useToast()

  const cameraRef = useRef<MapLibreGL.Camera>(null)
  const mapRef = useRef<MapLibreGL.MapView>(null)

  const { species_required, is_multi_species, has_sample_trees } = setUpIntervention(interventionKey)


  useEffect(() => {
    handleCameraViewChange()
  }, [MapBounds, currentUserLocation])

  const handleCameraViewChange = () => {
    if (cameraRef?.current) {
      const { bounds, key } = MapBounds
      if (key === 'POINT_MAP') {
        cameraRef.current.fitBounds(
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
          40,
          1000,
        )
      } else {
        handleCamera()
      }
    }
  }

  const handleCamera = () => {
    cameraRef.current.setCamera({
      centerCoordinate: [...currentUserLocation],
      zoomLevel: 20,
      animationDuration: 1000,
    })
  }

  const getMarkerJSON = () => {
    const data = makeInterventionGeoJson('Polygon', boundary, uuid(), { key: interventionKey })
    setGeoJSON(data.geoJSON)
  }


  useEffect(() => {
    if (has_sample_trees) {
      getMarkerJSON()
    }
  }, [boundary])





  const onSelectLocation = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
    if (has_sample_trees) {
      dispatch(updateSampleTreeCoordinates([centerCoordinates]))
    } else {
      const { coordinates } = makeInterventionGeoJson('Point', [centerCoordinates], '')
      const result = await updateInterventionLocation(form_id, { type: 'Point', coordinates: coordinates }, false)
      if (!result) {
        errorHaptic()
        toast.show("Error occurred while updating intervention location")
        return;
      }
    }
    if (species_required) {
      if (is_multi_species) {
        navigation.navigate('TotalTrees', { isSelectSpecies: true, interventionId: form_id })
      } else {
        navigation.navigate('ManageSpecies', { manageSpecies: false, id: form_id })
      }
    } else {
      navigation.navigate('LocalForm', { id: form_id })
    }
  }

  const handleAccuracyAlert = (b: boolean) => {
    if (b) {
      setAlertModal(false)
    } else {
      setAlertModal(false)
      onSelectLocation()
    }
  }

  const checkForAccuracy = async () => {
    const { accuracy } = getUserLocation()
    if (accuracy >= 30) {
      setAlertModal(true)
    } else {
      onSelectLocation()
    }
  }

  const handleMarkerValidation = (coords: number[]) => {
    if (has_sample_trees) {
      const isValidPoint = validateMarkerForSampleTree(
        coords,
        tree_details,
      )
      return isValidPoint;
    } else {
      return true;
    }
  }


  const handleDrag = async () => {
    setLoading(false)
    if (has_sample_trees) {
      const centerCoordinates = await mapRef.current.getCenter()
      const validMarker = isPointInPolygon(centerCoordinates, geoJSON)
      const validSampleTree = handleMarkerValidation(centerCoordinates)
      if (!validSampleTree) {
        errorHaptic()
        toast.show("Point is very close to already registered sample tree.", {
          type: "normal",
          placement: "bottom",
          duration: 2000,
          animationType: "slide-in",
        })
      }
      if (!validSampleTree || !validMarker) {
        errorHaptic()
        setOutOfBoundary(true)
      } else {
        setOutOfBoundary(false)
      }
    }
  }

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        ref={mapRef}
        logoEnabled={false}
        attributionEnabled={false}
        onRegionDidChange={handleDrag}
        onDidFinishLoadingMap={handleCameraViewChange}
        onRegionIsChanging={() => {
          setLoading(true)
        }}
        styleURL={JSON.stringify(mainMapView === 'SATELLITE' ? SatelliteLayer : MapStyle)}>
        <MapLibreGL.Camera ref={cameraRef} />
        <MapLibreGL.UserLocation
          showsUserHeadingIndicator
          androidRenderMode="gps"
          minDisplacement={1}
        />
        {geoJSON && (
          <MapShapeSource
            geoJSON={[geoJSON]}
            onShapeSourcePress={() => { }}
            showError={outOfBoundary}
          />
        )}
        {has_sample_trees && <MapMarkers
          hasSampleTree={has_sample_trees}
          sampleTreeData={tree_details} />}
      </MapLibreGL.MapView>
      <SatelliteIconWrapper low />
      <CustomButton
        label="Select location & Continue"
        containerStyle={styles.btnContainer}
        pressHandler={checkForAccuracy}
        loading={loading}
        disable={loading || outOfBoundary}
      />
      <ActiveMarkerIcon />
      <AlertModal
        visible={alertModal}
        heading={i18next.t('label.poor_accuracy')}
        message={i18next.t('label.poor_accuracy_message')}
        primaryBtnText={i18next.t('label.try_again')}
        secondaryBtnText={i18next.t('label.continue')}
        onPressPrimaryBtn={handleAccuracyAlert}
        onPressSecondaryBtn={handleAccuracyAlert}
        showSecondaryButton={true}
      />
    </View>
  )
}

export default PointMarkerMap

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
  btnContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    height: scaleSize(70),
  },
})
