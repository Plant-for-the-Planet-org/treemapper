import Realm from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum';

export const ScientificSpecies: Realm.ObjectSchema = {
  name: RealmSchema.ScientificSpecies,
  primaryKey: 'guid',
  properties: {
    guid: 'string',
    scientificName: { type: 'string', indexed: true },
    isUserSpecies: { type: 'bool', default: false },
    isUploaded: { type: 'bool', default: false },
    aliases: { type: 'string', default: '' },
    image: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    isUpdated: { type: 'bool', default: true },
  },
};
