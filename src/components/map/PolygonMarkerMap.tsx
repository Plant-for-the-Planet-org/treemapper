import { StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import MapLibreGL, { Camera } from '@maplibre/maplibre-react-native'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import CustomButton from '../common/CustomButton'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import ActiveMarkerIcon from '../common/ActiveMarkerIcon'
import LineMarker from './LineMarker'
import AlphabetMarkers from './AlphabetMarkers'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import {
  updateFormCoordinates,
} from 'src/store/slice/registerFormSlice'
import DispalyCurrentPolygonMarker from './DispalyCurrentPolygonMarker'
import { Colors, Typography } from 'src/utils/constants'
import { checkIsValidPolygonMarker } from 'src/utils/helpers/turfHelpers'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')


interface Props {
  species_required: boolean
}

const PolygonMarkerMap = (props: Props) => {
  const { species_required } = props
  const [currentCoordinate, setCurrentCoordinate] = useState({
    id: 'A',
    index: 0,
  })

  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const dispatch = useDispatch()
  const cameraRef = useRef<Camera>(null)
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const [coordinates, setCoordinates] = useState([])
  const [polygonComplete, setPolygonComplete] = useState(false)



  useEffect(() => {
    setTimeout(() => {
      if (currentUserLocation && cameraRef.current !== null) {
        handleCamera()
      }
    }, 500);
  }, [currentUserLocation])

  const handleCamera = () => {
    cameraRef.current.setCamera({
      centerCoordinate: [...currentUserLocation],
      zoomLevel: 17,
      animationDuration: 1000,
    })
  }

  const handlePreviousPoint = () => {
    const updatedCordinates = [...coordinates];
    updatedCordinates.pop()
    setCoordinates(updatedCordinates)
    setCurrentCoordinate(prevState => ({
      id: String.fromCharCode(prevState.id.charCodeAt(0) - 1),
      index: prevState.index - 1,
    }))
    if (updatedCordinates.length <= 2) {
      setPolygonComplete(false)
    }
  }

  const onSelectLocation = async () => {
    const centerCoordinates = await mapRef.current.getCenter()
    if (coordinates.length !== 0) {
      const checkValidDistance = await checkIsValidPolygonMarker(centerCoordinates, coordinates[coordinates.length - 1])
      console.log("Show Validaition Erro(Maintain proper distance from previous point)", checkValidDistance)
    }
    setCoordinates([...coordinates, centerCoordinates])
    setCurrentCoordinate(prevState => ({
      id: String.fromCharCode(prevState.id.charCodeAt(0) + 1),
      index: prevState.index++,
    }))
    if (coordinates.length >= 2) {
      setPolygonComplete(true)
    }
  }

  const makeComplete = async () => {
    const finalCoordinates = [...coordinates];
    if (coordinates.length === 3) {
      finalCoordinates.push(coordinates[0])
    }
    setCoordinates([...finalCoordinates])
    dispatch(updateFormCoordinates(finalCoordinates))
    if (!species_required) {
      navigation.replace('DynamicForm')
    } else {
      navigation.replace('ManageSpecies', { manageSpecies: false })
    }


  }

  return (
    <View style={styles.container}>
      <DispalyCurrentPolygonMarker
        lat={coordinates[currentCoordinate.index[0]]}
        long={coordinates[currentCoordinate.index[1]]}
        id={currentCoordinate.id}
        undo={handlePreviousPoint}
      />
      <MapLibreGL.MapView
        style={styles.map}
        ref={mapRef}
        logoEnabled={false}
        attributionEnabled={false}
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
            label="Continue"
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
    fontFamily:Typography.FONT_FAMILY_BOLD
  },
  normalLable: {
    fontSize: scaleFont(14),
    fontWeight: '400',
    color: Colors.WHITE,
    textAlign: 'center',
    fontFamily:Typography.FONT_FAMILY_BOLD
  },
})
