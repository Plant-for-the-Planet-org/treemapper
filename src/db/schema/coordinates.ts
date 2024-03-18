import {ObjectSchema} from 'realm'
import {RealmSchema} from 'src/types/enum/db.enum'

export const Coordinates: ObjectSchema = {
  name: RealmSchema.Coordinates,
  properties: {
    longitude: 'double',
    imageUrl: 'string?',
    cdnImageUrl: 'string?',
    currentloclat: 'double',
    currentloclong: 'double',
    isImageUploaded: 'bool?',
    coordinateID: 'string?',
  },
}
