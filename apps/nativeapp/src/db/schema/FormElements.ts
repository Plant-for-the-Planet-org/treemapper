import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const FormElement: ObjectSchema = {
  name: RealmSchema.FormElement,
  primaryKey: 'element_id',
  properties: {
    element_id: 'string',
    index: 'int',
    key: { type: 'string', default: '' },
    label: { type: 'string', default: '' },
    default: { type: 'string', default: '' },
    type: { type: 'string', default: '' },
    placeholder: { type: 'string', default: '' },
    unit: { type: 'string', default: '' },
    visibility: { type: 'string', default: 'private' },
    editable: { type: 'bool', default: true },
    dropDownData: { type: 'string', default: '' },
    validation: { type: 'string', default: '.+', optional: true },
    required: { type: 'bool', default: false, optional: true },
    sub_form: { type: 'string', default: '', optional: true },
    condition: { type: 'string', default: '', optional: true },
    data_type: { type: 'string', default: 'string', optional: true },
    intervention: { type: 'list', objectType: 'string', default: [], optional: true },
    value: { type: 'string', default: '' },
    keyboard_type: { type: 'string', default: 'default', optional: true },
  },
};
