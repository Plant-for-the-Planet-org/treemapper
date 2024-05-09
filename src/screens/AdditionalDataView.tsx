import {StyleSheet} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import AdditionalTabView from 'src/components/additionalData/AdditionalTabView'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'

const AdditionalDataView = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header label="Additional Data" />
      <AdditionalTabView />
    </SafeAreaView>
  )
}

export default AdditionalDataView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:Colors.WHITE
  },
})
