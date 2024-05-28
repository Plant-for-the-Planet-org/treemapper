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
import { updateActiveIndex, updateActiveInterventionIndex, updateAdjacentIntervention, updateSelectedIntervention } from 'src/store/slice/displayMapSlice'
import { scaleSize } from 'src/utils/constants/mixins'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import bbox from '@turf/bbox'
import SiteMapSource from './SiteMapSource'
import PolygonShapeSource from './PolygonShapeSource'
import { GeoBox } from 'realm'
import ClusterdShapSource from './ClusterdShapSource'
import SingleInterventionSource from './SingleInterventionSource'
import { filterToTime } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import { getRandomPointInPolygon } from 'src/utils/helpers/genratePointInPolygon'


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
  const [overlayGeoJSON, setOverlayGeoJSON] = useState({
    type: 'FeatureCollection',
    features: [],
  })
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const MapBounds = useSelector((state: RootState) => state.mapBoundState)
  const { selectedIntervention, activeIndex, adjacentIntervention, showOverlay, activeInterventionIndex, interventionFilter, selectedFilters } = useSelector(
    (state: RootState) => state.displayMapState,
  )

  const dispatch = useDispatch()
  const cameraRef = useRef<Camera>(null)
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const interventionData = useQuery<InterventionData>(
    RealmSchema.Intervention,
    data => {
      return data.filtered('is_complete==true')
    },
  )

  // console.log(JSON.stringify(interventionData, null, 2))

  useEffect(() => {
    if (interventionFilter === 'none') {
      handleGeoJSONData([])
      return
    }
    if (interventionData && interventionData.length) {
      handleGeoJSONData(interventionData)
    }
  }, [interventionData, interventionFilter, selectedFilters])





  useEffect(() => {
    requestLocationPermission()
  }, [])


  const handleGeoJSONData = (d: InterventionData[] | any) => {
    const dateFilter = filterToTime(interventionFilter)
    const filterData = d.filter(el => el.intervention_date >= dateFilter && selectedFilters.includes(el.intervention_key))
    const feature = filterData.map((el: InterventionData, index: number) => {
      const result = makeInterventionGeoJson(
        el.location.type,
        JSON.parse(el.location.coordinates),
        el.intervention_id,
        {
          key: el.intervention_key,
          site: el.entire_site
        }
      )
      if (el.entire_site) {
        const newCoords = getRandomPointInPolygon(JSON.parse(el.location.coordinates), index)
        result.geoJSON.geometry.type = "Point"
        result.geoJSON.geometry.coordinates = newCoords
      }
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
        50,
        1000,
      )
    }
  }


  useEffect(() => {
    if (showOverlay) {
      handleActiveInterventionChange()
    }
  }, [showOverlay, activeInterventionIndex])

  const setSelectedGeoJson = (id: string) => {
    const intervention = realm.objectForPrimaryKey<InterventionData>(
      RealmSchema.Intervention,
      id,
    )
    const { geoJSON } = makeInterventionGeoJson(intervention.location_type, JSON.parse(intervention.location.coordinates), intervention.intervention_id)
    const bounds = bbox(geoJSON)
    getBoundsAndSetIntervention(bounds, intervention)
    dispatch(updateMapBounds({ bodunds: bounds, key: 'DISPLAY_MAP' }))
    dispatch(updateSelectedIntervention(JSON.stringify(intervention)))
  }

  const setActiveIntervetnion = (id: string) => {
    const index = adjacentIntervention.findIndex(el => el.intervention_id === id)
    dispatch(updateActiveInterventionIndex(index))
  }

  const getBoundsAndSetIntervention = async (bound: any, currentIntervention: InterventionData) => {
    try {
      const query = currentIntervention.entire_site ? "coords geoWithin $0 && entire_site == true" : "coords geoWithin $0"
      const boxBounds: GeoBox = {
        bottomLeft: [bound[0], bound[1]],
        topRight: [bound[2], bound[3]],
      };
      const data = realm.objects<InterventionData>(RealmSchema.Intervention).filtered(query, boxBounds);
      const feature = []
      const updatedData = JSON.parse(JSON.stringify(data.filter(el => el.intervention_id !== currentIntervention.intervention_id)))
      currentIntervention.active = true;
      updatedData.unshift(JSON.parse(JSON.stringify(currentIntervention)))
      updatedData.forEach((el: InterventionData) => {
        if (el.location_type === 'Polygon') {
          const result = makeInterventionGeoJson(
            el.location.type,
            JSON.parse(el.location.coordinates),
            el.intervention_id,
            {
              active: el.active ? 'true' : 'false',
              key: el.intervention_key
            }
          )
          feature.push(result.geoJSON)
        }
      })
      setOverlayGeoJSON({
        type: 'FeatureCollection',
        features: [...feature],
      })
      dispatch(updateAdjacentIntervention(updatedData))
    } catch (err) {
      console.log("errorr rerr", err)
    }
  }

  const handleActiveInterventionChange = () => {
    const intervention = adjacentIntervention[activeInterventionIndex];
    if (intervention && !intervention.location_type || !intervention) {
      return
    }
    const { geoJSON } = makeInterventionGeoJson(intervention.location_type, JSON.parse(intervention.location.coordinates), intervention.intervention_id)
    const bounds = bbox(geoJSON)
    dispatch(updateMapBounds({ bodunds: bounds, key: 'DISPLAY_MAP' }))
    dispatch(updateSelectedIntervention(JSON.stringify(intervention)))
    const feature = []
    const updatedData = adjacentIntervention.map(el => {
      const updateActive = { ...el }
      if (el.intervention_id === intervention.intervention_id) {
        updateActive.active = true
      } else {
        updateActive.active = false
      }
      return updateActive;
    })
    updatedData.forEach((el: InterventionData) => {
      if (el.location_type === 'Polygon') {
        const result = makeInterventionGeoJson(
          el.location.type,
          JSON.parse(el.location.coordinates),
          el.intervention_id,
          {
            active: el.active ? 'true' : 'false',
            key: el.intervention_key
          }
        )
        feature.push(result.geoJSON)
      }
    })
    setOverlayGeoJSON({
      type: 'FeatureCollection',
      features: [...feature],
    })
  }


  const handleMarkerPress = (i: number) => {
    dispatch(updateActiveIndex(i))
  }

  const renderIcons = useCallback(
    () => {
      return <MapLibreGL.Images images={{ 'single-tree-registration': SingleTreePin, 'soil-improvement': MultiTreePin, 'fire-patrol': RemovalPin }}>
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
      ref={mapRef}
      compassViewMargins={{ x: scaleSize(28), y: scaleSize(300) }}
      styleURL={JSON.stringify(MapStyle)}>
      <MapLibreGL.Camera ref={cameraRef} />
      <MapLibreGL.UserLocation minDisplacement={5} />
      {renderIcons()}
      {!showOverlay && selectedIntervention.length === 0 ? <PolygonShapeSource geoJSON={geoJSON}
        onShapeSourcePress={setSelectedGeoJson} /> :
        showOverlay ?
          <ClusterdShapSource geoJSON={overlayGeoJSON}
            onShapeSourcePress={setActiveIntervetnion} /> : null}
      <SiteMapSource />
      {selectedIntervention && (
        <MapMarkers
          sampleTreeData={JSON.parse(selectedIntervention).sample_trees} hasSampleTree={JSON.parse(selectedIntervention).has_sample_trees} activeIndex={activeIndex} showActive onMarkerPress={handleMarkerPress} overLay={showOverlay} />
      )}
      {selectedIntervention && !showOverlay ? (
        <SingleInterventionSource intervetnion={JSON.parse(selectedIntervention)} />
      ) : null}
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
