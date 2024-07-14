import RNFS from 'react-native-fs';
import { InterventionData } from 'src/types/interface/slice.interface';
import { zip } from 'react-native-zip-archive';
import Share from 'react-native-share';

const mainFolder = "TreeMapper";
export const basePath = `${RNFS.DocumentDirectoryPath}/${mainFolder}`;
const tempDirectory = `${RNFS.CachesDirectoryPath}/TreeMapper_Data_${Date.now()}.zip`;

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

export const interData = async (data: InterventionData) => {
    try {
        const filePath = `${basePath}/${data.intervention_id}/intervention.json`;
        const jsonData = JSON.stringify(data);
        await RNFS.writeFile(filePath, jsonData, 'utf8');
    } catch (error) {
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
        return { msg: JSON.stringify(error), hasError: true, newFolder: false }
    }
}

export const exportAllInterventionData = async (dataArray: InterventionData[] | any) => {
    try {
        const createFolderPromises = dataArray.map(data => exportRealmData(data));
        await Promise.all(createFolderPromises);

        const writeDataPromises = dataArray.map(data => interData(data));
        await Promise.all(writeDataPromises);
        await zipAndShareFolder();
    } catch (error) {
        //error
    }
}

const zipAndShareFolder = async () => {
    try {
        const zipFilePath = tempDirectory;
        await zip(basePath, zipFilePath);
        const shareOptions = {
            title: 'Share Folder',
            url: `file://${zipFilePath}`,
            type: 'application/zip',
        };

        await Share.open(shareOptions);
    } catch (error) {
        //console.log(error)
    }
};
