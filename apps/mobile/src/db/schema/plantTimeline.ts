import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'

export const PlantTimeline: ObjectSchema = {
  name: RealmSchema.PlantTimeline,
  properties: {
    timeline_id: { type: 'string' },
    status: { type: 'string' },
    length: { type: 'double' },
    width: { type: 'double' },
    date: { type: 'double' },
    length_unit: { type: 'string', default: 'm' },
    width_unit: { type: 'string', default: 'cm' },
    image: { type: 'string' },
    // Per-measurement sync flag. Entries created with the plot upload as part of
    // the initial sync, and remeasurements added afterwards, are pushed to the
    // server independently. SYNCED entries are read-only on device.
    sync_status: { type: 'string', default: 'NOT_SYNCED' },
  },
}
