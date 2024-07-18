import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'

export const Intervention: ObjectSchema = {
  name: RealmSchema.Intervention,
  primaryKey: 'intervention_id',
  properties: {
    form_id: 'string',
    intervention_id: 'string',
    intervention_key: { type: 'string', default: '', indexed: true },
    intervention_title: 'string',
    intervention_date: 'double',
    project_id: { type: 'string', optional: true, default: '' },
    project_name: { type: 'string', optional: true, default: '' },
    site_id: { type: 'string', optional: true, default: '' },
    site_name: { type: 'string', optional: true, default: '' },
    location_type: 'string',
    location: `${RealmSchema.Polygon}`,
    image_data: `${RealmSchema.Coordinates}[]`,
    has_species: { type: 'bool', default: false },
    has_sample_trees: { type: 'bool', default: false },
    sample_trees: `${RealmSchema.TreeDetail}[]`,
    is_complete: { type: 'bool', default: false },
    planted_species: `${RealmSchema.InterventionPlantedSpecies}[]`,
    intervention_type: { type: 'string', default: 'UNKNOWN' },
    form_data: `${RealmSchema.FormElement}[]`,
    additional_data: `${RealmSchema.FormElement}[]`,
    meta_data: { type: 'string', default: '{}' },
    status: { type: 'string', default: 'INIIALIZED' },
    hid: { type: 'string', default: '' },
    coords: `${RealmSchema.GeoSpatial}`,
    entire_site: { type: 'bool', default: false },
    last_screen: { type: 'string', default: 'FORM' },
    location_id: { type: 'string', default: '' },
    locate_tree: { type: 'string', default: 'ONSITE' },
    remeasuremnt_required: { type: 'bool', default: false },
    next_measurement_date: { type: 'double', default: 0 },
    is_legacy: { type: 'bool', default: false },
  },
}
