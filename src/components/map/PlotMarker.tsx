import React from 'react'
import Maplibre from '@maplibre/maplibre-react-native'
import { PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import { View, StyleSheet } from 'react-native'
import { Typography } from 'src/utils/constants'

interface Props {
  sampleTreeData: PlantedPlotSpecies[]
  onMarkerPress?: (index: number) => void
}

const PlotMarker = (props: Props) => {
  const { sampleTreeData } = props

  const renderMarkers = () => {
    const filterdData = sampleTreeData.filter(el => (el.latitude !== 0 && el.longitude !== 0))
    return filterdData.map((el, i) => (
      <Maplibre.MarkerView
        coordinate={[el.longitude, el.latitude]}
        anchor={
          { x: 0.55, y: 0.4 }
        }
        id={String(i)}
        key={i}>
        <View style={styles.container}>
          <View style={styles.markerContainer} />
        </View>
      </Maplibre.MarkerView>
    ))
  }
  return renderMarkers()
}

export default PlotMarker

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 100,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPinContainer: {
    position: 'absolute',
    left: '17%',
    top: '-0.1%',
  },
  markerContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    height: 15,
    opacity: 0.8,
    width: 15
  },
  labelText: {
    position: 'absolute',
    top: 6,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
})


