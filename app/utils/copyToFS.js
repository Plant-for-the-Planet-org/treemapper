import RNFS from 'react-native-fs';

export const copyImageAndGetData = async (imagePath) => {
  // splits and stores the image path directories
  let splittedPath = imagePath.split('/');
  // splits and stores the file name and extension which is present on last index
  let fileName = splittedPath.pop();
  // splits and stores the file parent directory which is present on last index after pop
  const parentDirectory = splittedPath.pop();
  // splits and stores the file extension
  const fileExtension = fileName.split('.').pop();
  // splits and stores the file name
  fileName = fileName.split('.')[0];

  // stores the destination path in which image should be stored
  const outputPath = `${RNFS.DocumentDirectoryPath}/${fileName}.${fileExtension}`;

  // stores the path from which the image should be copied
  const inputPath = `${RNFS.CachesDirectoryPath}/${parentDirectory}/${fileName}.${fileExtension}`;

  try {
    if (await RNFS.exists(outputPath)) {
      await RNFS.unlink(outputPath);
    }
    // copies the image to destination folder
    await RNFS.copyFile(inputPath, outputPath);
    return `${fileName}.${fileExtension}`;
  } catch (err) {
    console.error('error while saving file', err);
  }
};
