import { ObjectSchema } from 'realm'
import { RealmSchema } from 'src/types/enum/db.enum'

// Crash recovery for the map screens where a user walks a boundary on foot.
// Marking a large area can take an hour, and until the boundary is handed to
// its real owner (the intervention, or the site API) it lived only in React
// state -- an app kill or crash meant walking the whole perimeter again.
//
// Every mark and undo writes here, so the work survives a restart. Rows are
// short-lived: they are deleted the moment the boundary is committed, and with
// the intervention if it is deleted first.
export const MapDraft: ObjectSchema = {
  name: RealmSchema.MapDraft,
  primaryKey: 'draft_id',
  properties: {
    // `${kind}:${owner_id}` -- one draft per kind per owner.
    draft_id: 'string',
    // POLYGON (points marked by hand) | TRACK (GPS route) | SITE (project site)
    kind: { type: 'string', default: 'POLYGON' },
    // intervention_id for POLYGON/TRACK, project id for SITE.
    owner_id: { type: 'string', default: '', indexed: true },
    // JSON stringified number[][] of [lng, lat] pairs.
    coordinates: { type: 'string', default: '[]' },
    updated_at: { type: 'double', default: 0 },
  },
}
