import * as FileSystem from 'expo-file-system';
import { basePath } from './fileManagementHelper';
import * as ImageManipulator from 'expo-image-manipulator';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

export const copyImageAndGetData = async (imagePath: string, interventionId: string, isSpecies: boolean): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Calling an async function inside the Promise executor
    handleImageCopy(imagePath, interventionId, isSpecies)
      .then(resolve)
      .catch((error) => reject(new Error(`Image copy failed: ${error.message || error}`)));
  });
};

async function handleImageCopy(imagePath: string, interventionId: string, isSpecies: boolean): Promise<string> {
  try {
    // splits and stores the image path directories
    const splittedPath = imagePath.split('/');
    // splits and stores the file name and extension which is present on last index
    let fileName = splittedPath.pop();
    // splits and stores the file parent directory which is present on last index after pop
    const parentDirectory = splittedPath.pop();
    // splits and stores the file extension
    const fileExtension = fileName.split('.').pop();
    // splits and stores the file name
    fileName = fileName.split('.')[0];

    // stores the destination path in which image should be stored
    const outputPath = isSpecies ? `${FileSystem.documentDirectory}/${interventionId}-${Date.now()}.${fileExtension}` : `${basePath}/${interventionId}/${fileName}.${fileExtension}`;
    // stores the path from which the image should be copied
    const inputPath = `${FileSystem.cacheDirectory}/${parentDirectory}/${fileName}.${fileExtension}`; //TESTING
    const compFile = await compressImage(inputPath, 0.7)
    await RNFS.copyFile(compFile, outputPath);
    return Platform.OS === 'android' ? `file://${outputPath}` : outputPath;
  } catch (error) {
    throw new Error(error);
  }
}

async function compressImage(uri: string, compressValue: number): Promise<string> {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        compress: compressValue, // Compression ratio from 0 to 1
        format: ImageManipulator.SaveFormat.JPEG, // You can use JPEG or PNG format
      }
    );
    return manipulatedImage.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return '';
  }
}

function replaceId(originalString) {
   // Use a regular expression to match everything up to and including "/Documents"
   const updatedString = originalString.replace(/.*\/Documents/, '');
   return `${FileSystem.documentDirectory}${updatedString}`;
}

// Function to update old paths by removing everything before '/TreeMapper' and adding RNFS.DocumentDirectoryPath
export function updateFilePath(oldPath) {
  // Find the position of '/TreeMapper' in the old path
  const treeMapperIndex = oldPath.indexOf('/TreeMapper');

  // If '/TreeMapper' is found in the path
  if (treeMapperIndex !== -1) {
    // Extract the part after '/TreeMapper'
    const relativePath = oldPath.substring(treeMapperIndex);

    // Prepend RNFS.DocumentDirectoryPath to construct the new path
    const newPath = `${RNFS.DocumentDirectoryPath}${relativePath}`;

    return Platform.OS==='android'?`file://${newPath}`:newPath;
  } else {  
    if(Platform.OS==='ios'){
      return replaceId(oldPath)
    }
    return oldPath;
  }
}
