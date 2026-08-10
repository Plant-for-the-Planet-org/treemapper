import {StyleSheet, View} from 'react-native'
import React from 'react'
import MapPin from 'assets/images/svg/MapPin.svg'
import { Colors } from 'src/utils/constants'

const ActiveMarkerIcon = () => {
  return (
    <View style={styles.container}>
      <MapPin fill={Colors.NEW_PRIMARY}/>
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
