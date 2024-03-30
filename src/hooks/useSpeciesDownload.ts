import {useState} from 'react'
import * as FileSystem from 'expo-file-system'
import {unzip} from 'react-native-zip-archive'
import { SPECIES_SYNC_STATE } from 'src/types/enum/app.enum'

const useDownloadFile = () => {
  const [currentState, setCurrentState] = useState(SPECIES_SYNC_STATE.INITIAL)
  const [finalURL, setFinalURL] = useState('')

  const API_ENDPOINT = process.env.EXPO_PUBLIC_API_ENDPOINT
  const fileUrl = `https://${API_ENDPOINT}/treemapper/scientificSpeciesArchive`
  const zipFilePath = `${FileSystem.documentDirectory}archive.zip`
  const targetFilePath = `${FileSystem.cacheDirectory}unzipped`

  const downloadFile = async () => {
    try {
      setCurrentState(SPECIES_SYNC_STATE.DOWNLOADING)
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        zipFilePath,
        {},
      )
      await downloadResumable.downloadAsync()
      setCurrentState(SPECIES_SYNC_STATE.UNZIPPING_FILE)
      await unzipFile(zipFilePath, targetFilePath)
    } catch (error) {
      setCurrentState(SPECIES_SYNC_STATE.ERROR_OCCURED)
    }
  }

  const unzipFile = async (zipFilePath, targetFilePath) => {
    try {
      await unzip(zipFilePath, targetFilePath)
      setCurrentState(SPECIES_SYNC_STATE.READING_FILE)
      setFinalURL(targetFilePath)
    } catch (error) {
      setCurrentState(SPECIES_SYNC_STATE.ERROR_OCCURED)
    }
  }

  return {downloadFile, finalURL, currentState}
}

export default useDownloadFile
