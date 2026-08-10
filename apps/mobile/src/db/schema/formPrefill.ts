import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

// One reusable default value-set per form, so field users don't refill the
// same data every intervention. `values` is a JSON string keyed by fieldId.
export const FormPrefill: ObjectSchema = {
  name: RealmSchema.FormPrefill,
  primaryKey: 'form_id',
  properties: {
    form_id: 'string',
    values: { type: 'string', default: '{}' },
    updated_at: { type: 'double', default: 0 },
  },
};
