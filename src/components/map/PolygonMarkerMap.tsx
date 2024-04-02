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
import {scaleFont, scaleSize} from 'src/utils/constants/mixins'
import ActiveMarkerIcon from '../common/ActiveMarkerIcon'
import LineMarker from './LineMarker'
import AlphabetMarkers from './AlphabetMarkers'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {
  updateCoverImageId,
  updateFormCoordinates,
} from 'src/store/slice/registerFormSlice'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'
import DispalyCurrentPolygonMarker from './DispalyCurrentPolygonMarker'
import {Colors} from 'src/utils/constants'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

interface Props {
  formData: RegisterFormSliceInitalState
}

const PolygonMarkerMap = (props: Props) => {
  const {cover_image_required} = props.formData
  const permissionStatus = useLocationPermission()
  const [currentCoordinate, setCurrentCoordinate] = useState({
    id: 'A',
    index: 0,
  })

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
    setCurrentCoordinate(prevState => ({
      id: String.fromCharCode(prevState.id.charCodeAt(0) + 1),
      index: prevState.index++,
    }))
    if (coordinates.length > 2) {
      setPolygonComplete(true)
    }
  }

  const makeComplete = async () => {
    const finalCoordinates = coordinates.map((el, i) => {
      return {
        lat: el[0],
        long: el[1],
        id: String.fromCharCode(i + 65),
      }
    })

    setCoordinates([...coordinates, coordinates[0]])
    const allCordinates = [...finalCoordinates]
    dispatch(updateFormCoordinates(allCordinates))
    if (cover_image_required) {
      const imageId = String(new Date().getTime())
      dispatch(updateCoverImageId(imageId))
      navigation.navigate('TakePicture', {
        id: imageId,
        screen: 'POLYGON_REGISTER',
      })
    }
  }

  if (showPermissionAlert) {
    return null
  }

  return (
    <View style={styles.container}>
      <DispalyCurrentPolygonMarker
        lat={coordinates[currentCoordinate.index[0]]}
        long={coordinates[currentCoordinate.index[1]]}
        id={currentCoordinate.id}
      />
      <MapLibreGL.MapView
        style={styles.map}
        ref={mapRef}
        logoEnabled={false}
        styleURL={JSON.stringify(MapStyle)}>
        <MapLibreGL.Camera ref={cameraRef} />
        <LineMarker coordinates={coordinates} />
        <AlphabetMarkers coordinates={coordinates} />
      </MapLibreGL.MapView>

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
            label="Select location & continue"
            containerStyle={styles.btnWrapper}
            pressHandler={onSelectLocation}
            wrapperStyle={styles.opaqueWrapper}
            labelStyle={styles.normalLable}
          />
        </View>
      )}

      {!polygonComplete && (
        <CustomButton
          label="Select location & continue"
          containerStyle={styles.btnContainer}
          pressHandler={onSelectLocation}
        />
      )}
      <ActiveMarkerIcon />
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
    bottom: 0,
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnContainer: {
    position: 'absolute',
    bottom: 0,
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
    borderRadius: 10,
    borderWidth: 1,
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
    borderRadius: 10,
  },
  highlightLabel: {
    fontSize: scaleFont(14),
    fontWeight: '400',
    color: Colors.PRIMARY_DARK,
  },
  normalLable: {
    fontSize: scaleFont(14),
    fontWeight: '400',
    color: Colors.WHITE,
    textAlign:'center'
  },
})
