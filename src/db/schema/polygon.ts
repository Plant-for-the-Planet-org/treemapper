import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const Polygon: ObjectSchema = {
  name: RealmSchema.Polygon,
  properties: {
    isPolygonComplete: 'bool?',
    coordinates: `${RealmSchema.Coordinates}[]`,
  },
};
