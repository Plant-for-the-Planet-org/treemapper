import { getSchema } from './../repositories/default';
import Realm from 'realm';
import { addAliasesAndDescriptionOnServer, UpdateSpeciesImage } from '../actions/species';
// import RNFS from 'react-native-fs';

// export const UpdateSpeciesImage = (image, speciesId) => {
//   return new Promise((resolve, reject) => {
//     Realm.open(getSchema()).then((realm) => {
//       realm.write(async () => {
//         // const UpdateSpeciesImageUser = realm.objectForPrimaryKey('User', 'id0001');
//         // let userToken = UpdateSpeciesImageUser.accessToken;
//         await RNFS.readFile(image, 'base64').then(async (base64) => {
//           let body = {
//             imageFile: `data:image/jpeg;base64,${base64}`,
//           };
//           await putAuthenticatedRequest(`/treemapper/species/${speciesId}`, body)
//             .then((res) => {
//               const { status, data } = res;
//               //   console.log(res, data);
//               if (status === 200) {
//                 // console.log(res, 'res');
//                 // updateStatusForUserSpecies({ id: speciesId });
//                 resolve(true);
//               }
//             })
//             .catch((err) => {
//               console.log(err, 'create error');
//               reject(err);
//             });
//         });
//       });
//     });
//   });
// };
export const UpdateSpeciesDataOnServer = (speciesToSync) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema()).then(async (realm) => {
      for (const specie of speciesToSync) {
        if (!specie.isDataUpdated) {
          addAliasesAndDescriptionOnServer({
            scientificSpecieGuid: specie.guid,
            specieId: specie.specieId,
            aliases: specie.aliases,
            description: specie.description,
          });
        }
        if (!specie.isImageUpdated) {
          UpdateSpeciesImage(specie.image, specie.specieId);
        }
      }
      resolve(true);
    });
  });
};
