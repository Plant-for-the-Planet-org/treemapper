import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const SampleTree: ObjectSchema = {
  name: RealmSchema.SampleTree,
  properties: {
    // stores the latitude of the tree
    latitude: 'double',
    // stores the longitude of the tree
    longitude: 'double',
    // stores the latitude of the device when location was marked
    deviceLatitude: 'double',
    // stores the longitude of the device when location was marked
    deviceLongitude: 'double',
    // stores accuracy of location when the location was marked
    locationAccuracy: 'double?',
    // URL of the image if picture was clicked
    imageUrl: 'string?',
    // CDN URL of the image if picture was clicked
    cdnImageUrl: 'string?',
    // specie id for this sample tree
    specieId: 'string?',
    // specie name of specie id for this sample tree
    specieName: 'string?',
    // diameter of selected specie
    specieDiameter: 'double?',
    // height of selected specie
    specieHeight: 'double?',
    // tag id of the tree if the tree has one
    tagId: 'string?',
    // current status of the tree. Refer to inventoryConstants for different status
    status: { type: 'string', default: 'INCOMPLETE' },
    // stores the date when the tree was planted
    plantationDate: 'date?',
    // stores the location id when the data upload is successful
    locationId: 'string?',
    // stores the tree type which is always sample tree
    treeType: { type: 'string', default: 'sample' },
    // stores the additional details for the registration
    additionalDetails: `${RealmSchema.AdditionalDetail}[]`,
    // stores the app metadata. Needs to be stringified as it might contain nested array/objects
    appMetadata: 'string?',
    // stores the hid when registration is uploaded successfully
    hid: 'string?',
  },
};
