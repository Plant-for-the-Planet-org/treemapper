import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const YesNo: ObjectSchema = {
  name: RealmSchema.YesNo,
  primaryKey: 'id',
  properties: {
    id: 'string',
    parentId: {
      type: 'string',
      indexed: true,
    },
    defaultValue: {
      type: 'bool',
      default: false,
    },
    isRequired: {
      type: 'bool',
      default: false,
    },
  },
};
