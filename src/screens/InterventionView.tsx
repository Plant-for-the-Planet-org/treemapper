import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import FreeUpSaceButton from 'src/components/intervention/FreeUpSaceButton'
import InterventionList from 'src/components/intervention/InterventionList'

const InterventionFormView = () => {
  return (
    <View style={styles.cotnainer}>
      <Header
        label=""
        showBackIcon={false}
        rightComponet={<FreeUpSaceButton />}
      />
      <InterventionList />
    </View>
  )
}

export default InterventionFormView

const styles = StyleSheet.create({
  cotnainer: {
    flex: 1,
  },
})
