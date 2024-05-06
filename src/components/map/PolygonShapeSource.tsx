import { StyleProp } from 'react-native'
import React from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'


const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineOpacity: 0.5,
  lineJoin: 'bevel',
  lineColor: Colors.PRIMARY
}
const fillStyle = { fillOpacity: 0.3, fillColor: Colors.PRIMARY }
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
        style={fillStyle}
        filter={['all', ['==', ['get', 'site'], false], ['==', ['geometry-type'], 'Polygon']]}
        />
      <MapLibreGL.LineLayer
        id={'polyline'}
        style={polyline}
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
