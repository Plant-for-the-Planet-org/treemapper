import {StyleSheet, View} from 'react-native'
import React from 'react'
import {Colors} from 'src/utils/constants'

const GpsAccuracyTile = () => {
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}></View>
    </View>
  )
}

export default GpsAccuracyTile

const styles = StyleSheet.create({
  container: {
    width: '40%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '80%',
    height: '70%',
    backgroundColor: Colors.LIGHT_AMBER + '2A',
    borderRadius: 30,
  },
})
