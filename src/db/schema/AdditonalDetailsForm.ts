import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'

export const AdditonalDetailsForm: ObjectSchema = {
  name: RealmSchema.AdditonalDetailsForm,
  primaryKey: 'form_id',
  properties: {
    form_id: 'string',
    order: 'int',
    elements: `${RealmSchema.FormElement}[]`,
    title: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
  },
}
