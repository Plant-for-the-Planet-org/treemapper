import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const InterventionSpecies: ObjectSchema = {
  name: RealmSchema.InterventionSpecies,
  properties: {
    species: `${RealmSchema.ScientificSpecies}[]`,
  },
};

