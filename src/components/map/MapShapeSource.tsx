import {StyleProp } from 'react-native'
import React from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'
interface Props{
    geoJSON: any
}

  // console.log(JSON.stringify(geoJSON, null, 2))
  const polyline: StyleProp<LineLayerStyle> = {
    lineWidth: 2,
    lineColor: Colors.PRIMARY,
    lineOpacity: 0.5,
    lineJoin: 'bevel',
  }
  const fillStyle = {fillColor: Colors.PRIMARY, fillOpacity: 0.3}
  const circleStyle = {circleColor: Colors.PRIMARY_DARK, circleOpacity: 0.8}

const MapShapeSource = (props:Props) => {
  const {geoJSON} = props;
  return (
    <>
    {geoJSON.map((feature, index) => {
        const id = `feature-${index}`
        switch (feature.geometry.type) {
          case 'Point':
            return (
              <MapLibreGL.ShapeSource key={index} id={id} shape={feature}>
                <MapLibreGL.CircleLayer
                  id={'singleSelectedPolyCircle' + index}
                  style={circleStyle}
                />
              </MapLibreGL.ShapeSource>
            )
          case 'Polygon':
            return (
              <MapLibreGL.ShapeSource key={index} id={id} shape={feature}>
                <MapLibreGL.FillLayer id={'polyFill'+index} style={fillStyle} />
                <MapLibreGL.LineLayer id={'polyline'+index} style={polyline} />
              </MapLibreGL.ShapeSource>
            )
          case 'LineString':
            return (
              <MapLibreGL.ShapeSource key={index} id={id} shape={feature}>
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

