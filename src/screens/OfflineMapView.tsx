import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import OfflineMapHeader from 'src/components/offlineMap/OfflineMapHeader'
import OfflineMapList from 'src/components/offlineMap/OfflineMapList'

const OfflineMapView = () => {
  return (
    <View style={styles.cotainer}>
      <Header label="Offline Maps" />
      <OfflineMapHeader />
      <OfflineMapList />
    </View>
  )
}

export default OfflineMapView

const styles = StyleSheet.create({
  cotainer: {
    flex: 1,
  },
})
