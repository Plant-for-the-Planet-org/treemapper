import React from 'react'
import MapLibreGL from '@maplibre/maplibre-react-native'
import MapPin from 'assets/images/svg/CircleIcon.svg'
import { StyleSheet, Text, View } from 'react-native'
import { Colors, Typography } from 'src/utils/constants'

interface Props {
  coordinates: Array<number[]>
}

const MapMarkersCircle = (props: Props) => {
  if (props.coordinates.length === 0) {
    return null
  }
  const renderMarkers = () => {
    const alphabet = (i: number) => {
      return String.fromCharCode(i + 65)
    }
    return props.coordinates.map((d, i) => {
      if (i === props.coordinates.length - 1) {
        return null
      }
      return (<MapLibreGL.MarkerView coordinate={d} id={String(i)} key={String(d)}>
        <View style={styles.container}>
          <View style={styles.mapPinContainer}>
            <MapPin fill={Colors.NEW_PRIMARY} />
            <Text style={styles.labelText}>{alphabet(i)}</Text>
          </View>
        </View>
      </MapLibreGL.MarkerView>)
    })
  }
  return renderMarkers()
}

export default MapMarkersCircle

const styles = StyleSheet.create({
  container: {
    width: 25,
    height: 25,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPinContainer: {
    position: 'absolute',
  },
  labelText: {
    position: 'absolute',
    fontFamily: Typography.FONT_FAMILY_BOLD,
    textAlign:'center',
    width:'100%'
  },
})
