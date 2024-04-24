import React from 'react'
import Maplibre from '@maplibre/maplibre-react-native'
import MapPin from 'assets/images/svg/MapPin.svg'
import {SampleTree } from 'src/types/interface/slice.interface'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, Typography } from 'src/utils/constants'

interface Props {
  sampleTreeData: SampleTree[]
  hasSampleTree: boolean
  showActive?: boolean
  activeIndex?: number
  onMarkerPress?: (index:number)=>void
}

const MapMarkers = (props: Props) => {
  const { sampleTreeData, hasSampleTree, showActive, activeIndex, onMarkerPress } = props
  if (!hasSampleTree) {
    return null
  }
  const alphabet = (i: number) => {
    return String.fromCharCode(i + 65)
  }

  const handleMarkerPress=(index: number)=>{
    if(onMarkerPress){
      onMarkerPress(index)
    }
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
        <TouchableOpacity style={styles.container} onPress={()=>{
          handleMarkerPress(i)
        }}>
          <View style={styles.mapPinContainer}>
            <MapPin />
          </View>
          <Text style={[styles.labelText, { color: showActive ? activeIndex === i ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT : Colors.DARK_TEXT_COLOR }]}>{alphabet(i)}</Text>
        </TouchableOpacity>
      </Maplibre.MarkerView>
    ))
  }
  return renderMarkers()
}

export default MapMarkers

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
  labelText: {
    position: 'absolute',
    top: 6,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
})


