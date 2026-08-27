import { Paths, File } from 'expo-file-system';
import { basePath } from './fileManagementHelper';
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
    // expo-file-system wants an absolute file:// URI, not a bare path. The
    // camera hands us one already, but normalise so a bare path cannot reach
    // the native side, where it fails with "URI is not absolute".
    const sourceUri = imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`;

    // The camera already writes a compressed JPEG at the quality we ask it for,
    // so the capture is copied as-is. Do not re-encode it here: re-encoding
    // decodes the whole photo into a bitmap, and on a large-sensor phone that
    // is hundreds of MB in one allocation, which killed the app on this step.
    // Control the file size with the camera's targetResolution instead.
    const sourceFile = new File(sourceUri);
    const destFile = new File(outputPath);
    // Planned interventions are synced from the web and never get a local
    // folder created on the phone, so the destination directory may be missing.
    // Create it (idempotent) before copying, otherwise the native copy throws
    // "the file doesn't exist".
    const destDir = destFile.parentDirectory;
    if (!destDir.exists) {
      destDir.create({ idempotent: true, intermediates: true });
    }
    sourceFile.copy(destFile);

    deleteCameraTempFile(sourceFile, sourceUri);

    return Platform.OS === 'android' ? `file://${outputPath}` : outputPath;
  } catch (error) {
    throw new Error(`Image copy failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Android writes every capture to a throwaway file in the app cache directory
// and never cleans it up, so a long field session leaves one full-size copy per
// tree behind. Now that the photo has been copied to its permanent home, drop
// the original. The cache check keeps this from ever touching a real file, and
// a failure here must not fail the capture the user just made.
function deleteCameraTempFile(sourceFile: File, sourceUri: string): void {
  // Both sides are compared as URIs so this holds whatever scheme
  // `Paths.cache.uri` uses on the platform.
  const cacheDir = Paths.cache.uri.replace(/\/$/, '');
  if (!sourceUri.startsWith(`${cacheDir}/`)) {
    return;
  }
  try {
    sourceFile.delete();
  } catch {
    // Best effort only.
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
