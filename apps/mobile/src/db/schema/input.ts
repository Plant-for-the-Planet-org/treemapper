import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const Input: ObjectSchema = {
  name: RealmSchema.Input,
  primaryKey: 'id',
  properties: {
    id: 'string',
    parentId: {
      type: 'string',
      indexed: true,
    },
    defaultValue: 'string?',
    isRequired: {
      type: 'bool',
      default: false,
    },
    type: 'string',
    regexValidation: 'string?',
  },
};
