import { getSchema } from './../repositories/default';
import Realm from 'realm';
import { updateUserSpecie } from '../actions/species';

export const UpdateSpeciesDataOnServer = (specie) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema()).then(async (realm) => {
      // for (const specie of speciesToSync) {
      if (!specie.isUpdated) {
        updateUserSpecie({
          scientificSpecieGuid: specie.guid,
          specieId: specie.specieId,
          aliases: specie.aliases,
          description: specie.description,
          image: specie.image,
        });
      }
      // }
      resolve(true);
    });
  });
};
