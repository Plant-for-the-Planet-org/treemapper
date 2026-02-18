import { Paths, File } from 'expo-file-system';
import { basePath } from './fileManagementHelper';
import * as ImageManipulator from 'expo-image-manipulator';
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
    if (!fileName) {
      throw new Error('Invalid image path - no filename found');
    }
    // splits and stores the file extension
    const fileExtension = fileName.split('.').pop();
    // splits and stores the file name
    fileName = fileName.split('.')[0];

    // stores the destination path in which image should be stored
    const documentDir = Paths.document.uri.endsWith('/') ? Paths.document.uri.slice(0, -1) : Paths.document.uri;
    const outputPath = isSpecies ? `${documentDir}/${interventionId}-${Date.now()}.${fileExtension}` : `${basePath}/${interventionId}/${fileName}.${fileExtension}`;
    // Use the original image path directly for compression
    // Stripping file:// prefix if present since expo-file-system uses bare paths
    const inputPath = imagePath.startsWith('file://') ? imagePath.slice(7) : imagePath;
    const compFile = await compressImage(inputPath, 0.7)

    // Copy file using Expo FileSystem
    const sourceFile = new File(compFile);
    const destFile = new File(outputPath);
    sourceFile.copy(destFile);

    return Platform.OS === 'android' ? `file://${outputPath}` : outputPath;
  } catch (error) {
    throw new Error(`Image copy failed: ${error instanceof Error ? error.message : String(error)}`);
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

function replaceId(originalString: string) {
   // Use a regular expression to match everything up to and including "/Documents"
   const updatedString = originalString.replace(/.*\/Documents/, '');
   const documentDir = Paths.document.uri.endsWith('/') ? Paths.document.uri.slice(0, -1) : Paths.document.uri;
   return `${documentDir}${updatedString}`;
}

// Function to update old paths by removing everything before '/TreeMapper' and adding document directory path
// This ensures backward compatibility with files created using RNFS
export function updateFilePath(oldPath: string) {
  // Find the position of '/TreeMapper' in the old path
  const treeMapperIndex = oldPath.indexOf('/TreeMapper');

  // If '/TreeMapper' is found in the path
  if (treeMapperIndex !== -1) {
    // Extract the part after '/TreeMapper'
    const relativePath = oldPath.substring(treeMapperIndex);

    // Prepend document directory path to construct the new path
    // Paths.document.uri points to the same location as RNFS.DocumentDirectoryPath
    const documentDir = Paths.document.uri.endsWith('/') ? Paths.document.uri.slice(0, -1) : Paths.document.uri;
    const newPath = `${documentDir}${relativePath}`;

    return Platform.OS==='android'?`file://${newPath}`:newPath;
  } else {
    if(Platform.OS==='ios'){
      return replaceId(oldPath)
    }
    return oldPath;
  }
}
