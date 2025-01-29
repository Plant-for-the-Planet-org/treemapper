import {ObjectSchema} from 'realm'
import {RealmSchema} from 'src/types/enum/db.enum'

export const PlotGroups: ObjectSchema = {
  name: RealmSchema.PlotGroups,
  primaryKey: 'group_id',
  properties: {
    name: {type: 'string'},
    server_id: 'string',
    group_id: 'string',
    date_created: 'double',
    plots: `${RealmSchema.MonitoringPlot}[]`,
    details_updated_at: 'double',
    status:{type: 'string', default: 'INIT'},
  },
}
