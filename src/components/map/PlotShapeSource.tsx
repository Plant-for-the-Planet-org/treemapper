import { StyleProp } from 'react-native'
import React from 'react'
import Maplibre, { LineLayerStyle } from '@maplibre/maplibre-react-native'
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
    <Maplibre.ShapeSource
      id={`plot-polygon-${isEdit}`}
      shape={geoJSON}>
      <Maplibre.FillLayer
        id={`plot-polyfill-${isEdit}`}
        style={{
          fillOpacity: 0.3,
          fillColor: isEdit ? Colors.TEXT_COLOR : Colors.MULTI_TREE
        }}
      />
      <Maplibre.LineLayer
        id={`plot-poline-${isEdit}`}
        style={{
          ...polyline, lineColor: isEdit ? Colors.TEXT_COLOR : Colors.NEW_PRIMARY
        }}
      />
    </Maplibre.ShapeSource>
  )
}
export default PlotShapeSource
