import { StyleSheet } from 'react-native'
import React, { useEffect, useRef } from 'react'
import MapLibreGL, { Camera } from '@maplibre/maplibre-react-native'
import useLocationPermission from 'src/hooks/useLocationPermission'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { useQuery, useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import { InterventionData } from 'src/types/interface/slice.interface'
import MapShapeSource from './MapShapeSource'
// import MapMarkers from './MapMarkers'
import { updateSelectedIntervention } from 'src/store/slice/displayMapSlice'
import { scaleSize } from 'src/utils/constants/mixins'
// import { Colors } from 'src/utils/constants'
// import SiteMapSource from './SiteMapSource'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

const DisplayMap = () => {
  const realm = useRealm()
  const { requestLocationPermission } = useLocationPermission()

  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const MapBounds = useSelector((state: RootState) => state.mapBoundState)
  // const {selectedIntervention} = useSelector(
  //   (state: RootState) => state.displayMapState,
  // )

  const dispatch = useDispatch()
  const cameraRef = useRef<Camera>(null)

  const interventionData = useQuery<InterventionData>(
    RealmSchema.Intervention,
    data => {
      return data
    },
  )

  // console.log(JSON.stringify(interventionData, null, 2))

  const feature = interventionData.map((el: InterventionData) => {
    const result = makeInterventionGeoJson(
      el.location.type,
      JSON.parse(el.location.coordinates),
      el.intervention_id,
    )
    return result.geoJSON
  })

  const geoJSON = {
    type: 'FeatureCollection',
    features: feature.length ? [...feature] : [],
  }

  useEffect(() => {
    requestLocationPermission()
  }, [])



  useEffect(() => {
    if (cameraRef && cameraRef.current !== null) {
      handleCameraViewChange()
    }
  }, [MapBounds])


  useEffect(() => {
    if (currentUserLocation && cameraRef.current !== null) {
      handleCamera()
    }
  }, [currentUserLocation])

  const handleCamera = () => {
    cameraRef.current.setCamera({
      centerCoordinate: [...currentUserLocation],
      zoomLevel: 17,
      animationDuration: 1000,
    })
  }

  const handleCameraViewChange = () => {
    const { bounds, key } = MapBounds
    if (bounds.length === 0) {
      return
    }
    if (key === 'DISPLAY_MAP') {
      cameraRef.current.fitBounds(
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
        40,
        1000,
      )
    }
  }

  const setSelectedGeoJson = (id: string) => {
    const intervention = realm.objectForPrimaryKey<InterventionData>(
      RealmSchema.Intervention,
      id,
    )
    dispatch(updateSelectedIntervention(JSON.stringify(intervention)))
  }

  return (
    <MapLibreGL.MapView
      style={styles.map}
      logoEnabled={false}
      compassViewPosition={3}
      attributionEnabled={false}
      compassViewMargins={{ x: scaleSize(28), y: scaleSize(300) }}
      styleURL={JSON.stringify(MapStyle)}>
      <MapLibreGL.Camera ref={cameraRef} />
      <MapLibreGL.UserLocation minDisplacement={5} />
      <MapShapeSource
        geoJSON={geoJSON.features}
        onShapeSourcePress={setSelectedGeoJson}
      />
      {/* <SiteMapSource /> */}
      {/* {selectedIntervention && (
        <MapMarkers
          sampleTreeData={JSON.parse(selectedIntervention).sample_trees}
        />
      )} */}
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
