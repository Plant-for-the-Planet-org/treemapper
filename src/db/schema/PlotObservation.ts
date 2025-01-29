import {ObjectSchema} from 'realm'
import {RealmSchema} from 'src/types/enum/db.enum'

export const PlotObservation: ObjectSchema = {
  name: RealmSchema.PlotObservation,
  primaryKey: 'obs_id',
  properties: {
    obs_id: 'string',
    server_id: {type: 'string', default: ''},
    type: {type: 'string'},
    obs_date: {type: 'double'},
    unit: {type: 'string'},
    value: 'double',
    is_complete: {type: 'bool', default: false},
    status: {type: 'string', default: 'INIT'},
  },
}
