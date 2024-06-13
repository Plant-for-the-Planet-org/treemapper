import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'

export const MonitoringPlot: ObjectSchema = {
  name: RealmSchema.MonitoringPlot,
  primaryKey: 'plot_id',
  properties: {
    plot_id: 'string',
    complexity: { type: 'string' },
    shape: { type: 'string' },
    type: { type: 'string' },
    radius: { type: 'double' },
    length: { type: 'double' },
    width: { type: 'double' },
    name: { type: 'string', default: '' },
    plot_groups: `${RealmSchema.PlotGroups}[]`,
    location: `${RealmSchema.Polygon}`,
    coords: `${RealmSchema.GeoSpatial}`,
    is_complete: { type: 'bool', default: false },
    additional_data: { type: 'string', default: '' },
    meta_data: { type: 'string', default: '{}' },
    status: { type: 'string', default: 'NOT_SYNCED' },
    hid: { type: 'string', default: '' },
    lastScreen: { type: 'string', default: 'form' },
    plot_created_at: "double",
    plot_updated_at: "double"
  },
}
