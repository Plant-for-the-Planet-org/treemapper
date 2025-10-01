import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const ProjectSite: ObjectSchema = {
  name: RealmSchema.ProjectSite,
  primaryKey: 'id',
  properties: {
  id: 'string',
  name: 'string',
  description: 'string?',
  status: 'string?',
  geometry: 'string',
  },
};
