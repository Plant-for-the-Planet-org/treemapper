import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import MarkerMap from 'src/components/map/MarkerMap'

const SingleTreeRegister = () => {
  return (
    <View style={styles.container}>
      <Header label="Tree Location" />
      <MarkerMap />
    </View>
  )
}

export default SingleTreeRegister

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
