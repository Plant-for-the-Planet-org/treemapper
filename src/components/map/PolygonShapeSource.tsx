import { StyleProp } from 'react-native'
import React from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import OnPressEvent from '@maplibre/maplibre-react-native/javascript/types/OnPressEvent'
import { FillColor } from 'src/utils/constants/colors'


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
  const handlePress = (e: OnPressEvent) => {
    if (e?.features?.[0]) {
      onShapeSourcePress(e.features[0].properties.id || '', e.features[0].properties.isPlot || false)
    }
  }
  return (
    <MapLibreGL.ShapeSource
      id={'polygon'}
      shape={geoJSON}
      onPress={handlePress}>
      <MapLibreGL.FillLayer
        id={'polyFill'}
        style={{
          fillOpacity: 0.5,
          fillColor: FillColor
        }}
        filter={['all', ['==', ['get', 'site'], false], ['==', ['geometry-type'], 'Polygon']]}
      />
      <MapLibreGL.LineLayer
        id={'polyline'}
        style={{
          ...polyline, lineColor: FillColor
        }}
        filter={['all', ['==', ['get', 'site'], false], ['==', ['geometry-type'], 'Polygon']]}
      />
      <MapLibreGL.CircleLayer id={'singleSelectedPolyCircle'} style={{ circleOpacity: 0.8, circleColor: FillColor }} filter={['all', ["==", ["geometry-type"], "Point"], ['==', ['get', 'site'], false]]} />
      <MapLibreGL.CircleLayer id={'entireSite'} style={{
        circleOpacity: 0.9, circleColor: FillColor, circleRadius: [
          'interpolate',
          ['linear'],
          ['zoom'],
          1, 1,   // At zoom level 1, radius is 1
          4, 1,   // At zoom level 4, radius is 5
          8, 5,  // At zoom level 8, radius is 10
          12, 10, // At zoom level 12, radius is 20
          20, 5,
          22, 5  // Use the same radius as zoom level 12 for higher zoom levels
        ],
        circleTranslate: [0, 0]
      }}
        filter={['==', ['get', 'site'], true]}
      />
    </MapLibreGL.ShapeSource>
  )
}
export default PolygonShapeSource
