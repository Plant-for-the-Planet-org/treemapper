import React from 'react'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import { View, StyleSheet, Pressable } from 'react-native'
import { Typography, Colors } from 'src/utils/constants'

interface Props {
  sampleTreeData: PlantedPlotSpecies[]
  onMarkerPress?: (id: string) => void,
  dynamic?: boolean,
}

const PlotMarker = (props: Props) => {
  const { sampleTreeData, onMarkerPress } = props

  const backgroundColor = (el: PlantedPlotSpecies) => {
    return !el.is_alive
      ? Colors.TEXT_LIGHT
      : el.type === 'PLANTED'
        ? Colors.NEW_PRIMARY
        : Colors.RECRUIT_PLANT_THEME;
  }

  const renderMarkers = () => {
    const filterData = sampleTreeData.filter(el => (el.latitude !== 0 && el.longitude !== 0))
    return filterData.map((el, i) => (
      <MapLibreGL.MarkerView
        coordinate={[el.longitude, el.latitude]}
        anchor={
          { x: 0.55, y: 0.4 }
        }
        id={String(i)}
        key={String(i)}>
        <Pressable style={styles.container} onPress={() => { onMarkerPress(el.plot_plant_id) }}>
          <View style={[styles.markerContainer, { backgroundColor: backgroundColor(el) }]} />
        </Pressable>
      </MapLibreGL.MarkerView>
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


