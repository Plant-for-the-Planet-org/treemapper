import {StyleProp} from 'react-native'
import React from 'react'
import MapLibreGL, {LineLayerStyle} from '@maplibre/maplibre-react-native'
import {Colors} from 'src/utils/constants'

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.PRIMARY,
  lineOpacity: 0.5,
  lineJoin: 'bevel',
}
const fillStyle = {fillColor: Colors.PRIMARY, fillOpacity: 0.3}
// const circleStyle = {circleColor: Colors.PRIMARY_DARK, circleOpacity: 0.8}
const bigCircleStyle = { circleColor: Colors.PRIMARY_DARK, circleOpacity: 0.5, circleRadius: 12 };

interface Props {
  geoJSON: any
  onShapeSourcePress: (id: string) => void
}

const MapShapeSource = (props: Props) => {
  const {geoJSON, onShapeSourcePress} = props
  const pressHandle = (el: any) => {
    onShapeSourcePress(el.properties.id)
  }
  return (
    <>
      {geoJSON.map((feature, index) => {
        const id = `feature-${index}`
        switch (feature.geometry.type) {
          case 'Point':
            return (
              <MapLibreGL.ShapeSource
                key={index}
                id={id}
                shape={feature}
                onPress={() => {
                  pressHandle(feature)
                }}>
                <MapLibreGL.CircleLayer
                  id={'singleSelectedPolyCircle' + index}
                  style={bigCircleStyle}
                />
              </MapLibreGL.ShapeSource>
            )
          case 'Polygon':
            return (
              <MapLibreGL.ShapeSource
                key={index}
                id={id}
                shape={feature}
                onPress={() => {
                  pressHandle(feature)
                }}>
                <MapLibreGL.FillLayer
                  id={'polyFill' + index}
                  style={fillStyle}
                />
                <MapLibreGL.LineLayer
                  id={'polyline' + index}
                  style={polyline}
                />
              </MapLibreGL.ShapeSource>
            )
          case 'LineString':
            return (
              <MapLibreGL.ShapeSource
                key={index}
                id={id}
                shape={feature}
                onPress={() => {
                  pressHandle(feature)
                }}>
                <MapLibreGL.LineLayer id={`${index}-layer`} />
              </MapLibreGL.ShapeSource>
            )
          default:
            return null
        }
      })}
    </>
  )
}

export default MapShapeSource
