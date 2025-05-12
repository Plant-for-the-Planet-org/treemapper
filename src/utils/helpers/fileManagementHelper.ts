import RNFS from 'react-native-fs';
import { InterventionData } from 'src/types/interface/slice.interface';
import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system';
import Share from 'react-native-share';
import Bugsnag from '@bugsnag/expo';

const mainFolder = "TreeMapper";
export const basePath = `${RNFS.DocumentDirectoryPath}/${mainFolder}`;

export const createNewInterventionFolder = async (id: string) => {
    try {
        const folderPath = `${basePath}/${id}`;
        const folderExists = await RNFS.exists(folderPath);
        if (!folderExists) {
            await RNFS.mkdir(folderPath);
            return { msg: 'Intervention folder created ' + id, hasError: false }
        } else {
            return { msg: 'Intervention folder already existed ' + id, hasError: false }
        }
    } catch (error) {
        Bugsnag.notify(error)
        return { msg: JSON.stringify(error), hasError: true }
    }
}

const exportRealmData = async (data: InterventionData) => {
    try {
        await createNewInterventionFolder(data.intervention_id);
    } catch (error) {
        console.error("Error exporting realm data:", error);
    }
}

export const deleteImageFile = async (fileURI: string) => {
    try {
        await RNFS.unlink(fileURI);
        return true
    } catch (error) {
        Bugsnag.notify(error)
        return false
    }
}

export const interData = async (data: InterventionData) => {
    try {
        const filePath = `${basePath}/${data.intervention_id}/intervention.json`;
        const jsonData = JSON.stringify(data);
        await RNFS.writeFile(filePath, jsonData, 'utf8');
    } catch (error) {
        Bugsnag.notify(error)
        console.error("Error writing intervention data:", error);
    }
}

export const createBasePath = async () => {
    try {
        const baseFolderExists = await RNFS.exists(basePath);
        if (!baseFolderExists) {
            await RNFS.mkdir(basePath);
            return { msg: 'Root folder created', hasError: false }
        }
        return { msg: 'Root folder exists', hasError: false, newFolder: false }
    } catch (error) {
        Bugsnag.notify(error)
        return { msg: JSON.stringify(error), hasError: true, newFolder: false }
    }
}

export const exportAllInterventionData = async (data: InterventionData) => {
    try {
        await exportRealmData(data);
        await interData(data);
        await zipAndShareFolder(data.intervention_id);
    } catch (error) {
        //error
    }
}

const zipAndShareFolder = async (id: string) => {
    try {
        const zipFilePath = `${FileSystem.cacheDirectory}Intervention-${id}.zip`;
        const folderPath = `${basePath}/${id}`;
        
        // Create a new JSZip instance
        const zip = new JSZip();
        
        // Get the list of files in the folder
        const files = await FileSystem.readDirectoryAsync(folderPath);
        
        // Add each file to the zip
        for (const file of files) {
            const fullPath = `${folderPath}/${file}`;
            const fileInfo = await FileSystem.getInfoAsync(fullPath);
            
            if (fileInfo.isDirectory) {
                // Handle subfolders recursively if needed
                // This is a simplified version - you may need to expand this
                // to handle nested directories
                const subFiles = await FileSystem.readDirectoryAsync(fullPath);
                for (const subFile of subFiles) {
                    const subFilePath = `${fullPath}/${subFile}`;
                    const content = await FileSystem.readAsStringAsync(subFilePath, {
                        encoding: FileSystem.EncodingType.Base64
                    });
                    zip.file(`${file}/${subFile}`, content, { base64: true });
                }
            } else {
                // Read and add file to zip
                const content = await FileSystem.readAsStringAsync(fullPath, {
                    encoding: FileSystem.EncodingType.Base64
                });
                zip.file(file, content, { base64: true });
            }
        }
        
        // Generate the zip content
        const zipContent = await zip.generateAsync({
            type: 'base64',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });
        
        // Write the zip file
        await FileSystem.writeAsStringAsync(zipFilePath, zipContent, {
            encoding: FileSystem.EncodingType.Base64
        });
        
        console.log(`Zip completed at ${zipFilePath}`);
        
        // Keep the same Share logic
        const shareOptions = {
            title: `Intervention data-${id}`,
            url: `file://${zipFilePath}`,
            type: 'application/zip',
        };

        await Share.open(shareOptions);
    } catch (error) {
        console.log('Error in zipAndShareFolder:', error);
    }
};