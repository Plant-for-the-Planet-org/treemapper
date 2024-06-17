import { StyleProp } from 'react-native'
import React from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'


const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 4,
  lineOpacity: 1,
  lineJoin: 'bevel',
}

interface Props {
  geoJSON: any
}

const PlotShapeSource = (props: Props) => {
  const { geoJSON } = props
  return (
    <MapLibreGL.ShapeSource
      id={'plot-polygon'}
      shape={geoJSON}>
      <MapLibreGL.FillLayer
        id={'plot-polyfill'}
        style={{
          fillOpacity: 0.3,
          fillColor: Colors.MULTI_TREE
        }}
      />
      <MapLibreGL.LineLayer
        id={'plot-poline'}
        style={{
          ...polyline, lineColor: Colors.NEW_PRIMARY
        }}
      />
    </MapLibreGL.ShapeSource>
  )
}
export default PlotShapeSource
