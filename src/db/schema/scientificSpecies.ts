import Realm from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum';

export const ScientificSpecies: Realm.ObjectSchema = {
  name: RealmSchema.ScientificSpecies,
  primaryKey: 'guid',
  properties: {
    // stores the guid of scientific specie
    guid: 'string',
    // stores the name of scientific specie and indexed for better search
    scientificName: { type: 'string', indexed: true },
    // used to check if this specie is preferred by user or not. Default to [false]
    isUserSpecies: { type: 'bool', default: false },
    // used to check whether this specie is synced to server or not. Defaults to [false]
    // This property is used with [isUserSpecies]
    isUploaded: { type: 'bool', default: false },
    // stores the specieId which is uploaded on server
    specieId: 'string?',
    aliases: { type: 'string', default: '' },
    image: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    isUpdated: { type: 'bool', default: true },
  },
};
