import { StyleProp } from 'react-native'
import React from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'


const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineOpacity: 1,
  lineJoin: 'bevel',
}
const fillStyle = { fillOpacity: 0.5}
const circleStyle = { circleColor: Colors.PRIMARY_DARK, circleOpacity: 0.8 };

interface Props {
  geoJSON: any
  onShapeSourcePress: (id: string) => void
}

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
        style={{...fillStyle,
          fillColor: [
            'match',
            ['get', 'key'],
            'single-tree-registration', Colors.VIBRANT_YELLOW,
  'multi-tree-registration', Colors.PRIMARY,
  'removal-invasive-species', Colors.VIVID_RED,
  'fire-suppression', Colors.BRIGHT_ORANGE,
  'fire-patrol', Colors.ELECTRIC_PURPLE,
  'fencing', Colors.ROYAL_BLUE,
  'marking-regenerant', Colors.TURQUOISE_BLUE,
  'liberating-regenerant', Colors.EMERALD_GREEN,
  'grass-suppression', Colors.LIME_GREEN,
  'firebreaks', Colors.SUNSHINE_YELLOW,
  'assisting-seed-rain', Colors.TANGERINE_ORANGE,
  'soil-improvement', Colors.RUBY_RED,
  'stop-tree-harvesting', Colors.MAGENTA_PINK,
  'direct-seeding',Colors.SAPPHIRE_BLUE,
  'enrichement-planting', Colors.SAPPHIRE_BLUE,
  'other-intervention', Colors.AQUAMARINE_BLUE,
  'maintenance', Colors.JADE_GREEN,
            Colors.VIBRANT_YELLOW
          ]
        }}
        filter={['all', ['==', ['get', 'site'], false], ['==', ['geometry-type'], 'Polygon']]}
        />
      <MapLibreGL.LineLayer
        id={'polyline'}
        style={{...polyline,lineColor: [
          'match',
          ['get', 'key'],
          'single-tree-registration', Colors.VIBRANT_YELLOW,
'multi-tree-registration', Colors.PRIMARY,
'removal-invasive-species', Colors.VIVID_RED,
'fire-suppression', Colors.BRIGHT_ORANGE,
'fire-patrol', Colors.ELECTRIC_PURPLE,
'fencing', Colors.ROYAL_BLUE,
'marking-regenerant', Colors.TURQUOISE_BLUE,
'liberating-regenerant', Colors.EMERALD_GREEN,
'grass-suppression', Colors.LIME_GREEN,
'firebreaks', Colors.SUNSHINE_YELLOW,
'assisting-seed-rain', Colors.TANGERINE_ORANGE,
'soil-improvement', Colors.RUBY_RED,
'stop-tree-harvesting', Colors.MAGENTA_PINK,
'direct-seeding',Colors.SAPPHIRE_BLUE,
'enrichement-planting', Colors.SAPPHIRE_BLUE,
'other-intervention', Colors.AQUAMARINE_BLUE,
'maintenance', Colors.JADE_GREEN,
          Colors.VIBRANT_YELLOW
        ]}}
        filter={['all', ['==', ['get', 'site'], false], ['==', ['geometry-type'], 'Polygon']]}
        />
         <MapLibreGL.SymbolLayer id={'iconset'} style={{
        iconImage: [
          'match',
          ['get', 'key'],
          'single-tree-registration',
          'single-tree-registration',
          'multi-tree-registration',
          'multi-tree-registration',
          'fire-patrol',
          'fire-patrol',
          'single-tree-registration',
        ]
      }}
      filter={['all', ['<=', ['zoom'], 12], ['==', ['get', 'site'], true]]}
      />
      <MapLibreGL.CircleLayer id={'singleSelectedPolyCircle'} style={circleStyle} filter={["==", ["geometry-type"], "Point"]}/>
    </MapLibreGL.ShapeSource>
  )
}

export default PolygonShapeSource
