import { useState } from 'react'
import { File, Directory, Paths } from 'expo-file-system'
import { SPECIES_SYNC_STATE } from 'src/types/enum/app.enum'
import JSZip from 'jszip';
import useLogManagement from './realm/useLogManagement'
import { getUrlApi } from 'src/api/api.url'
import Bugsnag from '@bugsnag/expo'
import { useToast } from 'react-native-toast-notifications'
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

  // Create directories for cache
  const cacheDir = new Directory(Paths.cache, 'species')
  const targetDir = new Directory(Paths.document, 'unzipped')

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

      // Ensure cache directory exists
      if (!cacheDir.exists) {
        await cacheDir.create()
      }

      // Download file using new API
      const downloadedFile = await File.downloadFileAsync(fileUrl, cacheDir, {
        idempotent: true // Overwrite if exists
      })

      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data downloaded successfully",
        logLevel: 'info',
        statusCode: '000',
      })
      setCurrentState(SPECIES_SYNC_STATE.UNZIPPING_FILE)
      await unzipFile(downloadedFile, targetDir)
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

  const unzipFile = async (zipFile: File, targetDirectory: Directory) => {
    try {
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Species data unzip started",
        logLevel: 'info',
        statusCode: '000',
      })
      await unzipActualFile(zipFile, targetDirectory)
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
      dispatch(updateSpeciesDownloaded(targetDirectory.uri))
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

  const unzipActualFile = async (zipFile: File, targetDirectory: Directory) => {
    try {
      // Ensure target directory exists
      if (!targetDirectory.exists) {
        targetDirectory.create()
      }

      // Read the zip file as base64
      const zipData = await zipFile.base64();

      // Load the zip
      const zip = await JSZip.loadAsync(zipData, { base64: true });

      // Extract all files
      const promises: Promise<void>[] = [];

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const promise = zipEntry.async('text').then(async (content) => {
            // Split path to create nested directories
            const pathParts = relativePath.split('/');
            const fileName = pathParts.pop() || '';

            // Create nested directory structure
            let currentDir = targetDirectory;
            for (const part of pathParts) {
              if (part) {
                currentDir = new Directory(currentDir, part);
                if (!currentDir.exists) {
                  currentDir.create();
                }
              }
            }

            // Write the file
            const targetFile = new File(currentDir, fileName);
            await targetFile.write(content);
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

  const checkDownloadFolder = () => {
    try {
      // Check if the target unzipped directory exists
      return targetDir.exists
    } catch (error) {
      return false
    }
  }

  return { downloadFile, currentState, checkDownloadFolder }
}

export default useDownloadFile
