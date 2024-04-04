import {ObjectSchema} from 'realm'
import {RealmSchema} from 'src/types/enum/db.enum'

export const ScientificSpecies: Realm.ObjectSchema = {
  name: RealmSchema.ScientificSpecies,
  primaryKey: 'guid',
  properties: {
    guid: 'string',
    scientific_name: {type: 'string', indexed: true},
    is_user_species: {type: 'bool', default: false},
    is_uploaded: {type: 'bool', default: false},
    aliases: {type: 'string', default: ''},
    image: {type: 'string', default: ''},
    description: {type: 'string', default: ''},
    is_updated: {type: 'bool', default: true},
  },
}

export const Intervention: ObjectSchema = {
  name: RealmSchema.Intervention,
  primaryKey: 'intervention_id',
  properties: {
    intervention_id: 'string',
    plantation_date: {type: 'date'},
    intervention_type: {type: 'string'},
    status: {type: 'string'},
    project_id: {type: 'string', optional: true},
    locate_tree: {type: 'string', optional: true},
    last_screen: {type: 'string', optional: true},
    species: `${RealmSchema.Species}[]`,
    polygons: `${RealmSchema.Polygon}[]`,
    specie_diameter: {type: 'double', optional: true},
    specie_height: 'double?', // <*IMPORTANT*> ONLY FOR SINGLE TREE
    tag_id: {type: 'string', optional: true},
    registeration_date: {type: 'date', optional: true},
    // stores the count of sample trees which are to be recorded
    sampe_tree_count: {type: 'int', optional: true},
    // stores the sample trees having length equal to tree count
    sample_trees: `${RealmSchema.SampleTree}[]`,
    // stores the number of sample trees which are already recorded
    completed_sample_trees_count: {
      type: 'int',
      default: 0,
    },
    // stores the number of sample trees which are uploaded to server
    uploaded_sample_trees_count: {
      type: 'int',
      default: 0,
    },
    // stores the location id of the plant location which is available
    // when the inventory data is uploaded
    location_id: {type: 'string', optional: true},
    // stores the additional details for the registration
    additional_details: `${RealmSchema.AdditionalDetail}[]`,
    // stores the app metadata. Needs to be stringified as it might contain nested array/objects
    app_metadata:{type: 'string', optional: true},
    // stores the hid when registration is uploaded successfully
    hid: {type: 'string', optional: true},
    // stores the original geoJSON of coordinates in string which was uploaded
    // for the first time for a registration
    original_geometry: {type: 'string', optional: true},
  },
}
