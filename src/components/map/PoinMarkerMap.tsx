import { StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import MapLibreGL, { Camera } from '@maplibre/maplibre-react-native'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import CustomButton from '../common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import ActiveMarkerIcon from '../common/ActiveMarkerIcon'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { StackNavigationProp } from '@react-navigation/stack'
import { updateFormCoordinates } from 'src/store/slice/registerFormSlice'
import { RegisterFormSliceInitalState } from 'src/types/interface/slice.interface'
import { v4 as uuidv4 } from 'uuid'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import { updateSampleTreeCoordinates } from 'src/store/slice/sampleTreeSlice'
import MapShapeSource from './MapShapeSource'
import i18next from 'i18next'
import * as Location from 'expo-location';
import AlertModal from '../common/AlertModal'
// import {
//   // isPointInPolygon,
//   validateMarkerForSampleTree,
// } from 'src/utils/helpers/turfHelpers'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

interface Props {
  formData: RegisterFormSliceInitalState
}

const PointMarkerMap = (props: Props) => {
  const { species_required, is_multi_species } = props.formData
  const [geoJSON, setGeoJSON] = useState(null)
  const [alertModal, setAlertModal] = useState(false)

  const MapBounds = useSelector((state: RootState) => state.mapBoundState)
  const { form_id, boundry } = useSelector((state: RootState) => state.sampleTree)
  const [outOfBoundry] = useState(false)
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )

  const dispatch = useDispatch()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const cameraRef = useRef<Camera>(null)
  const mapRef = useRef<MapLibreGL.MapView>(null)


  useEffect(() => {
    setTimeout(() => {
      if (cameraRef && cameraRef.current) {
        handleCameraViewChange()
      }
    }, 500)
  }, [MapBounds])

  const handleCameraViewChange = () => {
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

  useEffect(() => {
    if (form_id.length) {
      getMarkerJSON()
    }
  }, [form_id])



  const getMarkerJSON = () => {
    const data = makeInterventionGeoJson('Polygon', boundry, uuidv4())
    setGeoJSON(data.geoJSON)
  }

  const handleCamera = () => {
    cameraRef.current.setCamera({
      centerCoordinate: [...currentUserLocation],
      zoomLevel: 17,
      animationDuration: 1000,
    })
  }

  const onSelectLocation = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
    if (form_id.length > 0) {
      dispatch(updateSampleTreeCoordinates([centerCoordinates]))
    } else {
      dispatch(updateFormCoordinates(centerCoordinates))
    }
    if(species_required){
      if(is_multi_species){
        navigation.replace('TotalTrees', { isSelectSpecies: true })
      }else{
        navigation.replace('ManageSpecies',{manageSpecies:false})
      }
    }else{
      navigation.replace('DynamicForm')
    }
  }

  const handleAccuracyAlert=(b:boolean)=>{
    if(b){
      setAlertModal(false)
    }else{
      onSelectLocation()
    }
  }

  const checkForAccuracy=async()=>{
    const {coords} = await Location.getCurrentPositionAsync()
    if(coords && coords.accuracy && coords.accuracy>=30){
      setAlertModal(true)
    }else{
      onSelectLocation()
    }
  }

  // const handleMarkerValidation = (coords: number[]) => {
  //   if (form_id.length) {
  //     const isValidPoint = validateMarkerForSampleTree(
  //       coords,
  //       geoJSON,
  //       tree_details,
  //     )
  //     console.log('HasvalidPoints', isValidPoint)
  //   }
  // }


  const handleDrag = async () => {
    // const centerCoordinates = await mapRef.current.getCenter()
    // const validMarker = isPointInPolygon(centerCoordinates, geoJSON)
    // setOutOfBoundry(!validMarker)
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
            onShapeSourcePress={null}
            showError={outOfBoundry}
          />
        )}
      </MapLibreGL.MapView>
      <CustomButton
        label="Select location & Continue"
        containerStyle={styles.btnContainer}
        pressHandler={checkForAccuracy}
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
    bottom: 0,
    width: '100%',
    height: scaleSize(70),
  },
})
