import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const DropDownOption: ObjectSchema = {
  name: RealmSchema.DropdownOption,
  embedded: true,
  properties: {
    key: 'string',
    value: 'string',
  },
};
