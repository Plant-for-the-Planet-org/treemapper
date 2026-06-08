import { StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import CustomButton from '../common/CustomButton'
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
import { Map, Camera, CameraRef, MapRef, UserLocation, Marker } from '@maplibre/maplibre-react-native'
import SatelliteIconWrapper from './SatelliteIconWrapper'
import SatelliteLayer from 'assets/mapStyle/satelliteView'
import MapZoomScale from './MapZoomScale'
import SiteMapSource from './SiteMapSource'
import MapPin from 'assets/images/svg/MapPin.svg'
import { Colors } from 'src/utils/constants'


// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

interface Props {
  form_id: string
  interventionKey: INTERVENTION_TYPE
  tree_details: SampleTree[]
  siteId?: string
}

const PointMarkerMap = (props: Props) => {
  const { tree_details, interventionKey, form_id, siteId } = props
  const [geoJSON, setGeoJSON] = useState(null)
  const [alertModal, setAlertModal] = useState(false)
  const [outOfBoundary, setOutOfBoundary] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCoordinate, setSelectedCoordinate] = useState<[number, number] | null>(null)
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

  const cameraRef = useRef<CameraRef>(null)
  const mapRef = useRef<MapRef>(null)

  const { species_required, is_multi_species, has_sample_trees } = setUpIntervention(interventionKey)
  const [mapRender, setMapRender] = useState(false)


  useEffect(() => {
    if (!mapRender) {
      const timer = setTimeout(() => {
        handleCameraViewChange()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [MapBounds])


  // Pressing the GPS button updates currentUserLocation (via redux). When it
  // does, re-center the camera AND drop the pin on the user's GPS position.
  useEffect(() => {
    if (mapRender) {
      handleCamera2()
    }
    if (currentUserLocation && currentUserLocation[0] !== 0) {
      placePin([currentUserLocation[0], currentUserLocation[1]])
    }
  }, [currentUserLocation])


  const handleCameraViewChange = () => {
    if (cameraRef?.current) {
      const { bounds, key } = MapBounds
      if (key === 'POINT_MAP') {
        cameraRef.current.fitBounds(
          [bounds[0], bounds[1], bounds[2], bounds[3]],
          { padding: { top: 40, right: 40, bottom: 40, left: 40 }, duration: 1000 },
        )
      } else {
        handleCamera()
      }
      setMapRender(true)
    }
  }

  const handleCamera = () => {
    if (!currentUserLocation || currentUserLocation[0] === 0) {
      return
    }
    if (cameraRef?.current) {
      cameraRef.current.easeTo({
        center: [...currentUserLocation],
        zoom: 15,
        duration: 1000,
      })
    }
  }

  const handleCamera2 = () => {
    if (!currentUserLocation || currentUserLocation[0] === 0) {
      return
    }
    if (cameraRef?.current) {
      cameraRef.current.easeTo({
        center: [...currentUserLocation],
        zoom: 15,
        duration: 1000,
      })
    }
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
    if (!selectedCoordinate || selectedCoordinate[0] === 0) {
      toast.show("Please tap your location on the map")
      return
    }
    if (currentUserLocation && currentUserLocation[0] === 0) {
      toast.show("Please tap your location on the map")
      return
    }
    if (has_sample_trees) {
      dispatch(updateSampleTreeCoordinates([selectedCoordinate]))
    } else {
      const { coordinates } = makeInterventionGeoJson('Point', [selectedCoordinate], '')
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



  const handleAcceptAccuracyAlert = () => {
    setAlertModal(false);
  };

  const handleRejectAccuracyAlert = () => {
    setAlertModal(false);
    onSelectLocation();
  };

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
  }

  // Place the pin at an exact geo coordinate and run boundary validation.
  // The Marker (anchor="bottom") sits its tip on this exact point, so what
  // the user sees is what gets saved. Shared by tap and GPS-button flows.
  const placePin = (coords: [number, number]) => {
    setSelectedCoordinate(coords)
    setLoading(false)
    if (has_sample_trees && geoJSON) {
      const validMarker = isPointInPolygon(coords, geoJSON)
      const validSampleTree = handleMarkerValidation(coords)
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
    } else {
      setOutOfBoundary(false)
    }
  }

  // Drop the pin exactly where the user taps. maplibre gives the tapped
  // geo coordinate as event.nativeEvent.lngLat ([lng, lat]).
  const handleMapPress = (event: { nativeEvent?: { lngLat?: [number, number] } }) => {
    const coords = event?.nativeEvent?.lngLat
    if (!coords || coords.length < 2 || coords[0] === 0) {
      return
    }
    placePin(coords)
  }

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        ref={mapRef}
        logo={false}
        attribution={false}
        onRegionDidChange={handleDrag}
        onPress={handleMapPress}
        onDidFinishLoadingMap={!mapRender ? handleCameraViewChange : null}
        onRegionIsChanging={() => {
          setLoading(true)
        }}
        mapStyle={mainMapView === 'SATELLITE' ? SatelliteLayer : MapStyle}>
        <Camera ref={cameraRef} maxZoom={18} />
        <UserLocation heading minDisplacement={1} />
        {/* Boundary of the site picked for this intervention, outline only.
            site_id is 'other' (or empty) when no real site was chosen --
            in that case no boundary is drawn. */}
        {!!siteId && siteId !== 'other' && (
          <SiteMapSource isSatellite={mainMapView === 'SATELLITE'} siteId={siteId} />
        )}
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
        {selectedCoordinate && (
          <Marker lngLat={selectedCoordinate} anchor="bottom">
            <MapPin fill={outOfBoundary ? Colors.LIGHT_RED : Colors.NEW_PRIMARY} />
          </Marker>
        )}
      </Map>
      <SatelliteIconWrapper low />
      {/* <MapZoomScale mapRef={mapRef} position="top-left" padTop={20} /> */}
      <CustomButton
        label={i18next.t('label.tree_map_marking_btn')}
        containerStyle={styles.btnContainer}
        pressHandler={checkForAccuracy}
        loading={loading}
        disable={loading || outOfBoundary || !selectedCoordinate}
      />
      <AlertModal
        visible={alertModal}
        heading={i18next.t('label.poor_accuracy')}
        message={i18next.t('label.poor_accuracy_message')}
        primaryBtnText={i18next.t('label.try_again')}
        secondaryBtnText={i18next.t('label.continue')}
        onPressPrimaryBtn={handleAcceptAccuracyAlert}
        onPressSecondaryBtn={handleRejectAccuracyAlert}
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
    bottom: 30,
    width: '100%',
    height: 80,
  },
})
