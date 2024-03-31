import * as FileSystem from 'expo-file-system';

export const copyImageAndGetData = (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
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
    const outputPath = `${FileSystem.documentDirectory}/${fileName}.${fileExtension}`;
    // stores the path from which the image should be copied
    const inputPath = `${FileSystem.cacheDirectory}/${parentDirectory}/${fileName}.${fileExtension}`;

    FileSystem.getInfoAsync(outputPath)
      .then(fileInfo => {
        if (fileInfo.exists) {
          return FileSystem.deleteAsync(outputPath);
        }
      })
      .then(() => FileSystem.copyAsync({ from: inputPath, to: outputPath }))
      .then(() => resolve(`${outputPath}`))
      .catch(err => {
        reject(err);
        console.error('error while saving file', err);
      });
  });
};