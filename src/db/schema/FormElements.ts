import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const FormElement: ObjectSchema = {
  name: RealmSchema.FormElement,
  primaryKey: 'element_id',
  properties: {
    element_id: 'string',
    index:'int',
    key: { type: 'string', default: '' },
    label:'string',
    default: { type: 'string', default: '' },
    type: 'string',
    placeholder:'string',
    unit:{ type: 'string', optional:true },
    visibility: { type: 'string', default: 'private' },
    editable:{ type: 'bool', default: true },
    dropDownData: { type: 'string', default: '' },
    validation:'string',
    required:{ type: 'bool', default: false },
    sub_form:{ type: 'string', default: '' },
    condition:{ type: 'string', default: '' },
    data_type:'string',
    intervention: 'string[]',
  },
};
