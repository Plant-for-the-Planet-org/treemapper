import {ObjectSchema} from 'realm'
import {RealmSchema} from 'src/types/enum/db.enum'

export const GeoSpatial: ObjectSchema = {
  name: RealmSchema.GeoSpatial,
  embedded: true,
  properties: {
    type: 'string',
    coordinates: 'double[]',
  },
}
