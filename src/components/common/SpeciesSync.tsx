import {
  Alert,
  StyleSheet,
  Text,
  View,
  Linking
} from 'react-native'
import React, { useEffect } from 'react'
import useDownloadFile from 'src/hooks/useSpeciesDownload'
import * as FileSystem from 'expo-file-system'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import { checkForMigrateSpecies, getLocalSpeciesSync, updateLocalSpeciesSync } from 'src/utils/helpers/asyncStorageHelper'
import { isWithin90Days } from 'src/utils/helpers/timeHelper'
import { useDispatch, useSelector } from 'react-redux'
import { setUpdateAppCount, updateSpeciesSyncStatus } from 'src/store/slice/appStateSlice'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import useInitialSetup from 'src/hooks/useInitialSetup'
import { RootState } from 'src/store'
import { updateSpeciesWriting } from 'src/store/slice/tempStateSlice'
import RotatingView from './RotatingView'
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg';
import { Typography, Colors } from 'src/utils/constants'
import i18next from 'i18next'
import VersionCheck from 'react-native-version-check-expo';

const SpeciesSync = () => {
  const { downloadFile, checkDownloadFolder } = useDownloadFile()
  const { writeBulkSpecies } = useManageScientificSpecies()
  const { addNewLog } = useLogManagement()
  const { setupApp } = useInitialSetup()
  const { speciesDownloading, speciesUpdatedAt } = useSelector((state: RootState) => state.tempState)
  const { speciesSync, speciesLocalURL, updateAppCount } = useSelector((state: RootState) => state.appState)

  const dispatch = useDispatch()
  useEffect(() => {
    isSpeciesDownloaded()
  }, [speciesUpdatedAt])


  useEffect(() => {
    if (speciesSync && speciesUpdatedAt !== 0 && speciesLocalURL) {
      readAndWriteSpecies()
    }
  }, [speciesLocalURL])


  useEffect(() => {
    setTimeout(() => {
      if (updateAppCount > 0) {
        checkForAppUpdate()
      }
    }, 3000);
  }, [])

  const checkForAppUpdate = async () => {
    try {
      const data = await VersionCheck.needUpdate()
      if (data?.currentVersion && data?.latestVersion) {
        const current = data.currentVersion.split('.').map(Number);
        const latest = data.latestVersion.split('.').map(Number);
        for (let i = 0; i < current.length; i++) {
          if (latest[i] > current[i]) {
            dispatch(setUpdateAppCount())
            return showUpdateAlert(data.storeUrl || '')
          } else if (latest[i] < current[i]) {
            return false
          }
        }
        return false
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }




  const showUpdateAlert = (url: string) => {
    Alert.alert("Update Available", "To ensure the app runs smoothly, please update the TreeMapper app to the latest version.",
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        { text: 'Update', onPress: () => { Linking.openURL(url) } }]
    )
  }


  const isSpeciesDownloaded = async () => {
    const folderExist = await checkDownloadFolder()
    if (!folderExist) {
      isSpeciesUpdateRequired()
      return
    }

    if (!speciesSync && speciesUpdatedAt !== 0 && speciesLocalURL) {
      readAndWriteSpecies()
      return
    }

    if (!speciesLocalURL) {
      isSpeciesUpdateRequired()
    }
  }


  const isSpeciesUpdateRequired = async () => {
    setupApp()
    const localSyncTimeStamp = await getLocalSpeciesSync()
    if (localSyncTimeStamp && speciesLocalURL) {
      const skipSpeciesSync = isWithin90Days(Number(localSyncTimeStamp))
      if (!skipSpeciesSync) {
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
      if (oldSpeciesDB) {
        await updateLocalSpeciesSync();
        dispatch(updateSpeciesSyncStatus(true))
        return
      }
      downloadFile()
    }
  }

  const readAndWriteSpecies = async () => {
    try {
      dispatch(updateSpeciesWriting(true))
      const speciesContent = await FileSystem.readAsStringAsync(
        speciesLocalURL + '/scientific_species.json',
        { encoding: 'utf8' },
      )
      const parsedData = JSON.parse(speciesContent)
      await writeBulkSpecies(parsedData)
      await updateLocalSpeciesSync();
      dispatch(updateSpeciesSyncStatus(true))
      dispatch(updateSpeciesWriting(false))
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data synced successfully",
        logLevel: 'info',
        statusCode: '000',
      })
    } catch (error) {
      dispatch(updateSpeciesWriting(false))
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Error occurred while syncing species data",
        logLevel: 'info',
        statusCode: '000',
      })
    }
  }


  const renderView = () => {
    if (speciesDownloading) {
      return (
        <View style={styles.container}>
          <RotatingView isClockwise={true}>
            <RefreshIcon />
          </RotatingView>
          <Text style={styles.label}>Species {i18next.t("label.syncing")}</Text>
        </View>
      )
    }
    return <></>
  }
  return renderView()
}

export default SpeciesSync


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    marginLeft: 5
  },
  label: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 8
  },
  infoIconWrapper: {
    marginRight: 5,
    marginLeft: 10
  },
})
