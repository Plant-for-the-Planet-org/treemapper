import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'



export const PlantLocationHistory: ObjectSchema = {
  name: RealmSchema.PlantLocationHistory,
  primaryKey: 'history_id',
  properties: {
    history_id: 'string',
    eventName: { type: 'string', default: '' },
    eventDate: 'double',
    imageUrl: { type: 'string', default: '' },
    cdnImageUrl: { type: 'string', default: '' },
    diameter: { type: 'double', default: 0 },
    height: { type: 'double', default: 0 },
    additionalDetails: `${RealmSchema.AdditionalDetail}[]`,
    appMetadata: { type: 'string', default: '' },
    status: { type: 'string', default: '' },
    statusReason: { type: 'string', default: '' },
    dataStatus: { type: 'string', default: '' },
    parentId: { type: 'string', default: '' },
    samplePlantLocationIndex: { type: 'int', default: 0 },
    lastScreen: { type: 'string', default: '' },
  },
}
