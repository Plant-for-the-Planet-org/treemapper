import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useRef } from 'react'
import MapLibreGL, { Camera } from '@maplibre/maplibre-react-native'
import { SampleTree } from 'src/types/interface/slice.interface'
// import MapMarkers from './MapMarkers'
import MapShapeSource from './MapShapeSource'
import bbox from '@turf/bbox'
import { Colors } from 'src/utils/constants'
import MapMarkers from './MapMarkers'
import PenIcon from 'assets/images/svg/PenIcon.svg'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('../../../assets/mapStyle/mapStyleOutput.json')

interface Props {
  geoJSON: any
  has_sample_trees: boolean
  sampleTrees: SampleTree[]
  openPolygon: () => void
  showEdit: boolean
  isEntireSite: boolean
}

const PreviewMap = (props: Props) => {
  const { geoJSON, has_sample_trees, sampleTrees, openPolygon, showEdit, isEntireSite } = props
  const cameraRef = useRef<Camera>(null)


  const handleCamera = () => {
    const bounds = bbox(geoJSON.features[0].geometry)
    cameraRef.current.fitBounds(
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
      20,
      1000,
    )
  }

  const handlePress = () => {
    return
  }
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <MapLibreGL.MapView
          style={styles.map}
          attributionEnabled={false}
          logoEnabled={false}
          scrollEnabled={false}
          onDidFinishLoadingMap={handleCamera}
          styleURL={JSON.stringify(MapStyle)}>
          <MapLibreGL.Camera ref={cameraRef} />
          <MapShapeSource
            geoJSON={geoJSON.features}
            onShapeSourcePress={handlePress}
          />
          {has_sample_trees && <MapMarkers sampleTreeData={sampleTrees} hasSampleTree={has_sample_trees} />}
        </MapLibreGL.MapView>
        {showEdit && isEntireSite?<TouchableOpacity style={styles.deleteWrapperIcon} onPress={openPolygon}>
          <PenIcon width={30} height={30} />
        </TouchableOpacity>: null}
      </View>

    </View>
  )
}

export default PreviewMap

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
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
})
