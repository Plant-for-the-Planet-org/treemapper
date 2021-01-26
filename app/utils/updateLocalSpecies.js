import RNFS, { DocumentDirectoryPath } from 'react-native-fs';
import { updateLocalSpecies as updateLocalSpeciesRepo } from '../repositories/species';
import { unzip } from 'react-native-zip-archive';
import { APIConfig } from '../actions/Config';
import AsyncStorage from '@react-native-community/async-storage';

const updateSpeciesFromFile = async (targetPath) => {
  let speciesContent = await RNFS.readFile(targetPath, 'utf8');
  speciesContent = JSON.parse(speciesContent);
  updateLocalSpeciesRepo(speciesContent)
    .then(async () => {
      await AsyncStorage.setItem('isLocalSpeciesUpdated', 'true');
    })
    .catch((err) => {
      console.error(err);
    });
};

export default async function updateLocalSpecies() {
  // stores the target path of the json file
  const targetPath = `${DocumentDirectoryPath}/scientific_species.json`;

  // checks whether the file exist or not
  const doesPathExist = await RNFS.exists(targetPath);

  // calls the function and stores whether species data was already loaded or not
  const isSpeciesLoaded = await AsyncStorage.getItem('isLocalSpeciesUpdated');

  // if species data is not loaded and path exists then it reads the file and calls the updateLocalSpecies function
  // with parsed file content to update the data in realm DB
  // .
  // else it checks if species data is not loaded then and json file also not exists then calls the archive api
  // to get the zip file then extract and save it to document directory
  if (isSpeciesLoaded !== 'true' && doesPathExist) {
    updateSpeciesFromFile(targetPath);
  } else if (isSpeciesLoaded !== 'true' && !doesPathExist) {
    try {
      const { protocol, url } = APIConfig;

      // stores the path of zip file
      const zipFilePath = `${DocumentDirectoryPath}/species.zip`;

      RNFS.downloadFile({
        fromUrl: `${protocol}://${url}/treemapper/scientificSpeciesArchive`,
        toFile: zipFilePath,
      })
        .promise.then(async (response) => {
          console.log('download file response', response);
          if (response.statusCode === 200) {
            const path = await unzip(zipFilePath, DocumentDirectoryPath, 'UTF-8');
            console.log('unzip path >', path);
            updateSpeciesFromFile(targetPath);
          }
        })
        .catch((err) => {
          console.error(
            `Error at /utils/updateLocalSpecies - downloadFile, ${JSON.stringify(err)}`,
          );
        });
    } catch (err) {
      console.error(`Error at /utils/updateLocalSpecies, ${JSON.stringify(err)}`);
      console.log(Object.keys(err));
    }
  }
}
