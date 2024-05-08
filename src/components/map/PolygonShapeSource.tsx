import { StyleProp } from 'react-native'
import React from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'


const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineOpacity: 1,
  lineJoin: 'bevel',
}

interface Props {
  geoJSON: any
  onShapeSourcePress: (id: string) => void
}

const FillColor: any = [
  'match',
  ['get', 'key'],
  'single-tree-registration', Colors.SINGLE_TREE,
  'multi-tree-registration', Colors.MULTI_TREE,
  'removal-invasive-species', Colors.INVASIVE_SPECIES,
  'fire-suppression', Colors.FIRE_SUPRESSION,
  'fire-patrol', Colors.FIRE_PATROL,
  'fencing', Colors.FENCING,
  'marking-regenerant', Colors.MARKING_REGENERANT,
  'liberating-regenerant', Colors.LIBERATING_REGENERANT,
  'grass-suppression', Colors.GRASS_SUPRESSION,
  'firebreaks', Colors.FIREBREAKS,
  'assisting-seed-rain', Colors.SEED_RAIN,
  'soil-improvement', Colors.SOIL_IMPROVEMENT,
  'stop-tree-harvesting', Colors.STOP_HARVESTING,
  'direct-seeding', Colors.DIRECT_SEEDING,
  'enrichement-planting', Colors.ENRICHMENT_PLANTING,
  'other-intervention', Colors.OTHER_INTERVENTION,
  'maintenance', Colors.MAINTAINEANCE,
  Colors.SINGLE_TREE
]

const PolygonShapeSource = (props: Props) => {
  const { geoJSON, onShapeSourcePress } = props
  return (
    <MapLibreGL.ShapeSource
      id={'polygon'}
      shape={geoJSON}
      onPress={(e) => {
        if (e && e.features && e.features[0]) {
          onShapeSourcePress(e.features[0].properties.id || '')
        }
      }}>
      <MapLibreGL.FillLayer
        id={'polyFill'}
        style={{
          fillOpacity: 0.5,
          fillColor: FillColor
        }}
        filter={['all', ['==', ['get', 'site'], false], ['==', ['geometry-type'], 'Polygon']]}
      />
      <MapLibreGL.LineLayer
        id={'polyline'}
        style={{
          ...polyline, lineColor: FillColor
        }}
        filter={['all', ['==', ['get', 'site'], false], ['==', ['geometry-type'], 'Polygon']]}
      />
      <MapLibreGL.SymbolLayer id={'iconset'} style={{
        iconAllowOverlap:true,
        iconImage: [
          'match',
          ['get', 'key'],
          'single-tree-registration',
          'single-tree-registration',
          'soil-improvement',
          'soil-improvement',
          'fire-patrol',
          'fire-patrol',
          'single-tree-registration',
        ]
      }}
        filter={['==', ['get', 'site'], true]}
      />
      <MapLibreGL.CircleLayer id={'singleSelectedPolyCircle'} style={{ circleOpacity: 0.8, circleColor: FillColor }} filter={['all', ["==", ["geometry-type"], "Point"], ['==', ['get', 'site'], false]]} />
    </MapLibreGL.ShapeSource>
  )
}
export default PolygonShapeSource
