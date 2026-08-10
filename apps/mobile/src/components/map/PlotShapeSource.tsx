import { StyleProp } from 'react-native'
import React from 'react'
import { GeoJSONSource, Layer, LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'


const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 3,
  lineOpacity: 1,
  lineJoin: 'bevel',
}

interface Props {
  geoJSON: any
  isEdit: boolean
}

const PlotShapeSource = (props: Props) => {
  const { geoJSON, isEdit } = props
  return (
    <GeoJSONSource
      id={`plot-polygon-${isEdit}`}
      data={geoJSON}>
      <Layer
        id={`plot-polyfill-${isEdit}`}
        type="fill"
        style={{
          fillOpacity: 0.3,
          fillColor: isEdit ? Colors.TEXT_COLOR : Colors.MULTI_TREE
        }}
      />
      <Layer
        id={`plot-poly_line-${isEdit}`}
        type="line"
        style={{
          ...polyline, lineColor: isEdit ? Colors.TEXT_COLOR : Colors.NEW_PRIMARY
        }}
      />
    </GeoJSONSource>
  )
}
export default PlotShapeSource
