import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const Metadata: ObjectSchema = {
  name: RealmSchema.Metadata,
  primaryKey: 'id',
  properties: {
    id: 'string',
    key: 'string',
    value: 'string',  
    order: 'int',
    accessType: { type: 'string', default: 'private' },
  },
};
