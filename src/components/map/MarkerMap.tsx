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
import {
  updateCoverImageId,
  updateFormCoordinates,
} from 'src/store/slice/registerFormSlice'
import {Coordinates} from 'src/types/interface/app.interface'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'
import {v4 as uuidv4} from 'uuid'
import {makeInterventionGeoJson} from 'src/utils/helpers/interventionFormHelper'
import {updateSampleTreeCoordinates} from 'src/store/slice/sampleTreeSlice'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

interface Props {
  formData: RegisterFormSliceInitalState
}

const MarkerMap = (props: Props) => {
  const {cover_image_required} = props.formData
  const [geoJSON, setGeoJSON] = useState(null)
  const [showPermissionAlert, setPermissionAlert] = useState(false)

  const {form_id, boundry} = useSelector((state: RootState) => state.sampleTree)
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
    const data = makeInterventionGeoJson('Polygon', boundry)
    setGeoJSON(data.geoJSON)
  }


  const handleCamera = () => {
    cameraRef.current.setCamera({
      centerCoordinate: [currentUserLocation.long, currentUserLocation.lat],
      zoomLevel: 18,
      animationDuration: 1000,
    })
  }

  const onSelectLocation = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
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
      dispatch(updateCoverImageId(imageId))
      navigation.replace('TakePicture', {
        id: imageId,
        screen: form_id.length ? 'SAMPLE_TREE' : 'POINT_REGISTER',
      })
    }
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
        {geoJSON && (
          <MapLibreGL.ShapeSource key={'dsc'} id={'id'} shape={geoJSON}>
            <MapLibreGL.FillLayer id={`${2}-layer`} />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>
      <CustomButton
        label="Select location & continue"
        containerStyle={styles.btnContainer}
        pressHandler={onSelectLocation}
      />
      <ActiveMarkerIcon />
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
