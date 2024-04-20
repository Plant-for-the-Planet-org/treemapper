import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import React, {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {StackNavigationProp} from '@react-navigation/stack'
import useDownloadFile from 'src/hooks/useSpeciesDownload'
import * as FileSystem from 'expo-file-system'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import {Typography,Colors} from 'src/utils/constants'
import DownloadBackdrop from 'assets/images/svg/DownloadBackdrop.svg'
import OnboardingNotes from 'src/components/onboarding/OnboardingNotes'
import i18next from 'src/locales/index'
import {getLocalSpeciesSync, updateLocalSpeciesSync} from 'src/utils/helpers/asyncStorageHelper'
import {isWithin90Days} from 'src/utils/helpers/timeHelper'

const SyncSpecies = () => {
  const {downloadFile, finalURL, currentState} = useDownloadFile()
  const {writeBulkSpecies} = useManageScientificSpecies()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  useEffect(() => {
    isSpeciesUpdateRequried()
  }, [])

  useEffect(() => {
    if (finalURL !== null) {
      readAndWriteSpecies(finalURL)
    }
  }, [finalURL])

  const isSpeciesUpdateRequried = async () => {
    const localSyncTimeStamp = await getLocalSpeciesSync()
    if (localSyncTimeStamp) {
      const skipSpeciesSync = isWithin90Days(Number(localSyncTimeStamp))
      if (skipSpeciesSync) {
        navigation.replace('Home')
      } else {
        downloadFile()
      }
    } else {
      downloadFile()
    }
  }

  const readAndWriteSpecies = async (finalURL: string) => {
    try {
      const speciesContent = await FileSystem.readAsStringAsync(
        finalURL + '/scientific_species.json',
        {encoding: 'utf8'},
      )
      const parsedData = JSON.parse(speciesContent)
      await writeBulkSpecies(parsedData)
      await updateLocalSpeciesSync();
      navigation.replace('Home')
    } catch (error) {
      console.log('error', error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <DownloadBackdrop />
      </View>
      <View>
        <Text style={styles.textStyle}>
          {i18next.t('label.updating_species')}
        </Text>
        <OnboardingNotes updatingSpeciesState={currentState} />
        <ActivityIndicator
          size="large"
          color={Colors.NEW_PRIMARY}
          style={styles.activityIndicator}
        />
      </View>
    </SafeAreaView>
  )
}

export default SyncSpecies

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: Colors.WHITE,
  },
  imageContainer: {
    width: '90%',
    height: '50%',
  },
  textStyle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_30,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
  },
  activityIndicator: {
    paddingVertical: 30,
  },
})
