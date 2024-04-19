import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import OfflineMapDisplay from 'src/components/offlineMap/OfflineMapDisplay'
import OfflineSelectionMapHeader from 'src/components/offlineMap/OfflineSelectionMapHeader'

const OfflineMapSelectionView = () => {
  return (
    <View style={styles.cotainer}>
      <Header label="Confirm Area Selection" />
      <OfflineSelectionMapHeader />
      <OfflineMapDisplay/>
    </View>
  )
}

export default OfflineMapSelectionView

const styles = StyleSheet.create({
  cotainer: {
    flex: 1,
  },
})
