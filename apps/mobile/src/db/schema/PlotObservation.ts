import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'



export const PlotObservation: ObjectSchema = {
  name: RealmSchema.PlotObservation,
  primaryKey: 'obs_id',
  properties: {
    obs_id: 'string',
    type: { type: 'string' },
    obs_date: { type: 'double' },
    unit: { type: 'string' },
    value: 'double',
    // Observations upload either with the initial plot sync or, when added to an
    // already-synced plot, through the add-observations endpoint. This tracks
    // which state an observation is in so only pending ones are uploaded.
    sync_status: { type: 'string', default: 'NOT_SYNCED' },
  },
}
