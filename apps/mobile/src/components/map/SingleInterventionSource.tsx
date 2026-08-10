import { StyleProp } from 'react-native'
import React, { useEffect, useState } from 'react'
import { GeoJSONSource, Layer, LineLayerStyle } from '@maplibre/maplibre-react-native'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { InterventionData } from 'src/types/interface/slice.interface'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import { FillColor, NEW_PRIMARY, WHITE } from 'src/utils/constants/colors'

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
  const isSatellite = useSelector(
    (state: RootState) => state.displayMapState.mainMapView === 'SATELLITE'
  )
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
    <GeoJSONSource
      id={'polygon_shape_source'}
      data={geoJSON}>
      <Layer
        id={'poly_shape_source_fill'}
        type="fill"
        style={{ fillOpacity: 0.5, fillColor: FillColor }}
        filter={['all', ["!=", ["geometry-type"], "Point"]]}
      />
      <Layer
        id={'poly_line_shape_source'}
        type="line"
        style={{ ...polyline, lineColor: FillColor }}
        filter={['all', ["!=", ["geometry-type"], "Point"]]}
      />
      <Layer
        id={'singleEsntire'}
        type="circle"
        style={{
          circleOpacity: 0.8,
          circleColor: FillColor,
          circleStrokeWidth: 2,
          circleStrokeColor: isSatellite ? NEW_PRIMARY : WHITE,
        }}
        filter={['all', ["==", ["geometry-type"], "Point"]]}
      />

    </GeoJSONSource>
  )
}

export default SingleInterventionSource