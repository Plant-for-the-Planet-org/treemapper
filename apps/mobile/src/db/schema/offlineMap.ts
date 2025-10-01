import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const OfflineMap: ObjectSchema = {
  name: RealmSchema.OfflineMap,
  properties: {
    areaName: 'string',
    size: 'int',
    name: 'string',
  },
  primaryKey: 'name',
};
