import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'



export const ImageData: ObjectSchema = {
  name: RealmSchema.ImageData,
  primaryKey: 'image_id',
  properties: {
    image_id: 'string',
    local_uri: { type: 'string', default: '' },
    cdn_url: { type: 'string', default: '' },
    type: { type: 'string', default: '' },      // e.g. 'monitoring_plot' | 'monitoring_plant' | 'intervention'
    parent_id: { type: 'string', default: '' },  // ID of the owning entity
    date_taken: { type: 'double', default: 0 },
    lat: { type: 'double', default: 0 },
    lon: { type: 'double', default: 0 },
    status: { type: 'string', default: 'NOT_SYNCED' }, // NOT_SYNCED | SYNCED | PENDING_UPLOAD
    additional_data: { type: 'string', default: '' },
  },
}
