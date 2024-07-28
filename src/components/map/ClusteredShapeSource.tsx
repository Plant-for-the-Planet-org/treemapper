import { StyleProp } from 'react-native'
import React from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import OnPressEvent from '@maplibre/maplibre-react-native/javascript/types/OnPressEvent'
import { FillColor } from 'src/utils/constants/colors'




const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineOpacity: 0.8,
  lineJoin: 'bevel',
}

interface Props {
  geoJSON: any
  onShapeSourcePress: (id: string) => void
}

const ClusteredShapeSource = (props: Props) => {
  const { geoJSON, onShapeSourcePress } = props
  const handlePress = (e: OnPressEvent) => {
    if (e?.features?.[0]) {
      onShapeSourcePress(e.features[0].properties.id || '');
    }
  }
  return (
    <MapLibreGL.ShapeSource
      id={'polygon_cluster'}
      shape={geoJSON}
      onPress={handlePress}>
      <MapLibreGL.FillLayer
        id={'inactivePolyFill'} // Unique ID for inactive FillLayer
        style={{
          fillOpacity: [
            'match',
            ['get', 'active'],
            'true', 0.5,
            0.2],
          fillColor: FillColor
        }}
      />
      <MapLibreGL.LineLayer
        id={'polygon_cluster_line'}
        style={{ ...polyline, lineColor: FillColor }}
      />
    </MapLibreGL.ShapeSource>
  )
}

export default ClusteredShapeSource