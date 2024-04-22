import { StyleSheet } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import OfflineMapDisplay from 'src/components/offlineMap/OfflineMapDisplay'
import OfflineSelectionMapHeader from 'src/components/offlineMap/OfflineSelectionMapHeader'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'

const OfflineMapSelectionView = () => {
  return (
    <SafeAreaView style={styles.cotainer}>
      <Header label="Confirm Area Selection" />
      <OfflineSelectionMapHeader />
      <OfflineMapDisplay />
    </SafeAreaView>
  )
}

export default OfflineMapSelectionView

const styles = StyleSheet.create({
  cotainer: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
})
