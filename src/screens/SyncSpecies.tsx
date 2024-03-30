import {ActivityIndicator, StyleSheet, Text, View} from 'react-native'
import React, {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'
import {RootStackParamList} from 'src/types/type/navigation'
import {StackNavigationProp} from '@react-navigation/stack'
// import useDownloadFile from 'src/hooks/useSpeciesDownload'
// import * as FileSystem from 'expo-file-system'
// import dbManager from 'src/db/dbManager'
// import {RealmSchema} from 'src/types/enum/db.enum'

const SyncSpecies = () => {
  // const {downloadFile, finalURL} = useDownloadFile()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  useEffect(() => {
    // downloadFile()
    setTimeout(() => {
      navigation.replace('Home')
    }, 2000)
  }, [])

  // useEffect(() => {
  //   if (finalURL !== '') {
  //     readAndWriteSpecies(finalURL)
  //   }
  // }, [finalURL])

  // const readAndWriteSpecies = async (finalURL: string) => {
  //   try {
  //     const speciesContent = await FileSystem.readAsStringAsync(
  //       finalURL + '/scientific_species.json',
  //       {encoding: 'utf8'},
  //     )
  //     const parsedData = JSON.parse(speciesContent)
  //     dbManager.createObjectBulk(RealmSchema.ScientificSpecies, parsedData)
  //   } catch (error) {
  //     console.log('error', error)
  //   }
  // }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={'red'} size={'small'} />
      <Text>Only Show This if Species needs to update</Text>
    </View>
  )
}

export default SyncSpecies

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
