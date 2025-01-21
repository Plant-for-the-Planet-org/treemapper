import {StyleSheet} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import OfflineMapHeader from 'src/components/offlineMap/OfflineMapHeader'
import OfflineMapList from 'src/components/offlineMap/OfflineMapList'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'

const OfflineMapView = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header label="Offline Maps" />
      <OfflineMapHeader />
      <OfflineMapList />
    </SafeAreaView>
  )
}

export default OfflineMapView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
})
