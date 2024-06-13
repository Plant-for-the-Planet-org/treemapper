import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'

export const PlantTimeline: ObjectSchema = {
  name: RealmSchema.PlantTimeline,
  properties: {
    status: { type: 'string'},
    length:  { type: 'double'},
    width:  { type: 'double'},
    date: { type: 'double'},
    length_unit: { type: 'string', default: 'm'},
    width_unit:  { type: 'string', default: 'cm'},
    image:  { type: 'string'},
  },
}
