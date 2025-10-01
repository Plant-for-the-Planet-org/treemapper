import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const Species: ObjectSchema = {
  name: RealmSchema.Species,
  properties: {
    aliases: 'string',
    treeCount: 'int',
    id: 'string?',
  },
};

