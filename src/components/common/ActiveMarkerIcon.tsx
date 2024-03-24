import {StyleSheet, View} from 'react-native'
import React from 'react'
import MapPin from 'assets/images/svg/MapPin.svg'

const ActiveMarkerIcon = () => {
  return (
    <View style={styles.container}>
      <MapPin />
    </View>
  )
}

export default ActiveMarkerIcon

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    top: '48%',
    left: '48%',
    zIndex: 1,
    position: 'absolute',
  },
})
