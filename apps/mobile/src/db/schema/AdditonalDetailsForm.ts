import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'

// A form built on the device with the retired Additional Data builder. The
// builder is gone, but the definitions people made offline are kept so they can
// be pushed up to the project Forms on the dashboard and carry on being used
// there. The `migrated_*` fields record that push: a row that has them is done
// and is only shown as history.
export const AdditonalDetailsForm: ObjectSchema = {
  name: RealmSchema.AdditionalDetailsForm,
  primaryKey: 'form_id',
  properties: {
    form_id: 'string',
    order: 'int',
    elements: `${RealmSchema.FormElement}[]`,
    title: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    // Uid of the project form this one became, empty until it is synced.
    migrated_form_id: { type: 'string', default: '' },
    // Project it was synced into, kept with its name so the row can say where
    // the form went without a lookup that may no longer resolve.
    migrated_project_id: { type: 'string', default: '' },
    migrated_project_name: { type: 'string', default: '' },
    // ISO timestamp of the successful sync.
    migrated_at: { type: 'string', default: '' },
  },
}
