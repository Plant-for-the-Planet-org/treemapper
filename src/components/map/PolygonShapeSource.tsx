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
          console.log(e.features[0].properties.id)
          onShapeSourcePress(e.features[0].properties.id || '')
        }
      }}>
      <MapLibreGL.FillLayer
        id={'polyFill'}
        style={fillStyle}
      />
      <MapLibreGL.LineLayer
        id={'polyline'}
        style={polyline}
      />
    </MapLibreGL.ShapeSource>
  )
}

export default PolygonShapeSource
