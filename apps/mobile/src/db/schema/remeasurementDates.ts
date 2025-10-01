import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'



export const RemeasurementDate: ObjectSchema = {
  name: RealmSchema.RemeasurementDate,
  properties: {
        sampleTreeId: 'string',
        created: 'double',
        lastMeasurement: 'double',
        remeasureBy: 'double',
        nextMeasurement: 'double',
  },
}
