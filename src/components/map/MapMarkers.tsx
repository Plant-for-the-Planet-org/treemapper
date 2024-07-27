import React from 'react'
import MapLibreGL from '@maplibre/maplibre-react-native'
import MapPin from 'assets/images/svg/MapPin.svg'
import { SampleTree } from 'src/types/interface/slice.interface'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, Typography } from 'src/utils/constants'

interface Props {
  sampleTreeData: SampleTree[]
  hasSampleTree: boolean
  showActive?: boolean
  activeIndex?: number
  onMarkerPress?: (index: number) => void
}

const MapMarkers = (props: Props) => {
  const { sampleTreeData, hasSampleTree, showActive, activeIndex, onMarkerPress } = props
  if (!hasSampleTree) {
    return null
  }
  const alphabet = (i: number) => {
    return String.fromCharCode(i + 65)
  }

  const handleMarkerPress = (index: number) => {
    if (onMarkerPress) {
      onMarkerPress(index)
    }
  }

  const getPinColor = (i: number, el: SampleTree) => {
    if (showActive) {
      if (activeIndex === i) {
        return Colors.NEW_PRIMARY;
      } else {
        return el.remeasurement_requires ? 'tomato' : Colors.TEXT_LIGHT;
      }
    } else {
      return Colors.NEW_PRIMARY;
    }
  };

  const textColor = (i: number) => {
    return showActive
      ? (activeIndex === i ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT)
      : Colors.DARK_TEXT_COLOR;

  }
  const renderMarkers = () => {
    return sampleTreeData.map((el, i) => (
      <MapLibreGL.MarkerView
        coordinate={[el.longitude, el.latitude]}

        id={String(i)}
        key={String(el.longitude)}>
        <TouchableOpacity style={styles.container} onPress={() => {
          handleMarkerPress(i)
        }}>
          <View style={styles.mapPinContainer}>
            <MapPin fill={getPinColor(i, el)} />
          </View>
          <Text style={[styles.labelText, { color: textColor(i) }]}>
            {alphabet(i)}
          </Text>
        </TouchableOpacity>
      </MapLibreGL.MarkerView>
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


