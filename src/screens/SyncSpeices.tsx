import {ActivityIndicator, StyleSheet, View} from 'react-native'
import React, {useEffect} from 'react'
import useDownloadFile from 'src/hooks/useSpeciesDownload'
import * as FileSystem from 'expo-file-system'
import dbManager from 'src/db/dbManager'
import {RealmSchema} from 'src/types/enum/db.enum'

const SyncSpeices = () => {
  const {downloadFile, finalURL} = useDownloadFile()
  useEffect(() => {
    downloadFile()
  }, [])

  useEffect(() => {
    if (finalURL !== '') {
      readAndWriteSpecies(finalURL)
    }
  }, [finalURL])

  const readAndWriteSpecies = async (finalURL: string) => {
    try {
      const speciesContent = await FileSystem.readAsStringAsync(
        finalURL + '/scientific_species.json',
        {encoding: 'utf8'},
      )
      const parsedData = JSON.parse(speciesContent)
      dbManager.createObjectBulk(RealmSchema.ScientificSpecies, parsedData)
    } catch (error) {
      console.log('error', error)
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={'red'} size={'large'} />
    </View>
  )
}

export default SyncSpeices

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
