import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const Form: ObjectSchema = {
  name: RealmSchema.Form,
  primaryKey: 'id',
  properties: {
    id: 'string',
    order: 'int',
    // stores list of all the elements for a form
    elements: `${RealmSchema.Element}[]`,
    title: 'string?',
    description: 'string?',
  },
};
