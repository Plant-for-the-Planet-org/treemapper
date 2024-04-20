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
import {useNavigation} from '@react-navigation/native'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {StackNavigationProp} from '@react-navigation/stack'
import {updateFormCoordinates} from 'src/store/slice/registerFormSlice'
import {Coordinates} from 'src/types/interface/app.interface'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'
import {v4 as uuidv4} from 'uuid'
import {makeInterventionGeoJson} from 'src/utils/helpers/interventionFormHelper'
import {updateSampleTreeCoordinates} from 'src/store/slice/sampleTreeSlice'
import MapShapeSource from './MapShapeSource'
import {
  isPointInPolygon,
  validateMarkerForSampleTree,
} from 'src/utils/helpers/turfHelpers'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

interface Props {
  formData: RegisterFormSliceInitalState
}

const PointMarkerMap = (props: Props) => {
  const {tree_details} = props.formData
  const [geoJSON, setGeoJSON] = useState(null)
  const [showPermissionAlert, setPermissionAlert] = useState(false)
  const MapBounds = useSelector((state: RootState) => state.mapBoundState)
  const {form_id, boundry} = useSelector((state: RootState) => state.sampleTree)
  const [outOfBoundry, setOutOfBoundry] = useState(false)
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )

  const dispatch = useDispatch()
  const permissionStatus = useLocationPermission()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const cameraRef = useRef<Camera>(null)
  const mapRef = useRef<MapLibreGL.MapView>(null)

  useEffect(() => {
    if (PermissionStatus.DENIED === permissionStatus) {
      setPermissionAlert(true)
    } else {
      getInitalLocation()
      setPermissionAlert(false)
    }
  }, [permissionStatus])

  useEffect(() => {
    setTimeout(() => {
      if (cameraRef && cameraRef.current) {
        handleCameraViewChange()
      }
    }, 500)
  }, [MapBounds])

  const handleCameraViewChange = () => {
    const {bounds, key} = MapBounds
    if (bounds.length === 0) {
      return
    }
    if (key === 'POINT_MAP') {
      cameraRef.current.fitBounds(
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
        40,
        1000,
      )
    }
  }

  useEffect(() => {
    if (form_id.length) {
      getMarkerJSON()
    }
  }, [form_id])

  useEffect(() => {
    if (currentUserLocation && cameraRef.current !== null) {
      handleCamera()
    }
  }, [currentUserLocation])

  const getInitalLocation = async () => {
    const {lat, long} = await userCurrentLocation()
    dispatch(
      updateUserLocation({
        lat: lat,
        long: long,
      }),
    )
  }

  const getMarkerJSON = () => {
    const data = makeInterventionGeoJson('Polygon', boundry, uuidv4(), false)
    setGeoJSON(data.geoJSON)
  }

  const handleCamera = () => {
    cameraRef.current.setCamera({
      centerCoordinate: [currentUserLocation.long, currentUserLocation.lat],
      zoomLevel: 17,
      animationDuration: 1000,
    })
  }

  const onSelectLocation = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
    handleMarkerValidation(centerCoordinates)
    const formCoordinates: Coordinates = {
      lat: centerCoordinates[0],
      long: centerCoordinates[1],
      id: 'A',
    }
    const allCordinates = [formCoordinates]
    if (form_id.length > 0) {
      dispatch(updateSampleTreeCoordinates(allCordinates))
    } else {
      dispatch(updateFormCoordinates(allCordinates))
    }
    if (cover_image_required) {
      const imageId = uuidv4()
      navigation.replace('TakePicture', {
        id: imageId,
        screen: form_id.length ? 'SAMPLE_TREE' : 'POINT_REGISTER',
      })
    }
  }

  const handleMarkerValidation = (coords: number[]) => {
    if (form_id.length) {
      const isValidPoint = validateMarkerForSampleTree(
        coords,
        geoJSON,
        tree_details,
      )
      console.log('HasvalidPoints', isValidPoint)
    }
  }

  const handleShapeSource = () => {}

  if (showPermissionAlert) {
    return null
  }

  const handleDrag = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
    const validMarker = isPointInPolygon(centerCoordinates, geoJSON)
    setOutOfBoundry(!validMarker)
  }

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        ref={mapRef}
        logoEnabled={false}
        attributionEnabled={false}
        onRegionDidChange={handleDrag}
        styleURL={JSON.stringify(MapStyle)}>
        <MapLibreGL.Camera ref={cameraRef} />
        <MapLibreGL.UserLocation
          showsUserHeadingIndicator
          androidRenderMode="gps"
        />
        {geoJSON && (
          <MapShapeSource
            geoJSON={[geoJSON]}
            onShapeSourcePress={handleShapeSource}
            showError={outOfBoundry}
          />
        )}
      </MapLibreGL.MapView>
      <CustomButton
        label="Select location & Continue"
        containerStyle={styles.btnContainer}
        pressHandler={onSelectLocation}
      />
      <ActiveMarkerIcon />
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
    bottom: 0,
    width: '100%',
    height: scaleSize(70),
  },
})
