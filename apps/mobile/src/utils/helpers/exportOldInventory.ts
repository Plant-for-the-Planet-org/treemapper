import { Alert } from 'react-native';
import JSZip from 'jszip';
import { Paths, File, Directory } from 'expo-file-system';
import Share from 'react-native-share';

const sharedData = async (filePath: string, id: string) => {
  try {
    const zip = new JSZip();

    // Helper function to convert ArrayBuffer to base64
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    // Read the file content
    const file = new File(filePath);
    const fileBuffer = await file.arrayBuffer();
    const fileContent = arrayBufferToBase64(fileBuffer);

    // Get the filename from the path
    const fileName = filePath.split('/').pop();

    if (!fileName) {
      throw new Error('Invalid file path - no filename found');
    }

    // Add the file to the zip
    zip.file(fileName, fileContent, { base64: true });

    // Generate the zip file content
    const zipContent = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    // Write the zip into the app cache. Files outside the internal cache dir
    // cannot be turned into a content:// URI by react-native-share 12.x,
    // see shareJSONFile in fileManagementHelper.
    const outputFile = new File(Paths.cache, `${id}.zip`);
    if (outputFile.exists) {
      outputFile.delete();
    }
    outputFile.create({ intermediates: true });
    outputFile.write(zipContent);

    const options = {
      url: outputFile.uri,
      type: 'application/zip'
    };

    Share.open(options)
      .then(() => {
      })
      .catch(err => {
      });

  } catch (error) {
    console.error('Error in sharedData:', error);
  }
};
const writeJSON = async (data: any, filePath: string) => {
  try {
    const file = new File(filePath);
    file.write(JSON.stringify(data, null, 2));
  } catch (error) {
    Alert.alert('Error occurred while writing ' + '');
  }
};

export const convertData = async (inventory: any) => {
  try {
    const documentDir = Paths.document.uri.endsWith('/') ? Paths.document.uri.slice(0, -1) : Paths.document.uri;
    const folderPath = documentDir + '/' + inventory.inventory_id; // Example folder path
    const folder = new Directory(folderPath);

    if(folder.exists){
       folder.delete();
    }

    try {
      folder.create({ idempotent: true });
      const filePath = `${folderPath}/data.json`;
      const imgData = {
        inventoryID: inventory.inventory_id,
        data: { ...inventory },
      };
      await writeJSON(imgData, filePath);

      setTimeout(async () => {
        const polygonImagesPromises = await inventory.polygons[0].coordinates.map(
          async (element: any, i: number) => {
            const sourceFilePath = `${documentDir}/${element.imageUrl}`;
            const destinationFilePath = `${folderPath}/${inventory.inventory_id}-poly-${i}.jpeg`;
            const sourceFile = new File(sourceFilePath);
            const destFile = new File(destinationFilePath);
            sourceFile.copy(destFile);
            return '';
          },
        );

        const sampleTreeImagesPromises = inventory.sampleTrees.map(async (element: { imageUrl: any; plantationDate: string; }, i: number) => {
          const sourceFilePath = `${documentDir}/${element.imageUrl}`;
          const dateNumber = Date.parse(element.plantationDate);
          const destinationFilePath = `${folderPath}/${dateNumber}-sample-${i}.jpeg`;
          const sourceFile = new File(sourceFilePath);
          const destFile = new File(destinationFilePath);
          sourceFile.copy(destFile);
          return '';
        });

        const polygonImages = await Promise.all(polygonImagesPromises);
        const SampleTreeImages = await Promise.all(sampleTreeImagesPromises);

        const FinalData = { ...inventory, polygonImages, SampleTreeImages };

        Alert.alert('Data exported successfully');
        await sharedData(folderPath, inventory.inventory_id);
      }, 1000);
    } catch (err) {
      Alert.alert('Error occurred at folder creation');
    }
  } catch (error) {
    Alert.alert('Error occurred ' + JSON.stringify(error));
  }
};


export const onlyExportJSON = async (inventory: any) => {
  try {
    const documentDir = Paths.document.uri.endsWith('/') ? Paths.document.uri.slice(0, -1) : Paths.document.uri;
    const folderPath = documentDir + '/' + inventory.inventory_id; // Example folder path
    const folder = new Directory(folderPath);

    if(folder.exists){
       folder.delete();
    }

    try {
      folder.create({ idempotent: true });
      const filePath = `${folderPath}/data.json`;
      const imgData = {
        inventoryID: inventory.inventory_id,
        data: { ...inventory },
      };
      await writeJSON(imgData, filePath);
      await sharedData(folderPath, inventory.inventory_id);
    } catch (err) {
      Alert.alert('Error occurred at folder creation');
    }
  } catch (error) {
    Alert.alert('Error occurred ' + JSON.stringify(error));
  }
};