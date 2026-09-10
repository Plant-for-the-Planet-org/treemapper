import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'


export const PlotGroups: ObjectSchema = {
  name: RealmSchema.PlotGroups,
  primaryKey: 'group_id',
  properties: {
    name: { type: 'string' },
    group_id: 'string',
    date_created: 'double',
    plots: `${RealmSchema.MonitoringPlot}[]`,
    details_updated_at: 'double',
    // The project the group belongs to. The server's group routes are
    // project-scoped, so a group with no project cannot be created or deleted
    // there. Groups made before v29 have none and are local-only (see `synced`).
    project_id: { type: 'string', default: '' },
    project_name: { type: 'string', default: '' },
    // Where this group stands against the server:
    //   SYNCED      server matches the device
    //   NOT_SYNCED  the group exists on the server but its member list drifted
    //               (a plot was added or removed offline); reconciled on the
    //               next online visit to the groups screen
    //   LOCAL_ONLY  made before v29, never uploaded, no project to address the
    //               server routes with
    sync_status: { type: 'string', default: 'LOCAL_ONLY' },
  },
}
