import React from 'react'
import Maplibre from '@maplibre/maplibre-react-native'
import MapPin from 'assets/images/svg/MapPin.svg'

interface Props {
  coordinates: Array<number[]>
}

const AlphabetMarkers = (props: Props) => {
  if (props.coordinates.length === 0) {
    return null
  }
  const renderMarkers = () => {
    return props.coordinates.map((d, i) => (
      <Maplibre.PointAnnotation
        coordinate={d}
        id={String(i)}
        key={i}
        anchor={{x: 0.5, y: 0.9}}>
        <MapPin />
      </Maplibre.PointAnnotation>
    ))
  }
  return renderMarkers()
}

export default AlphabetMarkers
