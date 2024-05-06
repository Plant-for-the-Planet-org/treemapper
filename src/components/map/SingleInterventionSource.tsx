import { StyleProp } from 'react-native'
import React, { useEffect, useState } from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'
import { InterventionData } from 'src/types/interface/slice.interface'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineOpacity: 0.5,
  lineJoin: 'bevel',
  lineColor: Colors.PRIMARY
}
const activeFillStyle = { fillOpacity: 0.8, fillColor: Colors.PRIMARY }

interface Props {
  intervetnion: InterventionData
}

const SingleInterventionSource = (props: Props) => {
  const {intervetnion} = props
  const [geoJSON, setGeoJSON] = useState(
    {
      type: 'FeatureCollection',
      features: [],
    }
  )
  useEffect(() => {
    const data  = makeInterventionGeoJson(
      intervetnion.location.type,
      JSON.parse(intervetnion.location.coordinates),
      intervetnion.intervention_id,
      {
        key: intervetnion.intervention_key,
        site: intervetnion.entire_site
      }
    )

    setGeoJSON(  {
      type: 'FeatureCollection',
      features: [data.geoJSON],
    })
  }, [])
  
  if (geoJSON.features.length === 0) {
    return null
  }
  return (
    <MapLibreGL.ShapeSource
      id={'polygon'}
      shape={geoJSON}>
      <MapLibreGL.FillLayer
        id={'activePolyFill'} // Unique ID for active FillLayer
        style={activeFillStyle}
      />
      <MapLibreGL.LineLayer
        id={'polyline'}
        style={polyline}
      />
    </MapLibreGL.ShapeSource>
  )
}

export default SingleInterventionSource