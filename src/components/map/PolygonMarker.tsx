import {StyleSheet, View} from 'react-native'
import React, {useEffect, useRef, useState} from 'react'
import MapLibreGL, {Camera} from '@maplibre/maplibre-react-native'
import useLocationPermission from 'src/hooks/useLocationPermission'
import {PermissionStatus} from 'expo-location'
import {useDispatch, useSelector} from 'react-redux'
import {updateUserLocation} from 'src/store/slice/gpsStateSlice'
import {RootState} from 'src/store'
import userCurrentLocation from 'src/utils/helpers/getUserLocation'
import CustomButton from '../common/CustomButton'
import {scaleSize} from 'src/utils/constants/mixins'
import ActiveMarkerIcon from '../common/ActiveMarkerIcon'
import LineMarker from './LineMarker'
import AlphabetMarkers from './AlphabetMarkers'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

const MarkerMap = () => {
  const permissionStatus = useLocationPermission()
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const [showPermissionAlert, setPermissionAlert] = useState(false)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const cameraRef = useRef<Camera>(null)
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const [coordinates, setCoordinates] = useState([])
  const [polygonComplete, setPolygonComplete] = useState(false)

  useEffect(() => {
    if (PermissionStatus.DENIED === permissionStatus) {
      setPermissionAlert(true)
    } else {
      getInitalLocation()
      setPermissionAlert(false)
    }
  }, [permissionStatus])

  const getInitalLocation = async () => {
    const {lat, long} = await userCurrentLocation()
    dispatch(
      updateUserLocation({
        lat: lat,
        long: long,
      }),
    )
  }

  useEffect(() => {
    if (currentUserLocation && cameraRef.current !== null) {
      handleCamera()
    }
  }, [currentUserLocation])

  const handleCamera = () => {
    cameraRef.current.setCamera({
      centerCoordinate: [currentUserLocation.long, currentUserLocation.lat],
      zoomLevel: 18,
      animationDuration: 1000,
    })
  }

  const onSelectLocation = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
    setCoordinates([...coordinates, centerCoordinates])
    if (coordinates.length > 2) {
      setPolygonComplete(true)
    }
  }

  const makeComplete = async () => {
    setCoordinates([...coordinates, coordinates[0]])
    setTimeout(() => {
      navigation.navigate('TakePicture')
    }, 2000)
  }

  if (showPermissionAlert) {
    return null
  }

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        ref={mapRef}
        logoEnabled={false}
        styleURL={JSON.stringify(MapStyle)}>
        <MapLibreGL.Camera ref={cameraRef} />
        <LineMarker coordinates={coordinates} />
        <AlphabetMarkers coordinates={coordinates} />
      </MapLibreGL.MapView>
      {polygonComplete ? (
        <CustomButton
          label="Complete"
          containerStyle={styles.btnContainer}
          pressHandler={makeComplete}
        />
      ) : (
        <CustomButton
          label="Select location & continue"
          containerStyle={styles.btnContainer}
          pressHandler={onSelectLocation}
        />
      )}
      {!polygonComplete && <ActiveMarkerIcon />}
    </View>
  )
}

export default MarkerMap

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
    bottom: 0,
    width: '100%',
    height: scaleSize(70),
  },
})
