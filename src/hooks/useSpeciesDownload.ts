import { useState } from 'react'
import * as FileSystem from 'expo-file-system'
import { unzip } from 'react-native-zip-archive'
import { SPECIES_SYNC_STATE } from 'src/types/enum/app.enum'
import useLogManagement from './realm/useLogManagement'
import { getUrlApi } from 'src/api/api.url'
import Bugsnag from '@bugsnag/expo'
import { useToast } from 'react-native-toast-notifications'
import RNFS from 'react-native-fs';
import { updateLocalSpeciesSync } from 'src/utils/helpers/asyncStorageHelper'
import { useDispatch } from 'react-redux'
import { updateSpeciesDownloading } from 'src/store/slice/tempStateSlice'
import { updateSpeciesDownloaded } from 'src/store/slice/appStateSlice'

const useDownloadFile = () => {
  const [currentState, setCurrentState] = useState(SPECIES_SYNC_STATE.INITIAL)
  const { addNewLog } = useLogManagement()
  const toast = useToast()
  const dispatch = useDispatch()
  const fileUrl = getUrlApi.getAllSpeciesAchieve
  const zipFilePath = `${FileSystem.documentDirectory}archive.zip`
  const targetFilePath = `${FileSystem.documentDirectory}unzipped`
  const downloadFile = async () => {
    try {
      setCurrentState(SPECIES_SYNC_STATE.DOWNLOADING)
      dispatch(updateSpeciesDownloading(true))
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data downloading started",
        logLevel: 'info',
        statusCode: '000',
      })
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        zipFilePath,
        {},
      )
      await downloadResumable.downloadAsync()
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data downloaded successfully",
        logLevel: 'info',
        statusCode: '000',
      })
      setCurrentState(SPECIES_SYNC_STATE.UNZIPPING_FILE)
      await unzipFile(zipFilePath, targetFilePath)
    } catch (error) {
      dispatch(updateSpeciesDownloading(false))
      Bugsnag.notify(error)
      setCurrentState(SPECIES_SYNC_STATE.ERROR_OCCURRED)
      toast.show("Error occurred while downloading species data")
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Error occurred while downloading species",
        logLevel: 'error',
        statusCode: '000',
        logStack: JSON.stringify(error)
      })
    }
  }

  const unzipFile = async (zipFilePath, targetFilePath) => {
    try {
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data unzip started",
        logLevel: 'info',
        statusCode: '000',
      })
      await unzip(zipFilePath, targetFilePath)
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data unzipped successfully",
        logLevel: 'info',
        statusCode: '000',
      })
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data adding started",
        logLevel: 'info',
        statusCode: '000',
      })
      await updateLocalSpeciesSync();
      dispatch(updateSpeciesDownloading(false))
      dispatch(updateSpeciesDownloaded(targetFilePath))
      setCurrentState(SPECIES_SYNC_STATE.READING_FILE)
    } catch (error) {
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Error occurred while unzipping species data",
        logLevel: 'error',
        statusCode: '000',
        logStack: JSON.stringify(error)
      })
      setCurrentState(SPECIES_SYNC_STATE.ERROR_OCCURRED)
    }
  }

  const checkDownloadFolder = async () => {
    try {
      const folderExists = await RNFS.exists(zipFilePath);
      if (folderExists) {
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  return { downloadFile, currentState, checkDownloadFolder }
}

export default useDownloadFile
