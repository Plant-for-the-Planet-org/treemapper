import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import React, { useEffect } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { StackNavigationProp } from '@react-navigation/stack'
import useDownloadFile from 'src/hooks/useSpeciesDownload'
import * as FileSystem from 'expo-file-system'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { Typography, Colors } from 'src/utils/constants'
import DownloadBackdrop from 'assets/images/svg/DownloadBackdrop.svg'
import OnboardingNotes from 'src/components/onboarding/OnboardingNotes'
import i18next from 'src/locales/index'
import { checkForMigrateSpecies, getLocalSpeciesSync, updateLocalSpeciesSync } from 'src/utils/helpers/asyncStorageHelper'
import { isWithin90Days } from 'src/utils/helpers/timeHelper'
import { useNetInfo } from '@react-native-community/netinfo';
import Snackbar from 'react-native-snackbar';
import { useDispatch } from 'react-redux'
import { updateSpeciesSyncStatus } from 'src/store/slice/appStateSlice'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import useInitalSetup from 'src/hooks/useInitialSetup'

const SyncSpecies = () => {
  const { downloadFile, finalURL, currentState } = useDownloadFile()
  const { writeBulkSpecies } = useManageScientificSpecies()
  const { addNewLog } = useLogManagement()
  const { setupApp } = useInitalSetup()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'SyncSpecies'>>()
  const { isConnected } = useNetInfo();

  const dispatch = useDispatch()

  useEffect(() => {
    if (isConnected === null) {
      return
    }
    isSpeciesUpdateRequried()
  }, [isConnected])

  useEffect(() => {
    if (finalURL !== null) {
      readAndWriteSpecies(finalURL)
    }
  }, [finalURL])

  const isSpeciesUpdateRequried = async () => {
    setupApp()
    if (!isConnected) {
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data sync stoped due to network",
        logLevel: 'warn',
        statusCode: '000',
      })
      Snackbar.show({
        text: i18next.t('label.no_internet_connection'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#e74c3c',
      });
      setTimeout(() => {
        if (route.params?.inApp) {
          navigation.replace('Home')
        } else {
          dispatch(updateSpeciesSyncStatus(false))
          navigation.replace('Home')
        }
      }, 1000);
      return;
    }
    const localSyncTimeStamp = await getLocalSpeciesSync()
    if (localSyncTimeStamp) {
      if (route.params?.inApp) {
        downloadFile()
        return
      }
      const skipSpeciesSync = isWithin90Days(Number(localSyncTimeStamp))
      if (skipSpeciesSync) {
        setTimeout(() => {
          navigation.replace('Home')
        }, 1000);
      } else {
        addNewLog({
          logType: 'DATA_SYNC',
          message: "Species data need's to sync. Syncing started",
          logLevel: 'info',
          statusCode: '000',
        })
        downloadFile()
      }
    } else {
      const oldSpeciesDB = await checkForMigrateSpecies()
      if(oldSpeciesDB){
        setTimeout(() => {
          navigation.replace('Home')
        }, 1000);
        return
      }
      downloadFile()
    }
  }

  const readAndWriteSpecies = async (finalURL: string) => {
    try {
      const speciesContent = await FileSystem.readAsStringAsync(
        finalURL + '/scientific_species.json',
        { encoding: 'utf8' },
      )
      const parsedData = JSON.parse(speciesContent)
      await writeBulkSpecies(parsedData)
      await updateLocalSpeciesSync();
      dispatch(updateSpeciesSyncStatus(true))
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data synced successfully",
        logLevel: 'info',
        statusCode: '000',
      })
      if (route.params?.inApp) {
        navigation.goBack()
      } else {
        navigation.replace('Home')
      }
    } catch (error) {
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Error occured while syncing species data",
        logLevel: 'info',
        statusCode: '000',
      })
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
