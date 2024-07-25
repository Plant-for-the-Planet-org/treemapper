import { useState } from 'react'
import * as FileSystem from 'expo-file-system'
import { unzip } from 'react-native-zip-archive'
import { SPECIES_SYNC_STATE } from 'src/types/enum/app.enum'
import useLogManagement from './realm/useLogManagement'
import { getUrlApi } from 'src/api/api.url'

const useDownloadFile = () => {
  const [currentState, setCurrentState] = useState(SPECIES_SYNC_STATE.INITIAL)
  const [finalURL, setFinalURL] = useState<string | null>(null)
  const { addNewLog } = useLogManagement()

  const fileUrl = getUrlApi.getAllSpeciesArchieve
  const zipFilePath = `${FileSystem.cacheDirectory}archive.zip`
  const targetFilePath = `${FileSystem.cacheDirectory}unzipped`

  const downloadFile = async () => {
    try {
      setCurrentState(SPECIES_SYNC_STATE.DOWNLOADING)
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
      setCurrentState(SPECIES_SYNC_STATE.ERROR_OCCURED)
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Error occured while downloading species",
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
        message: "Species data unziped successfully",
        logLevel: 'info',
        statusCode: '000',
      })
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data adding started",
        logLevel: 'info',
        statusCode: '000',
      })
      setCurrentState(SPECIES_SYNC_STATE.READING_FILE)
      setFinalURL(targetFilePath)
    } catch (error) {
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Error occured while unziping species data",
        logLevel: 'error',
        statusCode: '000',
        logStack: JSON.stringify(error)
      })
      setCurrentState(SPECIES_SYNC_STATE.ERROR_OCCURED)
    }
  }

  return { downloadFile, finalURL, currentState }
}

export default useDownloadFile
