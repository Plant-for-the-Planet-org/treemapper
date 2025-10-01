import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const Element: ObjectSchema = {
  name: RealmSchema.Element,
  primaryKey: 'id',
  properties: {
    id: 'string',
    key: 'string',
    name: 'string',
    type: 'string',
    treeType: 'string[]',
    registrationType: 'string[]',
    // refer [dataTypes] from [additionalDataConstants]
    accessType: { type: 'string', default: 'private' },
  },
};
