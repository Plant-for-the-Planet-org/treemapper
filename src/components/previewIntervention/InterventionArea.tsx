import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import PreviewInterventionMap from './PreviewInterventionMap'

const InterventionArea = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Intervention Area</Text>
      <View style={styles.mapWrapper}>
        <PreviewInterventionMap />
      </View>
    </View>
  )
}

export default InterventionArea

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical:20
  },
  mapWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header:{
    marginLeft:'10%',
    marginBottom:10
  }
})
