import {StyleSheet} from 'react-native'
import React from 'react'
import MapLibreGL from '@maplibre/maplibre-react-native'
import {Colors} from 'src/utils/constants'

interface Props {
  coordinates: Array<number[]>
}

const LineMarker = (props: Props) => {
  if (props.coordinates.length < 2) {
    return null
  }
  return (
    <MapLibreGL.ShapeSource
      id={'polygon'}
      shape={{
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [...props.coordinates],
            },
          },
        ],
      }}>
      <MapLibreGL.LineLayer id={'polylwine'} style={styles.lineStyle} />
    </MapLibreGL.ShapeSource>
  )
}

export default LineMarker

const styles = StyleSheet.create({
  lineStyle: {
    color: Colors.PRIMARY_DARK,
    lineColor: Colors.PRIMARY_DARK,
    lineWidth: 2,
  },
})
