import RNFS from 'react-native-fs';
import { InterventionData } from 'src/types/interface/slice.interface';
import { zip } from 'react-native-zip-archive';
import Share from 'react-native-share';
import { Alert } from 'react-native';

const mainFolder = "TreeMapper"
export const basePath = `${RNFS.DocumentDirectoryPath}/${mainFolder}`
const tempDirectory = `${RNFS.CachesDirectoryPath}/TreeMapper_Data_${Date.now()}.zip`

export const createNewInterventionFolder = async (id: string) => {
    try {
        const folderPath = `${basePath}/${id}`
        // Check if the folder already exists
        const folderExists = await RNFS.exists(folderPath);

        if (!folderExists) {
            // Create the folder
            await RNFS.mkdir(folderPath);
            console.log('Folder created at:', folderPath);
        } else {
            console.log('Folder already exists at:', folderPath);
        }
    } catch (error) {
        console.error('Error creating folder:', error);
    }
}

const exportRealmData = async (data: InterventionData) => {
    try {
        await createNewInterventionFolder(data.intervention_id)
        console.log("Data writing folder creaetd")

    } catch (error) {
        console.log("error", error)
    }
}

export const interData = async (data: InterventionData) => {
    try {
        const folderPath = `${basePath}/${data.intervention_id}/intervention.json`;
        const jsonData = JSON.stringify(data);
        await RNFS.writeFile(folderPath, jsonData, 'utf8');
        console.log("Data writing folder creaetd")

    } catch (error) {
        console.log("Skjdc", error)
    }
}

export const createBasePath = async () => {
    try { await createNewInterventionFolder(basePath); } catch (err) { console.log("Sdlkcj", err) }
}


export const exportAllInterventionData = async (dataArray: InterventionData[] | any) => {
    try {
        const promises = dataArray.map(async (data) => {
            console.log("Data writing started")
            await exportRealmData(data);
        });

        // Wait for all operations to complete
        await Promise.all(promises);
        const ss = dataArray.map(async (data) => {
            console.log("Data writing started")
            await interData(data);
        });
        await Promise.all(ss);

        console.log("Success");
        zipAndShareFolder()
    } catch (error) {
        console.error("Error processing data:", error);
    }
};


const zipAndShareFolder = async () => {
    try {
        // Define the path for the zip file
        const zipFilePath = tempDirectory;

        // Zip the folder
        const path = await zip(basePath, zipFilePath);
        console.log(`zip completed at ${path}`);

        // Share the zip file
        const shareOptions = {
            title: 'Share Folder',
            url: `file://${zipFilePath}`,
            type: 'application/zip',
        };

        await Share.open(shareOptions);

        // Clean up the zip file if needed
        // await RNFS.unlink(zipFilePath);
    } catch (error) {
        console.error('Error zipping and sharing folder:', error);
        Alert.alert('Error', 'There was an error zipping and sharing the folder.');
    }
};