import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const Polygons: ObjectSchema = {
  name: RealmSchema.Polygons,
  properties: {
    isPolygonComplete: 'bool?',
    coordinates: `${RealmSchema.Coordinates}[]`,
  },
};
