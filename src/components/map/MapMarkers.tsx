import React from 'react'
import Maplibre from '@maplibre/maplibre-react-native'
import MapPin from 'assets/images/svg/MapPin.svg'
import { SampleTree } from 'src/types/interface/slice.interface'

interface Props {
  sampleTreeData: SampleTree[]
  hasSampleTree: boolean
}

const MapMarkers = (props: Props) => {
  const { sampleTreeData, hasSampleTree } = props
  if (!hasSampleTree) {
    return null
  }
  const renderMarkers = () => {
    return sampleTreeData.map((el, i) => (
      <Maplibre.MarkerView
        coordinate={[el.latitude, el.longitude]}
        anchor={
          { x: 0.5, y: 0.9 }
        }
        id={String(i)}
        key={i}>
        <MapPin />
      </Maplibre.MarkerView>
    ))
  }
  return renderMarkers()
}

export default MapMarkers


