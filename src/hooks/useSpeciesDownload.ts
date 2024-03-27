import {useState} from 'react'
import * as FileSystem from 'expo-file-system'
import {unzip} from 'react-native-zip-archive'

const useDownloadFile = () => {
  const [downloadError, setDownloadError] = useState(null)
  const [unzipError, setUnzipError] = useState(null)
  const [finalURL, setFinalURL] = useState('')
  const API_ENDPOINT = process.env.EXPO_PUBLIC_API_ENDPOINT
  const fileUrl = `https://${API_ENDPOINT}/treemapper/scientificSpeciesArchive`
  const zipFilePath = `${FileSystem.documentDirectory}archive.zip`
  const targetFilePath = `${FileSystem.cacheDirectory}unzipped`

  const downloadFile = async () => {
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        zipFilePath,
        {},
      )

      const {uri} = await downloadResumable.downloadAsync()
      console.log('File downloaded successfully:', uri)
      setDownloadError(null)
      // Unzip the downloaded file
      await unzipFile(zipFilePath, targetFilePath)
    } catch (error) {
      console.error('Error downloading file:', error)
      setDownloadError(error)
    }
  }

  const unzipFile = async (zipFilePath, targetFilePath) => {
    try {
      const unzipResult = await unzip(zipFilePath, targetFilePath)
      console.log('File unzipped successfully:', unzipResult)
      setFinalURL(targetFilePath)
      setUnzipError(null)
    } catch (error) {
      console.error('Error unzipping file:', error)
      setUnzipError(error)
    }
  }

  return {downloadFile, finalURL, downloadError, unzipError}
}

export default useDownloadFile
