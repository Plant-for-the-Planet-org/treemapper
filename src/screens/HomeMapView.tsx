import {StyleSheet, View} from 'react-native'
import React from 'react'
import DisplayMap from 'src/components/map/DisplayMap'

const HomeMapView = () => {
  return (
    <View style={styles.contaner}>
      <DisplayMap />
    </View>
  )
}

export default HomeMapView

const styles = StyleSheet.create({
  contaner: {
    flex: 1,
  },
})
