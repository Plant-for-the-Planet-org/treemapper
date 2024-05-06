import { StyleSheet } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import MapLibreGL, { Camera } from '@maplibre/maplibre-react-native'
import useLocationPermission from 'src/hooks/useLocationPermission'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { useQuery, useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import { InterventionData } from 'src/types/interface/slice.interface'
import MapMarkers from './MapMarkers'
import { updateActiveIndex, updateSelectedIntervention } from 'src/store/slice/displayMapSlice'
import { scaleSize } from 'src/utils/constants/mixins'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import bbox from '@turf/bbox'
import SiteMapSource from './SiteMapSource'
import PolygonShapeSource from './PolygonShapeSource'


const MultiTreePin = require('assets/images/icons/MultTreePin.png');
const SingleTreePin = require('assets/images/icons/SingleTreePin.png');
const RemovalPin = require('assets/images/icons/RemovalPin.png');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

const DisplayMap = () => {
  const realm = useRealm()
  const { requestLocationPermission } = useLocationPermission()
  const [geoJSON, setGeoJSON] = useState({
    type: 'FeatureCollection',
    features: [],
  })
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const MapBounds = useSelector((state: RootState) => state.mapBoundState)
  const { selectedIntervention, activeIndex } = useSelector(
    (state: RootState) => state.displayMapState,
  )

  const dispatch = useDispatch()
  const cameraRef = useRef<Camera>(null)

  const interventionData = useQuery<InterventionData>(
    RealmSchema.Intervention,
    data => {
      return data
    },
  )

  // console.log(JSON.stringify(interventionData, null, 2))

  useEffect(() => {
    if (interventionData && interventionData.length) {
      handleGeoJSONData(interventionData)
    }
  }, [interventionData])





  useEffect(() => {
    requestLocationPermission()
  }, [])


  const handleGeoJSONData = (d: InterventionData[] | any) => {
    const feature = d.map((el: InterventionData) => {
      const result = makeInterventionGeoJson(
        el.location.type,
        JSON.parse(el.location.coordinates),
        el.intervention_id,
        {
          key: el.intervention_key,
          site: el.entire_site
        }
      )
      return result.geoJSON
    })
    setGeoJSON({
      type: 'FeatureCollection',
      features: feature.length ? [...feature] : [],
    })
  }


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
      zoomLevel: 20,
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
        30,
        1000,
      )
    }
  }

  const setSelectedGeoJson = (id: string) => {
    const intervention = realm.objectForPrimaryKey<InterventionData>(
      RealmSchema.Intervention,
      id,
    )
    const { geoJSON } = makeInterventionGeoJson(intervention.location_type, JSON.parse(intervention.location.coordinates), intervention.intervention_id)
    const bounds = bbox(geoJSON)
    dispatch(updateMapBounds({ bodunds: bounds, key: 'DISPLAY_MAP' }))
    dispatch(updateSelectedIntervention(JSON.stringify(intervention)))
  }

  const handleMarkerPress = (i: number) => {
    dispatch(updateActiveIndex(i))
  }

  const renderIcons = useCallback(
    () => {
      return <MapLibreGL.Images images={{ 'single-tree-registration': SingleTreePin, 'multi-tree-registration': MultiTreePin, 'fire-patrol': RemovalPin }}>
        <React.Fragment />
      </MapLibreGL.Images>
    },
    [],
  )

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
      {renderIcons()}
      <PolygonShapeSource geoJSON={geoJSON}
        onShapeSourcePress={setSelectedGeoJson} />
      <SiteMapSource />
      {selectedIntervention && (
        <MapMarkers
          sampleTreeData={JSON.parse(selectedIntervention).sample_trees} hasSampleTree={JSON.parse(selectedIntervention).has_sample_trees} activeIndex={activeIndex} showActive onMarkerPress={handleMarkerPress} />
      )}
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
