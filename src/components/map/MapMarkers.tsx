import React from 'react'
import Maplibre from '@maplibre/maplibre-react-native'
import MapPin from 'assets/images/svg/MapPin.svg'
import {SampleTree} from 'src/types/interface/slice.interface'

interface Props {
  sampleTreeData: SampleTree[]
}

const MapMarkers = (props: Props) => {
  const {sampleTreeData} = props
  console.log("MapMarkers sampletree data",sampleTreeData)
  const renderMarkers = () => {
    return sampleTreeData.map((el, i) => (
      <Maplibre.PointAnnotation
        coordinate={[el.latitude, el.longitude]}
        id={String(i)}
        key={i}>
        <MapPin />
      </Maplibre.PointAnnotation>
    ))
  }
  return renderMarkers()
}

export default MapMarkers


