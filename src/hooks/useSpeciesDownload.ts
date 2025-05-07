import { useState } from 'react'
import * as FileSystem from 'expo-file-system'
import { SPECIES_SYNC_STATE } from 'src/types/enum/app.enum'
import JSZip from 'jszip';
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
      await unzipActualFile(zipFilePath, targetFilePath)
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

  const unzipActualFile = async (zipFilePath, targetPath) => {
    try {
      // Read the zip file
      const zipData = await FileSystem.readAsStringAsync(zipFilePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Load the zip
      const zip = await JSZip.loadAsync(zipData, { base64: true });
      
      // Extract all files
      const promises = [];
      
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const promise = zipEntry.async('base64').then(async (content) => {
            const filePath = `${targetPath}/${relativePath}`;
            const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
            
            // Create directory if it doesn't exist
            try {
              await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
            } catch (err) {
              // Directory might already exist
            }
            
            // Write the file
            return FileSystem.writeAsStringAsync(filePath, content, {
              encoding: FileSystem.EncodingType.Base64,
            });
          });
          promises.push(promise);
        }
      });
      
      await Promise.all(promises);
      console.log('Unzip completed successfully');
      return true;
    } catch (error) {
      console.error('Error unzipping file:', error);
      throw error;
    }
  };

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
