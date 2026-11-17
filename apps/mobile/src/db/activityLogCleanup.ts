import Bugsnag from '@bugsnag/expo'
import { appRealm } from './RealmProvider'
import { RealmSchema } from 'src/types/enum/db.enum'

// How long an activity log stays on the device.
//
// Nothing used to delete these at all: `deleteAllLogs` in
// hooks/realm/useLogManagement.ts has never had a caller, so the log table
// grew for the entire life of an install. A phone two years into field work
// carries every line it ever wrote.
//
// Fifteen days is chosen to match how the logs are actually used. They are a
// support tool: someone reports a problem, and the question is what the app
// did this week. Anything older has never once been the answer, and the
// dashboard only ever shows the 20 newest errors anyway.
export const ACTIVITY_LOG_RETENTION_DAYS = 15

const RETENTION_MS = ACTIVITY_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000

// Deletes activity logs older than the retention window.
//
// Cheap when there is nothing to do: the filter runs against an indexed-enough
// collection and returns early, so no write transaction is opened on the
// common path. That is what makes it safe to call on every foreground and not
// only on a cold start.
//
// Best-effort, like every other housekeeping task here. A Realm that is closed
// or mid-migration must never stop the app from opening, so a failure is
// reported and swallowed.
export const pruneActivityLogs = (): number => {
  try {
    const cutoff = new Date(Date.now() - RETENTION_MS)
    // `timestamp` is a Realm date column, so it compares against a Date.
    const stale = appRealm
      .objects(RealmSchema.ActivityLogs)
      .filtered('timestamp < $0', cutoff)

    const count = stale.length
    if (count === 0) {
      return 0
    }

    appRealm.write(() => {
      appRealm.delete(stale)
    })

    return count
  } catch (error) {
    Bugsnag.notify(error as Error)
    return 0
  }
}
