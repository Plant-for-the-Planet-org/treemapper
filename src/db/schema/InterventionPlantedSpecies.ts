import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const InterventionPlantedSpecies: ObjectSchema = {
  name: RealmSchema.InterventionPlantedSpecies,
  properties: {
    id: { type: 'string', default: '' },
    guid: { type: 'string', default: '' },
    scientific_name: { type: 'string', default: '' },
    aliases: { type: 'string', default: '' },
    count: { type: 'int', default: 1 },
    image: { type: 'string', default: '' },
  }
};

