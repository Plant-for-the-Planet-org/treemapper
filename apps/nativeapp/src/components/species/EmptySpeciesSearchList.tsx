import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import i18next from 'src/locales/index'


const EmptySpeciesSearchList = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.labelStyle}>
        {i18next.t('label.select_species_search_atleast_3_characters')}
      </Text>
    </View>
  )
}

export default EmptySpeciesSearchList

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent:'center',
    alignItems:'center'
  },
  labelStyle:{
    paddingHorizontal:20,
    textAlign:'center'
  }
})
