import { StyleProp } from 'react-native'
import React, { useEffect, useState } from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import { InterventionData } from 'src/types/interface/slice.interface'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import { FillColor } from 'src/utils/constants/colors'

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineOpacity: 0.8,
  lineJoin: 'bevel',
}

interface Props {
  intervention: InterventionData
}


const SingleInterventionSource = (props: Props) => {
  const { intervention } = props
  const [geoJSON, setGeoJSON] = useState(
    {
      type: 'FeatureCollection',
      features: [],
    }
  )
  useEffect(() => {
    const data = makeInterventionGeoJson(
      intervention.location.type,
      JSON.parse(intervention.location.coordinates),
      intervention.intervention_id,
      {
        key: intervention.remeasurement_required ? 'remeasurement' : intervention.intervention_key,
        site: intervention.entire_site
      }
    )

    setGeoJSON({
      type: 'FeatureCollection',
      features: [data.geoJSON],
    })
  }, [])

  if (geoJSON.features.length === 0) {
    return null
  }
  return (
    <MapLibreGL.ShapeSource
      id={'polygon_shape_source'}
      shape={geoJSON}>
      <MapLibreGL.FillLayer
        id={'poly_shape_source_fill'} // Unique ID for active FillLayer
        style={{ fillOpacity: 0.5, fillColor: FillColor }}
      />
      <MapLibreGL.LineLayer
        id={'poly_line_shape_source'}
        style={{ ...polyline, lineColor: FillColor }}
      />
      <MapLibreGL.CircleLayer id={'singleEsntire'} style={{ circleOpacity: 0.8, circleColor: FillColor }} filter={['all', ["==", ["geometry-type"], "Point"]]} />

    </MapLibreGL.ShapeSource>
  )
}

export default SingleInterventionSource