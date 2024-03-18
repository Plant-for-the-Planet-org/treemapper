import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const Inventory: ObjectSchema = {
  name: RealmSchema.Inventory,
  primaryKey: 'inventory_id',
  properties: {
    inventory_id: 'string',
    plantation_date: 'date?',
    treeType: 'string?',
    status: 'string?',
    projectId: 'string?',
    donationType: 'string?',
    locateTree: 'string?',
    lastScreen: 'string?',
    species: `${RealmSchema.Species}[]`,
    polygons: `${RealmSchema.Polygon}[]`,
    specieDiameter: 'double?',
    specieHeight: 'double?', // <*IMPORTANT*> ONLY FOR SINGLE TREE
    tagId: 'string?',
    registrationDate: 'date?',
    // stores the count of sample trees which are to be recorded
    sampleTreesCount: 'int?',
    // stores the sample trees having length equal to tree count
    sampleTrees: `${RealmSchema.SampleTree}[]`,
    // stores the number of sample trees which are already recorded
    completedSampleTreesCount: {
      type: 'int',
      default: 0,
      optional: true
    },
    // stores the number of sample trees which are uploaded to server
    uploadedSampleTreesCount: {
      type: 'int',
      default: 0,
      optional: true
    },
    // stores the location id of the plant location which is available
    // when the inventory data is uploaded
    locationId: 'string?',
    // stores the additional details for the registration
    additionalDetails: `${RealmSchema.AdditionalDetail}[]`,
    // stores the app metadata. Needs to be stringified as it might contain nested array/objects
    appMetadata: 'string?',
    // stores the hid when registration is uploaded successfully
    hid: 'string?',
    // stores the original geoJSON of coordinates in string which was uploaded
    // for the first time for a registration
    originalGeometry: 'string?',
  },
};
