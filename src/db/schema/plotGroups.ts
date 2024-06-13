import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'

export const PlotGroups: ObjectSchema = {
  name: RealmSchema.PlotGroups,
  properties: {
    name: { type: 'string'},
    group_id:  'string',
    date_created: 'double',
  },
}
