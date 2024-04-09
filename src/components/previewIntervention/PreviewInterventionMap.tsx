import {StyleSheet, View} from 'react-native'
import React from 'react'
import DisplayMap from '../map/DisplayMap'

interface Props {
  geoJSON: any
}

const PreviewInterventionMap = (props: Props) => {
  const {geoJSON} = props
  console.log('skd', geoJSON)
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
    overflow: 'hidden',
  },
})
