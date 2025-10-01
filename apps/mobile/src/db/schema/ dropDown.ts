import {ObjectSchema} from 'realm'
import {RealmSchema} from 'src/types/enum/db.enum'

export const Dropdown: ObjectSchema = {
  name: RealmSchema.Dropdown,
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
    dropdownOptions: `${RealmSchema.DropdownOption}[]`,
  },
}
