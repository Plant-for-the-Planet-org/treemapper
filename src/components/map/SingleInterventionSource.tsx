import { StyleProp } from 'react-native'
import React, { useEffect, useState } from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'
import { InterventionData } from 'src/types/interface/slice.interface'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineOpacity: 0.8,
  lineJoin: 'bevel',
}

interface Props {
  intervetnion: InterventionData
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
      id={'polyagon'}
      shape={geoJSON}>
      <MapLibreGL.FillLayer
        id={'activePoalyFill'} // Unique ID for active FillLayer
        style={{fillOpacity: 0.5, fillColor: FillColor}}
      />
      <MapLibreGL.LineLayer
        id={'polylinse'}
        style={{ ...polyline,lineColor: FillColor}}
      />
    </MapLibreGL.ShapeSource>
  )
}

export default SingleInterventionSource