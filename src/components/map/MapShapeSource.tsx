import {StyleProp} from 'react-native'
import React from 'react'
import MapLibreGL, {LineLayerStyle} from '@maplibre/maplibre-react-native'
import {Colors} from 'src/utils/constants'

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineOpacity: 0.5,
  lineJoin: 'bevel',
}
const fillStyle = {fillOpacity: 0.1}
// const circleStyle = {circleColor: Colors.PRIMARY_DARK, circleOpacity: 0.8}
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
  'fire-suppression', Colors.FIRE_SUPRESSION,
  'fire-patrol', Colors.FIRE_PATROL,
  'fencing', Colors.FENCING,
  'marking-regenerant', Colors.MARKING_REGENERANT,
  'liberating-regenerant', Colors.LIBERATING_REGENERANT,
  'grass-suppression', Colors.GRASS_SUPRESSION,
  'firebreaks', Colors.FIREBREAKS,
  'assisting-seed-rain', Colors.SEED_RAIN,
  'soil-improvement', Colors.SOIL_IMPROVEMENT,
  'stop-tree-harvesting', Colors.STOP_HARVESTING,
  'direct-seeding', Colors.DIRECT_SEEDING,
  'enrichement-planting', Colors.ENRICHMENT_PLANTING,
  'other-intervention', Colors.OTHER_INTERVENTION,
  'maintenance', Colors.MAINTAINEANCE,
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
              <MapLibreGL.ShapeSource
                key={feature.properties.id}
                id={id}
                shape={feature}
                onPress={() => {
                  pressHandle(feature)
                }}>
                <MapLibreGL.CircleLayer
                  id={'singleSelectedPolyCircle' + feature.properties.id}
                  style={bigCircleStyle}
                />
              </MapLibreGL.ShapeSource>
            )
          case 'Polygon':
            return (
              <MapLibreGL.ShapeSource
                key={feature.properties.id}
                id={id}
                shape={feature}
                onPress={() => {
                  pressHandle(feature)
                }}>
                <MapLibreGL.FillLayer
                  id={'polwFill' + feature.properties.id}
                  style={{
                    ...fillStyle,
                    fillColor: showError ? Colors.LIGHT_RED : FillColor,
                  }}
                />
                <MapLibreGL.LineLayer
                  id={'polwyline' + feature.properties.id}
                  style={{
                    ...polyline,
                    lineColor: showError ? Colors.LIGHT_RED : FillColor,
                  }}
                />
              </MapLibreGL.ShapeSource>
            )
          case 'LineString':
            return (
              <MapLibreGL.ShapeSource
                key={feature.properties.id}
                id={id}
                shape={feature}
                onPress={() => {
                  pressHandle(feature)
                }}>
                <MapLibreGL.LineLayer id={`${feature.properties.id}-layer`} />
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
