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
    frequency: 'string',
    // The signed-in user's own membership on this project, as the server
    // reports it. Used to hide writes the server would refuse; it is a UX gate
    // only, the guard on the server is the real one. Empty means unknown: the
    // row predates this field and no projects fetch has run since, so a write
    // is offered and the server answers for it.
    role: { type: 'string', default: '' },
    extra_permissions: { type: 'list', objectType: 'string', default: [] }
  },
};
