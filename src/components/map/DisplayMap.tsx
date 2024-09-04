import { StyleSheet } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { useQuery, useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import { InterventionData, MonitoringPlot } from 'src/types/interface/slice.interface'
import MapMarkers from './MapMarkers'
import { updateActiveIndex, updateActiveInterventionIndex, updateAdjacentIntervention, updateSelectedIntervention } from 'src/store/slice/displayMapSlice'
import { scaleSize } from 'src/utils/constants/mixins'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import bbox from '@turf/bbox'
import SiteMapSource from './SiteMapSource'
import PolygonShapeSource from './PolygonShapeSource'
import { GeoBox } from 'realm'
import ClusteredShapeSource from './ClusteredShapeSource'
import SingleInterventionSource from './SingleInterventionSource'
import { filterToTime } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import MapMarkersOverlay from './MapMarkersOverlay'
import SatelliteLayer from 'assets/mapStyle/satelliteView'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

const DisplayMap = () => {
  const realm = useRealm()
  const [overlayGeoJSON, setOverlayGeoJSON] = useState({
    type: 'FeatureCollection',
    features: [],
  })
  const currentUserLocation = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const userType = useSelector(
    (state: RootState) => state.userState.type,
  )
  const MapBounds = useSelector((state: RootState) => state.mapBoundState)
  const { onlyRemeasurement, showPlots, mainMapView, selectedIntervention, activeIndex, adjacentIntervention, showOverlay, activeInterventionIndex, interventionFilter, selectedFilters } = useSelector(
    (state: RootState) => state.displayMapState,
  )
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const cameraRef = useRef<MapLibreGL.Camera>(null)
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const interventionData = useQuery<InterventionData>(
    RealmSchema.Intervention,
    data => {
      return data.filtered('is_complete==true')
    },
  )
  const plotData = []


  const handleGeoJSONData = () => {
    const dateFilter = filterToTime(interventionFilter)
    const filterData = interventionData.filter(el => el.intervention_date >= dateFilter && selectedFilters.includes(el.intervention_key)).filter(el => {
      if (onlyRemeasurement && userType === 'tpo') {
        return el.remeasurement_required === true
      }
      return el
    })

    const feature = filterData.map((el: InterventionData) => {
      const result = makeInterventionGeoJson(
        el.location.type,
        JSON.parse(el.location.coordinates),
        el.intervention_id,
        {
          key: el.remeasurement_required && userType === 'tpo' ? 'remeasurement' : el.intervention_key,
          site: el.entire_site,
        }
      )
      return result.geoJSON
    })
    let f = feature
    let m = displayPlots()
    if (!showPlots) {
      m = []
    }
    if (interventionFilter === 'none') {
      f = []
    }
    return [...m, ...f]
  }
  const displayPlots = () => {
    const feature = plotData.map((el: MonitoringPlot) => {
      const coords = JSON.parse(el.location.coordinates)
      const result = {
        "type": "Feature",
        "properties": {
          "id": el.plot_id,
          "key": "single-tree-registration",
          "site": false,
          "isPlot": true
        },
        "geometry": {
          "coordinates": coords,
          "type": "Polygon"
        }
      }
      return result
    })
    return feature
  }

  useEffect(() => {
    if (cameraRef?.current !== null) {
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
    } else {
      handleCamera()
    }
  }


  useEffect(() => {
    if (showOverlay) {
      handleActiveInterventionChange()
    }
  }, [showOverlay, activeInterventionIndex])

  const setSelectedGeoJson = (id: string, isPlot: boolean) => {
    if (isPlot) {
      navigation.navigate('PlotDetails', { id })
      return
    }
    const intervention = realm.objectForPrimaryKey<InterventionData>(
      RealmSchema.Intervention,
      id,
    )
    const { geoJSON } = makeInterventionGeoJson(intervention.location_type, JSON.parse(intervention.location.coordinates), intervention.intervention_id)
    const bounds = bbox(geoJSON)
    getBoundsAndSetIntervention(bounds, intervention)
    dispatch(updateMapBounds({ bounds: bounds, key: 'DISPLAY_MAP' }))
    dispatch(updateSelectedIntervention(JSON.stringify(intervention)))
  }

  const setActiveIntervention = (id: string) => {
    const index = adjacentIntervention.findIndex(el => el.intervention_id === id)
    dispatch(updateActiveInterventionIndex(index))
  }

  const getBoundsAndSetIntervention = async (bound: any, currentIntervention: InterventionData) => {
    try {
      const query = currentIntervention.entire_site ? "entire_site == true" : "coords geoWithin $0"
      const boxBounds: GeoBox = {
        bottomLeft: [bound[0], bound[1]],
        topRight: [bound[2], bound[3]],
      };
      const data = realm.objects<InterventionData>(RealmSchema.Intervention).filtered(query, boxBounds);
      const feature = []
      const updatedData = currentIntervention.entire_site ? [] : JSON.parse(JSON.stringify(data.filter(el => el.intervention_id !== currentIntervention.intervention_id)))
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
              key: el.remeasurement_required && userType === 'tpo' ? 'remeasurement' : el.intervention_key,
            }
          )
          feature.push(result.geoJSON)
        }
        if (el.location_type === 'Point') {
          const result = makeInterventionGeoJson(
            el.location.type,
            JSON.parse(el.location.coordinates),
            el.intervention_id,
            {
              active: el.active ? 'true' : 'false',
              key: el.intervention_key,
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
    } catch (error) {
      //error
    }
  }

  const handleActiveInterventionChange = () => {
    const intervention = adjacentIntervention[activeInterventionIndex];
    if (intervention && !intervention.location_type || !intervention) {
      return
    }
    const { geoJSON } = makeInterventionGeoJson(intervention.location_type, JSON.parse(intervention.location.coordinates), intervention.intervention_id)
    const bounds = bbox(geoJSON)
    dispatch(updateMapBounds({ bounds: bounds, key: 'DISPLAY_MAP' }))
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
            key: el.remeasurement_required && userType === 'tpo' ? 'remeasurement' : el.intervention_key,
          }
        )
        feature.push(result.geoJSON)
      }
      if (el.location_type === 'Point') {
        const result = makeInterventionGeoJson(
          el.location.type,
          JSON.parse(el.location.coordinates),
          el.intervention_id,
          {
            active: el.active ? 'true' : 'false',
            key: el.intervention_key,
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


  const renderShapeSource = () => {
    if (!showOverlay && selectedIntervention.length === 0) {
      return (
        <PolygonShapeSource
          geoJSON={{
            type: 'FeatureCollection',
            features: handleGeoJSONData()
          }}
          onShapeSourcePress={setSelectedGeoJson}
        />
      );
    } else if (showOverlay) {
      return (
        <ClusteredShapeSource
          geoJSON={overlayGeoJSON}
          onShapeSourcePress={setActiveIntervention}
        />
      );
    }
    return null;
  };

  const renderMapMarkers = () => {
    if (selectedIntervention) {
      const interventionData = JSON.parse(selectedIntervention);
      if (!showOverlay) {
        return (
          <MapMarkers
            sampleTreeData={interventionData.sample_trees}
            hasSampleTree={interventionData.has_sample_trees}
            activeIndex={activeIndex}
            showActive
            onMarkerPress={handleMarkerPress}
          />
        );
      } else {
        return (
          <MapMarkersOverlay
            sampleTreeData={interventionData.sample_trees}
            hasSampleTree={interventionData.has_sample_trees}
          />
        );
      }
    }
    return null;
  };

  const renderSingleInterventionSource = () => {
    if (selectedIntervention && !showOverlay) {
      return (
        <SingleInterventionSource
          intervention={JSON.parse(selectedIntervention)}
        />
      );
    }
    return null;
  };
  const mapStyleURL = JSON.stringify(mainMapView === 'SATELLITE' ? SatelliteLayer : MapStyle);

  return (
    <MapLibreGL.MapView
      style={styles.map}
      logoEnabled={false}
      compassViewPosition={3}
      attributionEnabled={false}
      ref={mapRef}
      compassViewMargins={{ x: scaleSize(28), y: scaleSize(300) }}
      styleURL={mapStyleURL}
    >
      <MapLibreGL.Camera ref={cameraRef} />
      <MapLibreGL.UserLocation
        showsUserHeadingIndicator
        androidRenderMode="gps"
        minDisplacement={1}
      />
      {renderShapeSource()}
      <SiteMapSource isSatellite={mainMapView === 'SATELLITE'} />
      {renderMapMarkers()}
      {renderSingleInterventionSource()}
    </MapLibreGL.MapView>
  );
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
