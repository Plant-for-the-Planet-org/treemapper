import {StyleProp} from 'react-native'
import React from 'react'
import { GeoJSONSource, Layer, LineLayerStyle } from '@maplibre/maplibre-react-native'
import {Colors} from 'src/utils/constants'

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineOpacity: 0.5,
  lineJoin: 'bevel',
}
const fillStyle = {fillOpacity: 0.1}
const bigCircleStyle = {
  circleColor: Colors.NEW_PRIMARY,
  circleOpacity: 0.5,
  circleRadius: 12,
}

const FillColor:any = [
  'match',
  ['get', 'key'],
  'single-tree-registration', Colors.SINGLE_TREE,
  'multi-tree-registration', Colors.MULTI_TREE,
  'removal-invasive-species', Colors.INVASIVE_SPECIES,
  'fire-suppression', Colors.FIRE_SUPPRESSION,
  'fire-patrol', Colors.FIRE_PATROL,
  'fencing', Colors.FENCING,
  'marking-regenerant', Colors.MARKING_REGENERANT,
  'liberating-regenerant', Colors.LIBERATING_REGENERANT,
  'grass-suppression', Colors.GRASS_SUPPRESSION,
  'firebreaks', Colors.FIREBREAKS,
  'assisting-seed-rain', Colors.SEED_RAIN,
  'soil-improvement', Colors.SOIL_IMPROVEMENT,
  'stop-tree-harvesting', Colors.STOP_HARVESTING,
  'direct-seeding', Colors.DIRECT_SEEDING,
  'enrichment-planting', Colors.ENRICHMENT_PLANTING,
  'other-intervention', Colors.OTHER_INTERVENTION,
  'maintenance', Colors.MAINTENANCE,
  Colors.SINGLE_TREE
]

interface Props {
  geoJSON: any
  onShapeSourcePress: (id: string) => void
  showError?: boolean
}

const MapShapeSource = (props: Props) => {
  const {geoJSON, onShapeSourcePress, showError} = props
  const pressHandle = (el: any) => {
    onShapeSourcePress(el.properties.id)
  }
  return (
    <>
      {geoJSON.map(feature => {
        const id = `feature-${feature.properties.id}`
        switch (feature.geometry.type) {
          case 'Point':
            return (
              <GeoJSONSource
                key={feature.properties.id}
                id={id}
                data={feature}
                onPress={() => {
                  pressHandle(feature)
                }}>
                <Layer
                  id={'singleSelectedPolyCircle' + feature.properties.id}
                  type="circle"
                  style={bigCircleStyle}
                />
              </GeoJSONSource>
            )
          case 'Polygon':
            return (
              <GeoJSONSource
                key={feature.properties.id}
                id={id}
                data={feature}
                onPress={() => {
                  pressHandle(feature)
                }}>
                <Layer
                  id={'poly_map_shape_fill' + feature.properties.id}
                  type="fill"
                  style={{
                    ...fillStyle,
                    fillColor: showError ? Colors.LIGHT_RED : FillColor,
                  }}
                />
                <Layer
                  id={'poly_map_shape_source' + feature.properties.id}
                  type="line"
                  style={{
                    ...polyline,
                    lineColor: showError ? Colors.LIGHT_RED : FillColor,
                  }}
                />
              </GeoJSONSource>
            )
          case 'LineString':
            return (
              <GeoJSONSource
                key={feature.properties.id}
                id={id}
                data={feature}
                onPress={() => {
                  pressHandle(feature)
                }}>
                <Layer id={`${feature.properties.id}-layer`} type="line" />
              </GeoJSONSource>
            )
          default:
            return null
        }
      })}
    </>
  )
}

export default MapShapeSource
