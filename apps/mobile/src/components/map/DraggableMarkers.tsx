import React from 'react'
import { Marker } from '@maplibre/maplibre-react-native'
import MapPin from 'assets/images/svg/MapPin.svg'
import { StyleSheet, Text, View } from 'react-native'
import { Colors, Typography } from 'src/utils/constants'

interface Props {
  coordinates: Array<number[]>
  onDragEnd: (index: number, coords: any) => void
  isSinglePoint: boolean
}

const DraggableMarkers = (props: Props) => {
  if (props.coordinates.length === 0) {
    return null
  }
  const renderMarkers = () => {
    const alphabet = (i: number) => {
      return String.fromCharCode(i + 65)
    }


    return props.coordinates.map((d, i) => {
      if (props.isSinglePoint) {
        return <Marker lngLat={d as [number, number]} id={String(i)} key={String(d)}>
          <View style={styles.container}>
            <View style={styles.mapPinContainer}>
              <MapPin fill={Colors.NEW_PRIMARY} />
            </View>
            <Text style={styles.labelText}>{alphabet(i)}</Text>
          </View>
        </Marker>
      }
      if (props.coordinates.length - 1 === i) {
        return null
      }
      return <Marker lngLat={d as [number, number]} id={String(i)} key={String(d)}>
        <View style={styles.container}>
          <View style={styles.mapPinContainer}>
            <MapPin fill={Colors.NEW_PRIMARY} />
          </View>
          <Text style={styles.labelText}>{alphabet(i)}</Text>
        </View>
      </Marker>
    })
  }
  return renderMarkers()
}

export default DraggableMarkers

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
