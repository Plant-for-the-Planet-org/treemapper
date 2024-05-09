import { StyleSheet, View } from 'react-native'
import React from 'react'
import AdditionalDataFormNote from './AdditionalDataFormNote'

const AdditionalDataForm = () => {
  return (
    <View style={styles.container}>
      <AdditionalDataFormNote/>
    </View>
  )
}

export default AdditionalDataForm

const styles = StyleSheet.create({
  container:{
    flex:1
  }
})