import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import { Map, Camera, CameraRef, MapRef, UserLocation, Marker, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native'
import { useSelector } from 'react-redux'

import Header from 'src/components/common/Header'
import CustomButton from 'src/components/common/CustomButton'
import GpsAccuracyTile from 'src/components/map/GpsAccuracyTile'
import InfoModal from 'src/components/common/InfoModal'
import LocationPermissionModal from 'src/components/map/LocationPermissionModal'
import { RootStackParamList } from 'src/types/type/navigation.type'
import store, { RootState } from 'src/store'
import { Colors, Typography } from 'src/utils/constants'
import { SCALE_20 } from 'src/utils/constants/spacing'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import useLocationPermission from 'src/hooks/useLocationPermission'
import { useObject } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { SampleTree } from 'src/types/interface/slice.interface'
import getUserLocation from 'src/utils/helpers/getUserLocation'
import getDistanceBetween, { formatDistance } from 'src/utils/helpers/getDistanceBetween'
import { useToast } from 'react-native-toast-notifications'
import SatelliteIconWrapper from 'src/components/map/SatelliteIconWrapper'
import SatelliteLayer from 'assets/mapStyle/satelliteView'
import MapPin from 'assets/images/svg/MapPin.svg'
import UserLocationIcon from 'assets/images/svg/UserLocationIcon.svg'
import UndoIcon from 'assets/images/svg/UndoIcon.svg'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

const PlannedTreeLocationView = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'PlannedTreeLocation'>>()
  const { interventionId, treeId } = route.params
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const toast = useToast()

  const tree = useObject<SampleTree>(RealmSchema.TreeDetail, treeId)
  const currentUserLocation = useSelector((state: RootState) => state.gpsState.user_location)
  const mainMapView = useSelector((state: RootState) => state.displayMapState.mainMapView)
  const { updatePlannedTreeLocation } = useInterventionManagement()
  const { userCurrentLocation } = useLocationPermission()

  const [showInfoModal, setShowInfoModal] = useState(false)
  const [selectedCoordinate, setSelectedCoordinate] = useState<[number, number] | null>(null)
  const cameraRef = useRef<CameraRef>(null)
  const mapRef = useRef<MapRef>(null)
  const seeded = useRef(false)
  // The pin's location when the screen opened. Lets "Undo" snap back to it after
  // a stray tap, without re-reading Realm.
  const initialCoordinate = useRef<[number, number] | null>(null)
  // Frame both points once, the first time we have a fix; after that the camera
  // is left alone so passive GPS ticks don't keep yanking it.
  const framed = useRef(false)
  // Set true once the user pans/zooms the map themselves -> stop auto-framing.
  const userPanned = useRef(false)

  const userCoord: [number, number] | null =
    currentUserLocation && currentUserLocation[0] !== 0
      ? [currentUserLocation[0], currentUserLocation[1]]
      : null

  const distanceLabel =
    selectedCoordinate && userCoord
      ? formatDistance(getDistanceBetween(userCoord, selectedCoordinate))
      : null

  const sameCoord = (a: [number, number], b: [number, number]) =>
    Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6

  // Keep both the pin and the user in view. Falls back to centering on whichever
  // point exists (e.g. before the first GPS fix, or once they coincide).
  const frameBoth = (marker: [number, number] | null, user: [number, number] | null) => {
    if (!cameraRef.current) {
      return
    }
    if (marker && user && !sameCoord(marker, user)) {
      const lngs = [marker[0], user[0]]
      const lats = [marker[1], user[1]]
      cameraRef.current.fitBounds(
        [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
        { padding: { top: 90, right: 70, bottom: 150, left: 70 }, duration: 800 },
      )
      return
    }
    const single = marker ?? user
    if (single) {
      cameraRef.current.easeTo({ center: [...single], zoom: 16, duration: 800 })
    }
  }

  // Pull a fix on open so the distance + framing have data. This never moves the
  // pin -- it only feeds the user dot and the camera.
  useEffect(() => {
    userCurrentLocation()
  }, [])

  // Seed the pin ONCE at the tree's planned (geoJSON) spot. Fall back to the
  // device only when the tree has no saved location yet. The planned spot wins
  // on load; after seeding, only an explicit tap / recenter moves the pin.
  useEffect(() => {
    if (seeded.current || !tree) {
      return
    }
    if (!(tree.latitude === 0 && tree.longitude === 0)) {
      const coord: [number, number] = [tree.longitude, tree.latitude]
      setSelectedCoordinate(coord)
      initialCoordinate.current = coord
      seeded.current = true
    } else if (userCoord) {
      setSelectedCoordinate(userCoord)
      initialCoordinate.current = userCoord
      seeded.current = true
    }
  }, [tree, currentUserLocation])

  // Frame the pin + user together the first time we have both, unless the user
  // has already started moving the map. Passive ticks after this are ignored.
  useEffect(() => {
    if (framed.current || userPanned.current || !selectedCoordinate) {
      return
    }
    framed.current = true
    const timer = setTimeout(() => frameBoth(selectedCoordinate, userCoord), 350)
    return () => clearTimeout(timer)
  }, [selectedCoordinate, currentUserLocation])

  const handleMapPress = (event: { nativeEvent?: { lngLat?: [number, number] } }) => {
    const coords = event?.nativeEvent?.lngLat
    if (!coords || coords.length < 2 || coords[0] === 0) {
      return
    }
    // A tap is precise placement -- move the pin but do not yank the camera.
    setSelectedCoordinate(coords)
    toast.show('Tree location updated')
  }

  // Snap the pin back to where it was when the screen opened, undoing any taps
  // or recenters. Reframes so both points are visible again.
  const undoLocation = () => {
    if (!initialCoordinate.current) {
      return
    }
    const coord = initialCoordinate.current
    setSelectedCoordinate(coord)
    frameBoth(coord, userCoord)
    toast.show('Location reset')
  }

  // Recenter button: snap the pin to a fresh device fix and reframe. This is the
  // explicit "use my location" action -- the only GPS path that moves the pin.
  const recenterToDevice = async () => {
    userPanned.current = false
    await userCurrentLocation()
    const loc = store.getState().gpsState.user_location
    if (loc && loc[0] !== 0) {
      const coord: [number, number] = [loc[0], loc[1]]
      setSelectedCoordinate(coord)
      frameBoth(coord, coord)
    }
  }

  const confirmLocation = async () => {
    if (!selectedCoordinate || selectedCoordinate[0] === 0) {
      toast.show('Please tap the tree location on the map')
      return
    }
    const { accuracy } = getUserLocation()
    await updatePlannedTreeLocation(interventionId, treeId, selectedCoordinate[0], selectedCoordinate[1], accuracy)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={mainMapView === 'SATELLITE' ? 'light' : 'dark'} />
      <Header
        label="Select Location"
        rightComponent={<GpsAccuracyTile showModalInfo={setShowInfoModal} />}
      />
      <View style={styles.mapWrapper}>
        <Map
          style={styles.map}
          ref={mapRef}
          logo={false}
          attribution={false}
          onPress={handleMapPress}
          onRegionDidChange={(e) => {
            if (e?.nativeEvent?.userInteraction) {
              userPanned.current = true
            }
          }}
          mapStyle={mainMapView === 'SATELLITE' ? SatelliteLayer : MapStyle}>
          <Camera ref={cameraRef} maxZoom={18} />
          <UserLocation heading={true} minDisplacement={1} />
          {selectedCoordinate && userCoord && (
            <GeoJSONSource
              id="walkLine"
              data={{
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: [userCoord, selectedCoordinate] },
              }}>
              <Layer
                id="walkLineLayer"
                type="line"
                style={{ lineColor: Colors.NEW_PRIMARY, lineWidth: 3, lineDasharray: [2, 2], lineOpacity: 0.9 }}
              />
            </GeoJSONSource>
          )}
          {selectedCoordinate && (
            <Marker lngLat={selectedCoordinate} anchor="bottom">
              <MapPin fill={Colors.NEW_PRIMARY} />
            </Marker>
          )}
        </Map>
        {distanceLabel && (
          <View style={styles.distancePill}>
            <Text style={styles.distanceText}>{distanceLabel}</Text>
          </View>
        )}
        <SatelliteIconWrapper low />
        <TouchableOpacity style={styles.undoBtn} onPress={undoLocation}>
          <UndoIcon width={SCALE_20} height={SCALE_20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.recenterBtn} onPress={recenterToDevice}>
          <UserLocationIcon width={SCALE_20} height={SCALE_20} />
        </TouchableOpacity>
      </View>
      <CustomButton
        label="Save Location"
        containerStyle={styles.btnContainer}
        pressHandler={confirmLocation}
        disable={!selectedCoordinate}
      />
      <InfoModal isVisible={showInfoModal} toggleModal={setShowInfoModal} />
      <LocationPermissionModal />
    </SafeAreaView>
  )
}

export default PlannedTreeLocationView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    flex: 1,
    alignSelf: 'stretch',
  },
  distancePill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  distanceText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: 13,
    color: Colors.TEXT_COLOR,
  },
  recenterBtn: {
    position: 'absolute',
    right: '9%',
    bottom: 130,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  undoBtn: {
    position: 'absolute',
    right: '9%',
    bottom: '38%',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  btnContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    height: 80,
  },
})
