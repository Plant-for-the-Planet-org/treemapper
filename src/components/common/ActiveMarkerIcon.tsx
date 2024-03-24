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
    alignItems: 'center',
    zIndex: 1,
    position: 'absolute',
    top:"44%",
  },
})
