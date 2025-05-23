import { StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import MapLibreGL, { Location, UserTrackingMode } from '@maplibre/maplibre-react-native'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import CustomButton from '../common/CustomButton'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import ActiveMarkerIcon from '../common/ActiveMarkerIcon'
import LineMarker from './LineMarker'
import AlphabetMarkers from './AlphabetMarkers'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import DisplayCurrentPolygonMarker from './DisplayCurrentPolygonMarker'
import { Colors, Typography } from 'src/utils/constants'
import distanceCalculator from 'src/utils/helpers/turfHelpers'
import { useToast } from 'react-native-toast-notifications'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { errorHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import SatelliteIconWrapper from './SatelliteIconWrapper'
import SatelliteLayer from 'assets/mapStyle/satelliteView'
import UserlocationMarker from './UserlocationMarker'
import i18next from 'i18next'
import AlertModal from '../common/AlertModal'
import PolygonTracker from './PolygonTracker'
import { Feature } from '@turf/helpers'
import bbox from '@turf/bbox'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')


interface Props {
  species_required: boolean
  form_id: string
  intervention_key: string
}

const PolygonMarkerMap = (props: Props) => {
  const { species_required, form_id, intervention_key } = props
  const [currentCoordinate, setCurrentCoordinate] = useState({
    id: 'A',
    index: 0,
  })
  const [loading, setLoading] = useState(true)
  const [trackerModal, setTrackerModal] = useState(false)
  const [lineError, setLineError] = useState(false)
  const [coordinates, setCoordinates] = useState([])
  const [trackingState, setTrackingState] = useState('')
  const [trackingGeoJSON, setTrackingGeoJSON] = useState<number[][]>([])
  const [latestCoords, setLatestCoords] = useState<Location>(null)
  const [polygonComplete, setPolygonComplete] = useState(false)
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const user = useSelector(
    (state: RootState) => state.userState.type,
  )
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { updateInterventionLocation } = useInterventionManagement()
  const toast = useToast();
  const MapBounds = useSelector((state: RootState) => state.mapBoundState)

  const cameraRef = useRef<MapLibreGL.Camera>(null)
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const [mapRender, setMapRender] = useState(false)
  const mainMapView = useSelector(
    (state: RootState) => state.displayMapState.mainMapView
  )


  useEffect(() => {
    if (!mapRender) {
      setTimeout(() => {
        handleCameraView()
      }, 300);
    }
  }, [MapBounds])


  useEffect(() => {
    if (mapRender) {
      handleCamera()
    }
  }, [currentUserLocation])

  const handleCameraView = () => {
    if (cameraRef?.current) {
      const { bounds, key } = MapBounds
      if (key === 'POLYGON_MAP') {
        cameraRef.current.fitBounds(
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
          40,
          1000,
        )
      } else {
        handleCamera()
      }
      setMapRender(true)
    }
  }

  const handleCamera = () => {
    if (currentUserLocation[0] === 0) {
      return
    }
    if (cameraRef?.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [...currentUserLocation],
        zoomLevel: 20,
        animationDuration: 1000,
      })
    }
  }

  const handlePreviousPoint = () => {
    const updatedCoordinates = [...coordinates];
    updatedCoordinates.pop()
    setCoordinates(updatedCoordinates)
    setCurrentCoordinate(prevState => ({
      id: String.fromCharCode(prevState.id.charCodeAt(0) - 1),
      index: prevState.index - 1,
    }))
    if (updatedCoordinates.length <= 2) {
      setPolygonComplete(false)
    }
  }

  const onSelectLocation = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
    if (!centerCoordinates) {
      return
    }
    if (centerCoordinates && centerCoordinates[0] === 0) {
      toast.show("Please click on location")
      return
    }
    if (currentUserLocation && currentUserLocation[0] === 0) {
      toast.show("Please click on location")
      return
    }
    if (centerCoordinates.length !== 0) {
      const checkValidDistance = await checkIsValidMarker(centerCoordinates, [...coordinates])
      setLineError(false)
      if (!checkValidDistance) {
        errorHaptic()
      }
      setCoordinates([...coordinates, centerCoordinates])
      setCurrentCoordinate(prevState => ({
        id: String.fromCharCode(prevState.id.charCodeAt(0) + 1),
        index: prevState.index++,
      }))
      toast.show("Point marked, move to other location", { placement: 'top' })
      if (coordinates.length >= 2) {
        setPolygonComplete(true)
      }
    }
  }


  const checkIsValidMarker = async (centerCoordinates: number[], coords: any) => {
    try {
      for (const oneMarker of coords) {
        const distanceInMeters = distanceCalculator(
          [centerCoordinates[1], centerCoordinates[0]],
          [oneMarker[1], oneMarker[0]],
          'meters',
        );
        if (!distanceInMeters) {
          toast.show("Marker is close to previous point.", {
            type: "normal",
            placement: "bottom",
            duration: 2000,
            animationType: "slide-in",
          })
          return false
        }
      }
      return true;
    } catch (error) {
      return false
    }
  };

  const makeComplete = async () => {
    const finalCoordinates = [...coordinates, coordinates[0]];
    // setCoordinates([...finalCoordinates])
    const data = makeInterventionGeoJson('Point', finalCoordinates, form_id)
    const result = await updateInterventionLocation(form_id, { type: 'Polygon', coordinates: data.coordinates }, false)
    if (!result) {
      errorHaptic()
      toast.show('Error occurred while updating location')
      return
    }
    if (species_required) {
      navigation.navigate('ManageSpecies', { manageSpecies: false, id: form_id })
    } else {
      navigation.navigate('LocalForm', { id: form_id })
    }
  }

  const proceedTrackComplete = async () => {
    // setCoordinates([...finalCoordinates])
    console.log("SDsd",trackingGeoJSON)
    const data = makeInterventionGeoJson('Point', trackingGeoJSON[0], form_id)
    const result = await updateInterventionLocation(form_id, { type: 'Polygon', coordinates: data.coordinates }, false)
    if (!result) {
      errorHaptic()
      toast.show('Error occurred while updating location')
      return
    }
    if (species_required) {
      navigation.navigate('ManageSpecies', { manageSpecies: false, id: form_id })
    } else {
      navigation.navigate('LocalForm', { id: form_id })
    }
  }


  const showTrackerModal = () => {
    setTrackerModal(true)
  }

  const updateTrackState = () => {
    if (trackingState === 'start') {
      toast.show("Tracking Paused", { placement: 'center', duration: 1000 })
      setTrackingState("pause")
    } else {
      toast.show("Tracking Resumed", { placement: 'center', duration: 1000 })
      setTrackingState("start")
    }
  }

  const makePointLocation = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
    if (!centerCoordinates) {
      return
    }
    if (centerCoordinates && centerCoordinates[0] === 0) {
      toast.show("Please click on your location")
      return
    }
    if (currentUserLocation && currentUserLocation[0] === 0) {
      toast.show("Please click on your location")
      return
    }
    if (centerCoordinates.length !== 0) {
      const { coordinates } = makeInterventionGeoJson('Point', [centerCoordinates], '')
      const result = await updateInterventionLocation(form_id, { type: 'Point', coordinates: coordinates }, false)
      if (!result) {
        errorHaptic()
        toast.show('Error occurred while updating location')
        return
      }
      if (species_required) {
        navigation.navigate('ManageSpecies', { manageSpecies: false, id: form_id })
      } else {
        navigation.navigate('LocalForm', { id: form_id })
      }
    }
  }

  const onRegionDidChange = async () => {
    setLoading(false)
    setLineError(false)
  }

  const handleDisplacement = (e: Location) => {
    setLatestCoords(e)
  }

  const handleTrackComplete = (e: Feature) => {
    const bounds = bbox(e)
    {
      cameraRef.current.fitBounds(
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
        40,
        1000,
      )
    }
    setTrackingState('complete')
    setTrackingGeoJSON(e.geometry.coordinates)
  }

  const handleInvalidArea = () => {
    setTrackingState('start')
  }

  const isTracking = trackingState !== ''
  return (
    <View style={styles.container}>
      {coordinates.length !== 0 && trackingState !== 'complete' ? <DisplayCurrentPolygonMarker
        id={currentCoordinate.id}
        undo={handlePreviousPoint}
        isTracking={isTracking}
        trackingPaused={trackingState === 'pause'}

      /> : null}
      <MapLibreGL.MapView
        style={styles.map}
        ref={mapRef}
        logoEnabled={false}
        onDidFinishLoadingMap={!mapRender ? handleCameraView : null}
        onRegionDidChange={onRegionDidChange}
        onRegionIsChanging={() => {
          setLoading(true)
        }}
        attributionEnabled={false}
        styleURL={JSON.stringify(mainMapView === 'SATELLITE' ? SatelliteLayer : MapStyle)}>
        <MapLibreGL.Camera ref={cameraRef} followUserLocation={trackingState === 'start'} followUserMode={UserTrackingMode.FollowWithCourse} />
        <MapLibreGL.UserLocation
          showsUserHeadingIndicator
          androidRenderMode="gps"
          minDisplacement={1}
          onUpdate={handleDisplacement}
        />
        {!isTracking && <>
          <LineMarker coordinates={coordinates} isSatellite={mainMapView === 'SATELLITE'} />
          <AlphabetMarkers coordinates={coordinates} />
        </>}
        {isTracking && <PolygonTracker
          handleTrackComplete={handleTrackComplete}
          isSatellite={mainMapView === 'SATELLITE'}
          handleInvalidArea={handleInvalidArea}
          handleCompletePress={trackingState === 'complete'}
          latestCoords={latestCoords} startCoord={coordinates.length > 0 ? coordinates[0] : null} isPaused={trackingState === 'pause'} />}
      </MapLibreGL.MapView>
      <SatelliteIconWrapper bottom={isTracking ? 120 : 0} />
      {polygonComplete && (
        <View style={styles.btnFooter}>
          <CustomButton
            label="Complete"
            containerStyle={styles.btnWrapper}
            pressHandler={makeComplete}
            wrapperStyle={styles.borderWrapper}
            labelStyle={styles.highlightLabel}
          />
          <CustomButton
            label="Continue"
            containerStyle={styles.btnWrapper}
            pressHandler={onSelectLocation}
            wrapperStyle={styles.opaqueWrapper}
            labelStyle={styles.normalLabel}
          />
        </View>
      )}
      {!polygonComplete && coordinates.length === 1 && !isTracking ? (
        <View style={styles.btnFooterTwo}>
          <CustomButton
            label="Track"
            containerStyle={styles.btnWrapper}
            pressHandler={showTrackerModal}
            wrapperStyle={styles.borderWrapper}
            labelStyle={styles.highlightLabel}
          />
          <CustomButton
            label={`Mark Point`}
            containerStyle={styles.btnWrapper}
            pressHandler={onSelectLocation}
            disable={loading || lineError}
            loading={loading}
            wrapperStyle={styles.opaqueWrapper}
            labelStyle={styles.normalLabel}
          />
        </View>
      ) : null}
      {!polygonComplete && coordinates.length < 3 && coordinates.length !== 1 ? (
        <CustomButton
          label={`${i18next.t('label.select_location_continue')}`}
          containerStyle={styles.btnContainer}
          pressHandler={onSelectLocation}
          disable={loading || lineError}
          loading={loading}
        />
      ) : null}
      {!polygonComplete && trackingState !== '' ? (
        <View style={styles.btnFooterTwo}>
          <CustomButton
            label={trackingState === 'start' ? "Pause" : trackingState === 'complete' ? 'Back' : "Resume"}
            containerStyle={styles.btnWrapper}
            pressHandler={updateTrackState}
            wrapperStyle={styles.borderWrapper}
            labelStyle={styles.highlightLabel}
          />
          <CustomButton
            label={trackingState === 'complete' ? "Continue" : "Complete"}
            containerStyle={styles.btnWrapper}
            pressHandler={() => {
              if(trackingState!=='complete'){
                setTrackingState('complete')
              }
              if(trackingState==='complete' && trackingGeoJSON){
                proceedTrackComplete()
              }
            }}
            wrapperStyle={styles.opaqueWrapper}
            labelStyle={styles.normalLabel}
          />
        </View>
      ) : null}
      {!loading && !polygonComplete && coordinates.length === 0 && intervention_key === 'multi-tree-registration' ?
        <CustomButton
          label={`${i18next.t('label.use_point_location')}`}
          containerStyle={styles.pointWrapper}
          pressHandler={makePointLocation}
          wrapperStyle={styles.pointButton}
          labelStyle={styles.highlightLabel}
          hideFadeIn
        /> : null
      }
      {!isTracking && <ActiveMarkerIcon />}
      {!isTracking && <UserlocationMarker high={coordinates.length === 0 && intervention_key === 'multi-tree-registration'} stopAutoFocus={user === 'tpo'} />
      }
      <AlertModal
        visible={trackerModal}
        heading={"Track your route"}
        message={"With this feature, you can automatically track records without manually setting markers. You can pause tracking anytime if you notice fluctuations in GPS accuracy. Once finished, simply click 'Complete' to stop tracking."}
        primaryBtnText={"Start Tracking"}
        secondaryBtnText={"Cancel"}
        onPressPrimaryBtn={() => {
          setTrackerModal(false)
          setTrackingState('start')
        }}
        onPressSecondaryBtn={() => {
          toast.show("Tracking Started")
          setTrackerModal(false)
        }}
        showSecondaryButton={true}
      />
    </View>
  )
}

export default PolygonMarkerMap

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

  btnFooterTwo: {
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
    bottom: 10,
    width: '100%',
    height: scaleSize(70),
  },
  btnWrapper: {
    flex: 1,
    height: '100%',
  },
  pointWrapper: {
    position: 'absolute',
    bottom: 90,
    width: '100%',
    height: scaleSize(70),
  },
  pointButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '85%',
    height: '80%',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.PRIMARY_DARK,
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
})
