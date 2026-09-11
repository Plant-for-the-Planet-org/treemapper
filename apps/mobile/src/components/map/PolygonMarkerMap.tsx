import { StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Map, Camera, CameraRef, MapRef, UserLocation, GeolocationPosition, useCurrentPosition } from '@maplibre/maplibre-react-native'
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
import distanceCalculator, { checkIsValidPolygonMarker } from 'src/utils/helpers/turfHelpers'
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
import bbox from '@turf/bbox'
import MapZoomScale from './MapZoomScale'
import SiteMapSource from './SiteMapSource'
import useMapDraft from 'src/hooks/realm/useMapDraft'


// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

// Shortest gap between two saves of a route being walked, in ms.
const TRACK_SAVE_INTERVAL = 5000

// How close to corner A a new corner has to land before we read it as the
// surveyor walking back to close the ring rather than marking a new corner.
const CLOSE_LOOP_RADIUS = 5


interface Props {
  species_required: boolean
  form_id: string
  intervention_key: string
  siteId?: string
}

const PolygonMarkerMap = (props: Props) => {
  const { species_required, form_id, intervention_key, siteId } = props
  const [currentCoordinate, setCurrentCoordinate] = useState({
    id: 'A',
    index: 0,
  })
  const [loading, setLoading] = useState(true)
  const [trackerModal, setTrackerModal] = useState(false)
  const [closeLoopModal, setCloseLoopModal] = useState(false)
  const [pendingCoordinate, setPendingCoordinate] = useState<[number, number] | null>(null)
  const [lineError, setLineError] = useState(false)
  const [coordinates, setCoordinates] = useState<[number, number][]>([])
  const [trackingState, setTrackingState] = useState('')
  const [trackingGeoJSON, setTrackingGeoJSON] = useState<number[][]>([])
  const [latestCoords, setLatestCoords] = useState<GeolocationPosition>(null)
  const currentPosition = useCurrentPosition({ minDisplacement: 1 })
  const [polygonComplete, setPolygonComplete] = useState(false)
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const user = useSelector(
    (state: RootState) => state.userState.type,
  )
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { updateInterventionLocation } = useInterventionManagement()
  const { saveDraft, readDraft, clearOwnerDrafts } = useMapDraft()
  const toast = useToast();
  const MapBounds = useSelector((state: RootState) => state.mapBoundState)

  const cameraRef = useRef<CameraRef>(null)
  const mapRef = useRef<MapRef>(null)
  const [mapRender, setMapRender] = useState(false)
  // What the camera should frame after a recovery: the marked corners, or the
  // walked route when there is one. A ref, not state, because the map's load
  // callback fires with whatever closure the render it was attached to
  // captured. Cleared on the first mark or undo, which hands the camera back.
  const restoredCoordsRef = useRef<[number, number][]>([])
  const [trackSeed, setTrackSeed] = useState<number[][]>([])
  // Set once the boundary belongs to the intervention. The tracker saves its
  // route again as it unmounts, which happens after we navigate away, and that
  // late write would otherwise resurrect a draft we just cleared.
  const committedRef = useRef(false)
  // When the walked route was last written, so saves stay spaced out.
  const lastTrackSaveRef = useRef(0)
  const mainMapView = useSelector(
    (state: RootState) => state.displayMapState.mainMapView
  )


  // Bring back whatever the last session marked before it died. Marking a large
  // area is an hour of walking, so losing it to a crash means walking it again.
  useEffect(() => {
    const savedPoints = readDraft('POLYGON', form_id)
    if (savedPoints.length === 0) {
      return
    }
    setCoordinates(savedPoints)
    setCurrentCoordinate({
      id: String.fromCharCode(65 + savedPoints.length),
      index: savedPoints.length,
    })
    setPolygonComplete(savedPoints.length >= 3)
    // A tracked route only exists alongside its starting corner, so it is read
    // after the marked points and framed instead of them when present.
    const savedTrack = readDraft('TRACK', form_id)
    if (savedTrack.length > 1) {
      // Come back paused, never recording: the phone may have sat in a pocket
      // or moved far since the crash, and auto-resuming would draw a straight
      // line across everything in between.
      restoredCoordsRef.current = savedTrack
      setTrackSeed(savedTrack)
      setTrackingState('pause')
      toast.show('Tracking restored, tap Resume to continue', { placement: 'top' })
      return
    }
    restoredCoordsRef.current = savedPoints
    toast.show(`Restored ${savedPoints.length} marked ${savedPoints.length === 1 ? 'point' : 'points'}`, { placement: 'top' })
  }, [])

  useEffect(() => {
    if (!mapRender) {
      const timer = setTimeout(() => {
        handleCameraView()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [MapBounds])


  useEffect(() => {
    // Recentring on the user would throw away the framing of a restored
    // boundary, so hold the view until they mark or undo a point.
    if (mapRender && restoredCoordsRef.current.length === 0) {
      handleCamera2()
    }
  }, [currentUserLocation])

  useEffect(() => {
    if (currentPosition) {
      setLatestCoords(currentPosition)
    }
  }, [currentPosition])

  const handleCameraView = () => {
    if (cameraRef?.current) {
      const { bounds, key } = MapBounds
      const hasValidBounds = Array.isArray(bounds) && bounds.length === 4 && bounds.every(Number.isFinite)
      // A restored boundary wins over both the saved bounds and the user's
      // current spot: the whole point is to show them what they already walked.
      if (restoredCoordsRef.current.length > 0) {
        frameRestoredPoints()
      } else if (key === 'POLYGON_MAP' && hasValidBounds) {
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

  const frameRestoredPoints = () => {
    const points = restoredCoordsRef.current
    if (!cameraRef?.current || points.length === 0) {
      return
    }
    try {
      if (points.length === 1) {
        cameraRef.current.easeTo({ center: points[0], zoom: 17, duration: 1000 })
        return
      }
      const bounds = bbox({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: points },
      } as any)
      cameraRef.current.fitBounds(
        [bounds[0], bounds[1], bounds[2], bounds[3]],
        { padding: { top: 60, right: 60, bottom: 60, left: 60 }, duration: 1000 },
      )
    } catch (error) {
      handleCamera()
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
        duration: 1000,
      })
    }
  }


  const handlePreviousPoint = () => {
    const updatedCoordinates = [...coordinates];
    updatedCoordinates.pop()
    setCoordinates(updatedCoordinates)
    restoredCoordsRef.current = []
    saveDraft('POLYGON', form_id, updatedCoordinates)
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
    if (centerCoordinates.length === 0) {
      return
    }
    // Walking back onto corner A is how a boundary ends, so a corner that lands
    // on top of it is a question rather than a new corner. Below three corners
    // there is no ring to close yet, and the 1 m rule handles the near miss.
    if (coordinates.length >= 3 && isBackAtFirstCorner(centerCoordinates)) {
      setPendingCoordinate(centerCoordinates as [number, number])
      setCloseLoopModal(true)
      return
    }
    await addCoordinate(centerCoordinates)
  }

  const isBackAtFirstCorner = (centerCoordinates: [number, number]) => {
    const distanceToStart = distanceCalculator(
      [centerCoordinates[1], centerCoordinates[0]],
      [coordinates[0][1], coordinates[0][0]],
      'meters',
    )
    return distanceToStart <= CLOSE_LOOP_RADIUS
  }

  const addCoordinate = async (centerCoordinates: [number, number]) => {
    const checkValidDistance = await checkIsValidMarker(centerCoordinates, [...coordinates])
    setLineError(false)
    if (!checkValidDistance) {
      errorHaptic()
      return
    }
    const updatedCoordinates = [...coordinates, centerCoordinates]
    setCoordinates(updatedCoordinates)
    restoredCoordsRef.current = []
    saveDraft('POLYGON', form_id, updatedCoordinates)
    setCurrentCoordinate(prevState => ({
      id: String.fromCharCode(prevState.id.charCodeAt(0) + 1),
      index: prevState.index + 1,
    }))
    toast.show("Point marked, move to other location", { placement: 'top' })
    if (coordinates.length >= 2) {
      setPolygonComplete(true)
    }
  }


  const checkIsValidMarker = async (centerCoordinates: number[], coords: any) => {
    try {
      for (const oneMarker of coords) {
        const isValid = await checkIsValidPolygonMarker(centerCoordinates, oneMarker);
        if (!isValid) {
          toast.show("Points must be at least 1 meter apart. Please move to a different location.", {
            type: "danger",
            placement: "bottom",
            duration: 3000,
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
    // The intervention owns the boundary now, so the recovery copy can go.
    committedRef.current = true
    clearOwnerDrafts(form_id)
    if (species_required) {
      navigation.navigate('ManageSpecies', { manageSpecies: false, id: form_id })
    } else {
      navigation.navigate('LocalForm', { id: form_id })
    }
  }

  const proceedTrackComplete = async () => {
    // setCoordinates([...finalCoordinates])
    const data = makeInterventionGeoJson('Point', trackingGeoJSON[0], form_id)
    const result = await updateInterventionLocation(form_id, { type: 'Polygon', coordinates: data.coordinates }, false)
    if (!result) {
      errorHaptic()
      toast.show('Error occurred while updating location')
      return
    }
    committedRef.current = true
    clearOwnerDrafts(form_id)
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
      committedRef.current = true
      clearOwnerDrafts(form_id)
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

  const handleTrackComplete = (e: any) => {
    const bounds = bbox(e)
    {
      cameraRef.current.fitBounds(
        [bounds[0], bounds[1], bounds[2], bounds[3]],
        { padding: { top: 40, right: 40, bottom: 40, left: 40 }, duration: 1000 },
      )
    }
    setTrackingState('complete')
    setTrackingGeoJSON(e.geometry.coordinates)
  }

  const handleInvalidArea = () => {
    setTrackingState('start')
  }

  // The tracker emits a new path every few GPS fixes. Saving all of them would
  // rewrite a list that grows for the whole walk, so writes are spaced out;
  // `force` covers pause and unmount, where the last points matter most.
  const handleTrackPathChange = (path: number[][], force?: boolean) => {
    if (committedRef.current || path.length < 2) {
      return
    }
    const now = Date.now()
    if (!force && now - lastTrackSaveRef.current < TRACK_SAVE_INTERVAL) {
      return
    }
    lastTrackSaveRef.current = now
    saveDraft('TRACK', form_id, path)
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
      <View style={styles.mapWrapper}>
      <Map
        style={styles.map}
        ref={mapRef}
        logo={false}
        onDidFinishLoadingMap={!mapRender ? handleCameraView : null}
        onRegionDidChange={onRegionDidChange}
        onRegionIsChanging={() => {
          setLoading(true)
        }}
        attribution={false}
        mapStyle={mainMapView === 'SATELLITE' ? SatelliteLayer : MapStyle}>
        <Camera ref={cameraRef} trackUserLocation={trackingState === 'start' ? 'course' : undefined} />
        <UserLocation heading minDisplacement={1} />
        {/* Boundary of the site picked for this intervention, outline only.
            site_id is 'other' (or empty) when no real site was chosen --
            in that case no boundary is drawn. */}
        {!!siteId && siteId !== 'other' && (
          <SiteMapSource isSatellite={mainMapView === 'SATELLITE'} siteId={siteId} />
        )}
        {!isTracking && <>
          <LineMarker coordinates={coordinates} isSatellite={mainMapView === 'SATELLITE'} />
          <AlphabetMarkers coordinates={coordinates} />
        </>}
        {isTracking && <PolygonTracker
          handleTrackComplete={handleTrackComplete}
          isSatellite={mainMapView === 'SATELLITE'}
          handleInvalidArea={handleInvalidArea}
          handleCompletePress={trackingState === 'complete'}
          initialCoordinates={trackSeed}
          onPathChange={handleTrackPathChange}
          latestCoords={latestCoords} startCoord={coordinates.length > 0 ? coordinates[0] : null} isPaused={trackingState === 'pause'} />}
      </Map>
      {/* The crosshair belongs to the map's own box, not the screen. The corner
          banner above is in normal flow, so the map shrinks by its height the
          moment the first corner lands -- the map centre moves down by half
          that, and a crosshair anchored outside would stop matching the point
          the map actually records from B onwards. */}
      {!isTracking && <ActiveMarkerIcon />}
      </View>
      <SatelliteIconWrapper bottom={isTracking ? 120 : 0} />
      <MapZoomScale mapRef={mapRef} position="top-left" padTop={coordinates.length > 0?70:20}/>
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
              if (trackingState !== 'complete') {
                setTrackingState('complete')
              }
              if (trackingState === 'complete' && trackingGeoJSON) {
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
      {!isTracking && <UserlocationMarker high={coordinates.length === 0 && intervention_key === 'multi-tree-registration'} stopAutoFocus={true} />
      }
      <AlertModal
        visible={closeLoopModal}
        heading={"Back at corner A"}
        message={`This point is within ${CLOSE_LOOP_RADIUS} m of corner A. Close the area here, or add it as another corner.`}
        primaryBtnText={"Complete"}
        secondaryBtnText={"Add point"}
        onPressPrimaryBtn={() => {
          setCloseLoopModal(false)
          setPendingCoordinate(null)
          makeComplete()
        }}
        onPressSecondaryBtn={() => {
          setCloseLoopModal(false)
          if (pendingCoordinate) {
            addCoordinate(pendingCoordinate)
          }
          setPendingCoordinate(null)
        }}
        showSecondaryButton={true}
      />
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
  mapWrapper: {
    flex: 1,
    alignSelf: 'stretch',
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
