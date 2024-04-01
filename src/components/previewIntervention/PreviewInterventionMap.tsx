import {StyleSheet, View} from 'react-native'
import React from 'react'
import DisplayMap from '../map/DisplayMap'

const PreviewInterventionMap = () => {
  return (
    <View style={styles.container}>
      <DisplayMap />
    </View>
  )
}

export default PreviewInterventionMap

const styles = StyleSheet.create({
  container: {
    width: '90%',
    height: 180,
    borderRadius: 20,
    overflow:'hidden'
  },
})
