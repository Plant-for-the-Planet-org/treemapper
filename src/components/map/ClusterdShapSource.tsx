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
const activeFillStyle = { fillOpacity: 0.8, fillColor: Colors.PRIMARY }
const dullStyle = { fillOpacity: 0.8, fillColor: Colors.NEW_PRIMARY+'1A' }

interface Props {
  geoJSON: any
  onShapeSourcePress: (id: string) => void
}

const ClusterdShapSource = (props: Props) => {
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
        id={'inactivePolyFill'} // Unique ID for inactive FillLayer
        filter={['==', ['get', 'active'], false]}
        style={dullStyle}
      />
      <MapLibreGL.FillLayer
        id={'activePolyFill'} // Unique ID for active FillLayer
        filter={['==', ['get', 'active'], true]}
        style={activeFillStyle}
      />
      <MapLibreGL.LineLayer
        id={'polyline'}
        style={polyline}
      />
    </MapLibreGL.ShapeSource>
  )
}

export default ClusterdShapSource