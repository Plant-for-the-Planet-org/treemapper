import { StyleProp } from 'react-native'
import React from 'react'
import { GeoJSONSource, Layer, LineLayerStyle, PressEventWithFeatures } from '@maplibre/maplibre-react-native'
import { NativeSyntheticEvent } from 'react-native'
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
  const handlePress = (e: NativeSyntheticEvent<PressEventWithFeatures>) => {
    if (e.nativeEvent?.features?.[0]) {
      onShapeSourcePress(e.nativeEvent.features[0].properties.id || '');
    }
  }
  return (
    <GeoJSONSource
      id={'polygon_cluster'}
      data={geoJSON}
      onPress={handlePress}>
      <Layer
        id={'inactivePolyFill'}
        type="fill"
        style={{
          fillOpacity: [
            'match',
            ['get', 'active'],
            'true', 0.5,
            0.2],
          fillColor: FillColor
        }}
        filter={['all', ["!=", ["geometry-type"], "Point"]]}
      />
      <Layer
        id={'polygon_cluster_line'}
        type="line"
        style={{ ...polyline, lineColor: FillColor }}
        filter={['all', ["!=", ["geometry-type"], "Point"]]}
      />
      <Layer id={'singleEntire'} type="circle" style={{ circleOpacity: 0.8, circleColor: FillColor }} filter={['all', ["==", ["geometry-type"], "Point"]]} />
    </GeoJSONSource>
  )
}

export default ClusteredShapeSource