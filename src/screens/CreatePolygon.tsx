import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import PolygonMarker from 'src/components/map/PolygonMarker'

const CreatePolygon = () => {
  return (
    <View style={styles.container}>
      <Header label="Tree Location" />
      <PolygonMarker />
    </View>
  )
}

export default CreatePolygon

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
