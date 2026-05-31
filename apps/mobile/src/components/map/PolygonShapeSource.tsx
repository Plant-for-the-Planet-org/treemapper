import { StyleProp } from 'react-native'
import React from 'react'
import { GeoJSONSource, Layer, LineLayerStyle, PressEventWithFeatures } from '@maplibre/maplibre-react-native'
import { NativeSyntheticEvent } from 'react-native'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { FillColor, NEW_PRIMARY, WHITE } from 'src/utils/constants/colors'


const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineOpacity: 1,
  lineJoin: 'bevel',
}

interface Props {
  geoJSON: any
  onShapeSourcePress: (id: string, isPlot?: boolean) => void
}



const PolygonShapeSource = (props: Props) => {
  const { geoJSON, onShapeSourcePress } = props
  const isSatellite = useSelector(
    (state: RootState) => state.displayMapState.mainMapView === 'SATELLITE'
  )
  const handlePress = (e: NativeSyntheticEvent<PressEventWithFeatures>) => {
    if (e.nativeEvent?.features?.[0]) {
      onShapeSourcePress(e.nativeEvent.features[0].properties.id || '', e.nativeEvent.features[0].properties.isPlot || false)
    }
  }
  return (
    <GeoJSONSource
      id={'polygon'}
      data={geoJSON}
      onPress={handlePress}>
      <Layer
        id={'polyFill'}
        type="fill"
        style={{
          fillOpacity: 0.5,
          fillColor: FillColor
        }}
        filter={['all', ['==', ['get', 'site'], false], ['==', ['geometry-type'], 'Polygon']]}
      />
      <Layer
        id={'polyline'}
        type="line"
        style={{
          ...polyline, lineColor: FillColor
        }}
        filter={['all', ['==', ['get', 'site'], false], ['==', ['geometry-type'], 'Polygon']]}
      />
      <Layer
        id={'singleSelectedPolyCircle'}
        type="circle"
        style={{
          circleOpacity: 0.8,
          circleColor: FillColor,
          circleStrokeWidth: 2,
          circleStrokeColor: isSatellite ? NEW_PRIMARY : WHITE,
        }}
        filter={['all', ["==", ["geometry-type"], "Point"], ['==', ['get', 'site'], false]]} />
      <Layer id={'entireSite'} type="circle" style={{
        circleOpacity: 0.9, circleColor: FillColor,
        circleStrokeWidth: 2,
        circleStrokeColor: isSatellite ? NEW_PRIMARY : WHITE,
        circleRadius: [
          'interpolate',
          ['linear'],
          ['zoom'],
          1, 1,
          4, 1,
          8, 5,
          12, 10,
          20, 5,
          22, 5
        ],
        circleTranslate: [0, 0]
      }}
        filter={['==', ['get', 'site'], true]}
      />
    </GeoJSONSource>
  )
}
export default PolygonShapeSource
