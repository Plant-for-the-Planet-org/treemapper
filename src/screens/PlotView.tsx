import {StyleSheet, View} from 'react-native'
import React from 'react'
import ComingSoon from 'src/components/common/ComingSoonView'

const PlotView = () => {
  return (
    <View style={styles.container}>
      <ComingSoon />
    </View>
  )
}

export default PlotView

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
