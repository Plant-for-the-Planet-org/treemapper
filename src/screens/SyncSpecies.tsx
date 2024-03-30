import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import React, {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'
import {RootStackParamList} from 'src/types/type/navigation'
import {StackNavigationProp} from '@react-navigation/stack'
import useDownloadFile from 'src/hooks/useSpeciesDownload'
import * as FileSystem from 'expo-file-system'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import {Colors} from 'react-native/Libraries/NewAppScreen'
import {Typography} from 'src/utils/constants'
import DownloadBackdrop from 'assets/images/svg/DownloadBackdrop.svg'
import OnboardingNotes from 'src/components/onboarding/OnboardingNotes'
import i18next from 'src/locales/index'

const SyncSpecies = () => {
  const {downloadFile, finalURL, currentState} = useDownloadFile()
  const {writeBulkSpecies} = useManageScientificSpecies()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
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
      const result = await writeBulkSpecies(parsedData)
      console.log('result try', result)
      navigation.replace('Home')
    } catch (error) {
      console.log('result error', error)
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
          color={Colors.PRIMARY}
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
  descriptionText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
    marginTop: 20,
  },
  activityIndicator: {
    paddingVertical: 20,
  },
})
