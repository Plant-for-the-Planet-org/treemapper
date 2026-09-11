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
    name: { type: 'string' },
    project_id: { type: 'string', default: '' },
    project_name: { type: 'string', default: '' },
    length: { type: 'double' },
    width: { type: 'double' },
    location: `${RealmSchema.Polygon}`,
    coords: `${RealmSchema.GeoSpatial}`,
    plot_plants: `${RealmSchema.PlotPlantedSpecies}[]`,
    is_complete: { type: 'bool', default: false },
    additional_data: { type: 'string', default: '' },
    meta_data: { type: 'string', default: '{}' },
    status: { type: 'string', default: 'NOT_SYNCED' },
    // Quarantine, matching the intervention flow. A plot the server refused with
    // a 4xx, or one whose payload could not be built, can never upload as-is, so
    // it leaves the sync queue and shows as "Fix required" until the user edits
    // it. Any local edit clears it back to "NO" and re-queues the plot.
    fix_required: { type: 'string', default: 'NO' },
    // What actually went wrong, in words, for the user to act on. "Fix required"
    // on its own tells someone their plot is stuck without telling them what to
    // change, which is no better than silence. Holds the server's rejection
    // message, or our own reason when the payload could not be built at all.
    fix_reason: { type: 'string', default: '' },
    hid: { type: 'string', default: '' },
    lastScreen: { type: 'string', default: 'form' },
    plot_created_at: "double",
    plot_updated_at: "double",
    local_image: 'string',
    cdn_image: 'string',
    observations: `${RealmSchema.PlotObservation}[]`,
    plot_group: {
      type: 'linkingObjects',
      objectType: `${RealmSchema.PlotGroups}`,
      property: 'plots',
    },
  },
}
