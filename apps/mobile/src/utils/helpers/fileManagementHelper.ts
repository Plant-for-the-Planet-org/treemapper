import { InterventionData } from 'src/types/interface/slice.interface';
import JSZip from 'jszip';
import { Paths, Directory, File } from 'expo-file-system/next';
import Share from 'react-native-share';
import Bugsnag from '@bugsnag/expo';

const mainFolder = "TreeMapper";
// Using Paths.document for document directory - maintains same location as RNFS.DocumentDirectoryPath
const documentDirectory = Paths.document.uri.endsWith('/')
  ? Paths.document.uri.slice(0, -1)
  : Paths.document.uri;
export const basePath = `${documentDirectory}/${mainFolder}`;

export const createNewInterventionFolder = async (id: string) => {
    try {
        const folderPath = `${basePath}/${id}`;
        const folder = new Directory(folderPath);
        if (!folder.exists) {
            folder.create({ intermediates: true });
            return { msg: 'Intervention folder created ' + id, hasError: false }
        } else {
            return { msg: 'Intervention folder already existed ' + id, hasError: false }
        }
    } catch (error) {
        Bugsnag.notify(error as Error)
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
        const file = new File(fileURI);
        if (file.exists) {
            file.delete();
        }
        return true
    } catch (error) {
        Bugsnag.notify(error as Error)
        return false
    }
}

export const interData = async (data: InterventionData) => {
    try {
        const filePath = `${basePath}/${data.intervention_id}/intervention.json`;
        const file = new File(filePath);
        const jsonData = JSON.stringify(data);
        await file.write(jsonData);
    } catch (error) {
        Bugsnag.notify(error as Error)
        console.error("Error writing intervention data:", error);
    }
}

export const createBasePath = async () => {
    try {
        const baseFolder = new Directory(basePath);
        if (!baseFolder.exists) {
            baseFolder.create({ intermediates: true });
            return { msg: 'Root folder created', hasError: false }
        }
        return { msg: 'Root folder exists', hasError: false, newFolder: false }
    } catch (error) {
        Bugsnag.notify(error as Error)
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
        const zipFile = new File(Paths.cache, `Intervention-${id}.zip`);
        const folderPath = `${basePath}/${id}`;
        const folder = new Directory(folderPath);

        // Create a new JSZip instance
        const zip = new JSZip();

        // Helper function to convert Uint8Array to base64
        const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        };

        // Get the list of files in the folder
        const items = folder.list();

        // Add each file to the zip
        for (const item of items) {
            if (item instanceof Directory) {
                // Handle subfolders recursively if needed
                const subItems = item.list();
                for (const subItem of subItems) {
                    if (subItem instanceof File) {
                        const content = subItem.bytes();
                        const base64Content = uint8ArrayToBase64(content);
                        zip.file(`${item.name}/${subItem.name}`, base64Content, { base64: true });
                    }
                }
            } else if (item instanceof File) {
                // Read and add file to zip (handles both text and binary files)
                const content = item.bytes();
                const base64Content = uint8ArrayToBase64(content);
                zip.file(item.name, base64Content, { base64: true });
            }
        }

        // Generate the zip content
        const zipContent = await zip.generateAsync({
            type: 'base64',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });

        // Write the zip file
        zipFile.write(zipContent);

        console.log(`Zip completed at ${zipFile.uri}`);

        // Keep the same Share logic
        const shareOptions = {
            title: `Intervention data-${id}`,
            url: `file://${zipFile.uri}`,
            type: 'application/zip',
        };

        await Share.open(shareOptions);
    } catch (error) {
        console.log('Error in zipAndShareFolder:', error);
    }
};