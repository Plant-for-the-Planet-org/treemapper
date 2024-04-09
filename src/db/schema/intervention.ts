import {ObjectSchema} from 'realm'
import {RealmSchema} from 'src/types/enum/db.enum'




export const Intervention: ObjectSchema = {
  name: RealmSchema.Intervention,
  primaryKey: 'intervention_id',
  properties: {
    intervention_id: 'string',
    intervention_key:'string',
    intervention_title: 'string',
    intervention_date: 'double',
    project_id: {type:'string', optional:true, default:''},
    project_name:{type:'string', optional:true, default:''},
    site_id: {type:'string', optional:true, default:''},
    site_name:{type:'string', optional:true, default:''},
    location_type: 'string',
    location: `${RealmSchema.Polygon}`,
    cover_image_url:{type:'string', optional:true, default:''},
    has_species:{type:'bool', default:false},
    species:{ type: 'list', objectType: 'string' },
    has_sample_trees: {type:'bool', default:false},
    sample_trees: `${RealmSchema.SampleTree}[]` ,
    is_complete:{type:'bool', default:false},
  },
}