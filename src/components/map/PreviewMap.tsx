import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useRef } from 'react'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { InterventionData, SampleTree } from 'src/types/interface/slice.interface'
// import MapMarkers from './MapMarkers'
import MapShapeSource from './MapShapeSource'
import bbox from '@turf/bbox'
import { Colors, Typography } from 'src/utils/constants'
import MapMarkers from './MapMarkers'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import AddIcon from 'assets/images/svg/AddIcon.svg'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import { updateBoundary } from 'src/store/slice/sampleTreeSlice'
import { useDispatch } from 'react-redux'
import { v4 as uuid } from 'uuid'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import i18next from 'src/locales/index'
import MapMarkersCircle from './MapMarkersCircle'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('../../../assets/mapStyle/mapStyleOutput.json')

interface Props {
  geoJSON: any
  has_sample_trees: boolean
  sampleTrees: SampleTree[]
  openPolygon: () => void
  showEdit: boolean
  isEntireSite: boolean
  intervention: InterventionData
}

const PreviewMap = (props: Props) => {
  const { geoJSON, has_sample_trees, sampleTrees, openPolygon, showEdit, isEntireSite, intervention } = props
  const cameraRef = useRef<MapLibreGL.Camera>(null)
  const dispatch = useDispatch()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const handleCamera = () => {
    const bounds = bbox(geoJSON.features[0].geometry)
    cameraRef.current.fitBounds(
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
      20,
      1000,
    )
  }

  const addAnotherTree = () => {
    const bounds = bbox(geoJSON)
    dispatch(updateBoundary({ coord: JSON.parse(intervention.location.coordinates), id: uuid(), form_ID: intervention.form_id, }))
    dispatch(updateMapBounds({ bounds: bounds, key: 'POINT_MAP' }))
    navigation.navigate('PointMarker', { id: intervention.intervention_id })
  }



  const handlePress = () => {
    return
  }

  const viewTreeDetails = async (_i: number, d: SampleTree) => {
    navigation.navigate("ReviewTreeDetails", { detailsCompleted: false, interventionID: d.tree_id, synced: true, id: d.intervention_id })
  }
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <MapLibreGL.MapView
          style={styles.map}
          attributionEnabled={false}
          logoEnabled={false}
          onDidFinishLoadingMap={handleCamera}
          styleURL={JSON.stringify(MapStyle)}>
          <MapLibreGL.Camera ref={cameraRef} />
          <MapShapeSource
            geoJSON={geoJSON.features}
            onShapeSourcePress={handlePress}
          />
          {intervention.location_type === 'Polygon' && !intervention.entire_site ? <MapMarkersCircle coordinates={JSON.parse(intervention.location.coordinates)} /> : null}
          {has_sample_trees && <MapMarkers sampleTreeData={sampleTrees} hasSampleTree={has_sample_trees} onMarkerPress={viewTreeDetails} showNumber />}
        </MapLibreGL.MapView>
        {showEdit && !isEntireSite ? <TouchableOpacity style={styles.deleteWrapperIcon} onPress={openPolygon}>
          <PenIcon width={30} height={30} />
        </TouchableOpacity> : null}

        {intervention && intervention.has_sample_trees && !intervention.is_complete && intervention.location.type !== 'Point' ? <TouchableOpacity style={styles.plusIconWrapper} onPress={addAnotherTree}>
          <Text style={styles.sampleTreeLabel}>{i18next.t("label.sample_tree")}</Text>
          <AddIcon width={12} height={12} fill={Colors.NEW_PRIMARY} />
        </TouchableOpacity> : null}
      </View>

    </View>
  )
}

export default PreviewMap

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.GRAY_TEXT
  },
  map: {
    flex: 1,
  },
  deleteWrapperIcon: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.GRAY_BACKDROP,
    marginLeft: 10,
    borderRadius: 8,
    position: 'absolute',
    top: 10,
    right: 10
  },
  plusIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderRadius: 8,
    position: 'absolute',
    top: 10,
    left: 0,
    flexDirection: 'row',
    paddingHorizontal: 10,
    height: 35,
    backgroundColor: Colors.NEW_PRIMARY + '1A'
  },
  sampleTreeLabel: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    color: Colors.NEW_PRIMARY,
    marginRight: 5
  }
})
