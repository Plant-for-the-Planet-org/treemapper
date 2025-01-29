import {ObjectSchema} from 'realm'
import {RealmSchema} from 'src/types/enum/db.enum'

export const PlotPlantedSpecies: ObjectSchema = {
  name: RealmSchema.PlotPlantedSpecies,
  primaryKey: 'plot_plant_id',
  properties: {
    plot_plant_id: {type: 'string', default: ''},
    server_id: {type: 'string', default: ''},
    tag: {type: 'string', default: ''},
    guid: {type: 'string', default: ''},
    scientificName: {type: 'string', default: ''},
    aliases: {type: 'string', default: ''},
    count: {type: 'int', default: 1},
    image: {type: 'string', default: ''},
    timeline: `${RealmSchema.PlantTimeline}[]`,
    planting_date: {type: 'double'},
    is_alive: {type: 'bool', default: true},
    type: {type: 'string', default: 'planted'},
    details_updated_at: {type: 'double'},
    latitude: 'double',
    longitude: 'double',
    is_complete: {type: 'bool', default: false},
    status: {type: 'string', default: 'INIT'},
    plot_id:{type: 'string', default: ''},
  },
}
