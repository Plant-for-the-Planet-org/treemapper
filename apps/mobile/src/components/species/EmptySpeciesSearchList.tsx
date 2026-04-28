import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useEffectEvent, useState } from 'react'
import i18next from 'src/locales/index'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IScientificSpecies } from 'src/types/interface/app.interface'


const EmptySpeciesSearchList = () => {
  const [title, setTitle] = useState(i18next.t('label.select_species_search_atleast_3_characters'))
  const realm = useRealm()



  useEffect(() => {
    checkForOfflineSpeies()
  }, [])

  const checkForOfflineSpeies = () => {
    const hasMoreThan150Species =
      realm.objects<IScientificSpecies>(RealmSchema.ScientificSpecies).length > 150;
    if (!hasMoreThan150Species) {
      setTitle("Species need sync. Please refresh the species to download offline species.")
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.labelStyle}>
        {title}
      </Text>
    </View>
  )
}

export default EmptySpeciesSearchList

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  labelStyle: {
    paddingHorizontal: 20,
    textAlign: 'center'
  }
})
