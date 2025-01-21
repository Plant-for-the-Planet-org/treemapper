import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const Projects: ObjectSchema = {
  name: RealmSchema.Projects,
  primaryKey: 'id',
  properties: {
    id: 'string',
    slug: 'string',
    allowDonations: 'bool',
    countPlanted: 'int',
    countTarget: 'int',
    currency: 'string',
    image: 'string',
    country: 'string',
    name: 'string',
    treeCost: 'double?',
    sites: `${RealmSchema.ProjectSite}[]`,
    geometry: 'string',
    purpose: 'string',
    intensity: 'double',
    frequency: 'string'
  },
};
