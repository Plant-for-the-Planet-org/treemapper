import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const AdditionalDetail: ObjectSchema = {
  name: RealmSchema.AdditionalDetail,
  properties: {
    key: 'string',
    value: 'string',
    accessType: 'string',
  },
};
