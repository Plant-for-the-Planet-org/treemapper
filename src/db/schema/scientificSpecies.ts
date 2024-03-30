import Realm from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum';

export const ScientificSpecies: Realm.ObjectSchema = {
  name: RealmSchema.ScientificSpecies,
  primaryKey: 'guid',
  properties: {
    guid: 'string',
    scientific_name: { type: 'string', indexed: true },
    is_user_species: { type: 'bool', default: false },
    is_uploaded: { type: 'bool', default: false },
    species_id: { type: 'string', optional: true },
    aliases: { type: 'string', default: '' },
    image: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    is_updated: { type: 'bool', default: true },
  },
};
