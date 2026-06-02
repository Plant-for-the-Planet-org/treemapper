import { StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import { Map, Camera, CameraRef, MapRef, UserLocation, Marker } from '@maplibre/maplibre-react-native'
import { useSelector } from 'react-redux'

import Header from 'src/components/common/Header'
import CustomButton from 'src/components/common/CustomButton'
import GpsAccuracyTile from 'src/components/map/GpsAccuracyTile'
import InfoModal from 'src/components/common/InfoModal'
import LocationPermissionModal from 'src/components/map/LocationPermissionModal'
import UserlocationMarker from 'src/components/map/UserlocationMarker'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { RootState } from 'src/store'
import { Colors } from 'src/utils/constants'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { useObject } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { SampleTree } from 'src/types/interface/slice.interface'
import getUserLocation from 'src/utils/helpers/getUserLocation'
import { useToast } from 'react-native-toast-notifications'
import MapPin from 'assets/images/svg/MapPin.svg'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

const PlannedTreeLocationView = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'PlannedTreeLocation'>>()
  const { interventionId, treeId } = route.params
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const toast = useToast()

  const tree = useObject<SampleTree>(RealmSchema.TreeDetail, treeId)
  const currentUserLocation = useSelector((state: RootState) => state.gpsState.user_location)
  const { updatePlannedTreeLocation } = useInterventionManagement()

  const [showInfoModal, setShowInfoModal] = useState(false)
  const [selectedCoordinate, setSelectedCoordinate] = useState<[number, number] | null>(null)
  const cameraRef = useRef<CameraRef>(null)
  const mapRef = useRef<MapRef>(null)
  const seeded = useRef(false)

  // Seed the pin: tree's saved spot if it has one, else the user's GPS.
  useEffect(() => {
    if (seeded.current) {
      return
    }
    if (tree && !(tree.latitude === 0 && tree.longitude === 0)) {
      const coord: [number, number] = [tree.longitude, tree.latitude]
      setSelectedCoordinate(coord)
      seeded.current = true
      setTimeout(() => centerOn(coord), 300)
    } else if (currentUserLocation && currentUserLocation[0] !== 0) {
      const coord: [number, number] = [currentUserLocation[0], currentUserLocation[1]]
      setSelectedCoordinate(coord)
      seeded.current = true
      setTimeout(() => centerOn(coord), 300)
    }
  }, [tree, currentUserLocation])

  // GPS button (UserlocationMarker) updates currentUserLocation -> drop pin there.
  useEffect(() => {
    if (seeded.current && currentUserLocation && currentUserLocation[0] !== 0) {
      const coord: [number, number] = [currentUserLocation[0], currentUserLocation[1]]
      setSelectedCoordinate(coord)
      centerOn(coord)
    }
  }, [currentUserLocation])

  const centerOn = (coord: [number, number]) => {
    if (cameraRef?.current) {
      cameraRef.current.easeTo({ center: [...coord], zoom: 16, duration: 800 })
    }
  }

  const handleMapPress = (event: { nativeEvent?: { lngLat?: [number, number] } }) => {
    const coords = event?.nativeEvent?.lngLat
    if (!coords || coords.length < 2 || coords[0] === 0) {
      return
    }
    setSelectedCoordinate(coords)
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
      <StatusBar style="dark" />
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
          mapStyle={MapStyle}>
          <Camera ref={cameraRef} maxZoom={18} />
          <UserLocation heading minDisplacement={1} />
          {selectedCoordinate && (
            <Marker lngLat={selectedCoordinate} anchor="bottom">
              <MapPin fill={Colors.NEW_PRIMARY} />
            </Marker>
          )}
        </Map>
        <UserlocationMarker stopAutoFocus />
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
  btnContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    height: 80,
  },
})
