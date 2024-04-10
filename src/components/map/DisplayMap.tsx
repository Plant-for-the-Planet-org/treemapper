import { StyleSheet} from 'react-native'
import React, {useEffect, useRef, useState} from 'react'
import MapLibreGL, {Camera} from '@maplibre/maplibre-react-native'
import useLocationPermission from 'src/hooks/useLocationPermission'
import {PermissionStatus} from 'expo-location'
import {useDispatch, useSelector} from 'react-redux'
import {updateUserLocation} from 'src/store/slice/gpsStateSlice'
import {RootState} from 'src/store'
import getUserLocation from 'src/utils/helpers/getUserLocation'
import {useQuery} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'
import {makeInterventionGeoJson} from 'src/utils/helpers/interventionFormHelper'
import {InterventionData} from 'src/types/interface/slice.interface'
import MapShapeSource from './MapShapeSource'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')


const DisplayMap = () => {
  const permissionStatus = useLocationPermission()
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const [showPermissionAlert, setPermissionAlert] = useState(false)
  const dispatch = useDispatch()
  const cameraRef = useRef<Camera>(null)

  
  const userFavSpecies = useQuery<InterventionData>(
    RealmSchema.Intervention,
    data => {
      return data
    },
  )

    // console.log(JSON.stringify(userFavSpecies, null, 2))


    const feature = userFavSpecies.map((el: InterventionData) => {
    const asc = makeInterventionGeoJson(
      el.location.type,
      JSON.parse(el.location.coordinates),
      true,
    )
    return asc.geoJSON
  })

  const geoJSON = {
    type: 'FeatureCollection',
    features: feature.length ? [...feature] : [],
  }


  useEffect(() => {
    if (PermissionStatus.DENIED === permissionStatus) {
      setPermissionAlert(true)
    } else {
      setTimeout(() => {
        getInitalLocation()
      }, 300)
      setPermissionAlert(false)
    }
  }, [permissionStatus])

  const getInitalLocation = async () => {
    const {lat, long} = await getUserLocation()
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
      zoomLevel: 15,
      animationDuration: 1000,
    })
  }

  // const abc = () => {
  //   cameraRef.current.fitBounds(
  //     [-90.1572346345325, 18.754657188433],
  //     [-90.108707013427, 18.7934231781247],
  //     40,
  //     1000,
  //   )
  // }

  if (showPermissionAlert) {
    return null
  }

  return (
    <MapLibreGL.MapView
      style={styles.map}
      logoEnabled={false}
      styleURL={JSON.stringify(MapStyle)}>
      <MapLibreGL.Camera ref={cameraRef} />
      <MapLibreGL.UserLocation minDisplacement={5} />
      <MapShapeSource geoJSON={geoJSON.features}/>
    </MapLibreGL.MapView>
  )
}

export default DisplayMap


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    alignSelf: 'stretch',
  },
})
