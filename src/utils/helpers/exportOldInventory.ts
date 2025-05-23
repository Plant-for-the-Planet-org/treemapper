import RNFS from 'react-native-fs';
import { Alert } from 'react-native';
import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system';
import Share from 'react-native-share';

const sharedData = async (filePath: string, id: string) => {
  try {
    const zip = new JSZip();
    const outputPath = `${FileSystem.documentDirectory}${id}.zip`;
    
    // Read the file content
    const fileContent = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64
    });
    
    // Get the filename from the path
    const fileName = filePath.split('/').pop();
    
    // Add the file to the zip
    zip.file(fileName, fileContent, { base64: true });
    
    // Generate the zip file content
    const zipContent = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    // Write the zip file
    await FileSystem.writeAsStringAsync(outputPath, zipContent, {
      encoding: FileSystem.EncodingType.Base64
    });
    
    console.log(`Zip completed at ${outputPath}`);
    
    // Keep the same Share logic
    const options = {
      url: 'file://' + outputPath,
      type: 'application/pdf'
    };
    
    Share.open(options)
      .then(() => {
        console.log('done');
      })
      .catch(err => {
        console.log('err', err);
      });
      
  } catch (error) {
    console.error('Error in sharedData:', error);
  }
};
const writeJSON = async (data: any, filePath: string) => {
  try {
    await RNFS.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    Alert.alert('Error occurred while writing ' + '');
  }
};

export const convertData = async (inventory: any) => {
  try {
    const folderPath = RNFS.DocumentDirectoryPath + '/' + inventory.inventory_id; // Example folder path
    const baseFolderExists = await RNFS.exists(folderPath);
    if(baseFolderExists){
       await RNFS.unlink(folderPath)
    }
    RNFS.mkdir(folderPath)
      .then(async () => {
        const filePath = `${folderPath}/data.json`;
        const imgData = {
          inventoryID: inventory.inventory_id,
          data: { ...inventory },
        };
        await writeJSON(imgData, filePath);
        setTimeout(async () => {
          const polygonImagesPromises = await inventory.polygons[0].coordinates.map(
            async (element, i) => {
              const sourceFilePath = `${RNFS.DocumentDirectoryPath}/${element.imageUrl}`;
              const destinationFilePath = `${folderPath}/${inventory.inventory_id}-poly-${i}.jpeg`;
              await RNFS.copyFile(sourceFilePath, destinationFilePath);
              return '';
            },
          );

          const sampleTreeImagesPromises = inventory.sampleTrees.map(async (element: { imageUrl: any; plantationDate: string; }, i: any) => {
            const sourceFilePath = `${RNFS.DocumentDirectoryPath}/${element.imageUrl}`;
            const dateNumber = Date.parse(element.plantationDate);
            const destinationFilePath = `${folderPath}/${dateNumber}-sample-${i}.jpeg`;
            await RNFS.copyFile(sourceFilePath, destinationFilePath);
            return '';
          });

          const polygonImages = await Promise.all(polygonImagesPromises);
          const SampleTreeImages = await Promise.all(sampleTreeImagesPromises);

          const FinalData = { ...inventory, polygonImages, SampleTreeImages };

          Alert.alert('Data exported successfully');
          console.log('FinalData polygonImages', FinalData.polygonImages.length);
          await sharedData(folderPath, inventory.inventory_id);
        }, 1000);
      })
      .catch(err => {
        console.log("err",err)
        Alert.alert('Error occurred at folder creation');
      });
  } catch (error) {
    Alert.alert('Error occurred ' + JSON.stringify(error));
  }
};


export const onlyExportJSON = async (inventory: any) => {
  try {
    const folderPath = RNFS.DocumentDirectoryPath + '/' + inventory.inventory_id; // Example folder path
    const baseFolderExists = await RNFS.exists(folderPath);
    if(baseFolderExists){
       await RNFS.unlink(folderPath)
    }
    RNFS.mkdir(folderPath)
      .then(async () => {
        const filePath = `${folderPath}/data.json`;
        const imgData = {
          inventoryID: inventory.inventory_id,
          data: { ...inventory },
        };
        await writeJSON(imgData, filePath);
        await sharedData(folderPath, inventory.inventory_id);
      })
      .catch(err => {
        console.log(err)
        Alert.alert('Error occurred at folder creation');
      });
  } catch (error) {
    Alert.alert('Error occurred ' + JSON.stringify(error));
  }
};