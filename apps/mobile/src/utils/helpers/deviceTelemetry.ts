import { Paths } from 'expo-file-system';
import { NetInfoState } from '@react-native-community/netinfo';
import { appRealm } from 'src/db/RealmProvider';
import { RealmSchema } from 'src/types/enum/db.enum';
import {
  InterventionData,
  LogDetails,
} from 'src/types/interface/slice.interface';
import {
  DeviceTelemetry,
  DeviceNetworkType,
  DeviceSyncSnapshot,
  DeviceErrorLog,
} from 'src/types/type/device.type';

// Everything on this device that has not reached the server, in one query.
// The three buckets below are then split out of it in a single pass, so the
// counters and the snapshot can never disagree with each other.
const UNSYNCED_FILTER = 'status != "SYNCED"';

// Maps the NetInfo connection type onto the three values the server stores.
// Types we cannot place (vpn, bluetooth, other) return undefined so the field
// is omitted rather than guessed.
export const mapNetworkType = (
  state: NetInfoState,
): DeviceNetworkType | undefined => {
  if (!state.isConnected) return 'offline';
  switch (state.type) {
    case 'wifi':
    case 'ethernet':
      return 'wifi';
    case 'cellular':
    case 'wimax':
      return 'cellular';
    case 'none':
      return 'offline';
    default:
      return undefined;
  }
};

// Percentage of the device's disk in use, rounded. Undefined when the platform
// does not report it.
const getStorageUsedPct = (): number | undefined => {
  try {
    const total = Paths.totalDiskSpace;
    const available = Paths.availableDiskSpace;
    if (!total || total <= 0 || typeof available !== 'number') {
      return undefined;
    }
    const used = Math.round(((total - available) / total) * 100);
    // Clamped because the server rejects anything outside 0-100.
    return Math.min(100, Math.max(0, used));
  } catch {
    return undefined;
  }
};

// Maps an intervention sync status onto a `queued` bucket. The status machine
// is PENDING_DATA_UPLOAD -> PENDING_SAMPLE_TREE -> PENDING_TREE_IMAGE ->
// SYNCED, with the remeasurement states running beside it.
//
// Anything unrecognised lands in `other` rather than being dropped, so the
// buckets always add up to the pendingInterventions counter even if a new
// status is added and this map is not updated.
const queuedBucket = (status: string): keyof DeviceSyncSnapshot['queued'] => {
  switch (status) {
    case 'PENDING_DATA_UPLOAD':
      return 'dataUpload';
    case 'PENDING_SAMPLE_TREE':
      return 'sampleTree';
    case 'PENDING_TREE_IMAGE':
      return 'treeImage';
    case 'PENDING_REMEASUREMENT_SYNC':
    case 'REMEASUREMENT_DATA_UPLOAD':
    case 'REMEASUREMENT_EVENT_UPDATE':
    case 'SKIP_REMEASUREMENT':
      return 'remeasurement';
    default:
      return 'other';
  }
};

// Field data recorded on this device but not yet uploaded, counted in one walk
// over the unsynced interventions.
//
// Three groups, and the difference between them is what a project owner needs:
//
// - **queued** can upload on its own as soon as there is a connection. This is
//   the only group `pendingInterventions` counts, and the only one a push
//   nudge helps with, which is why the dashboard's "Pending sync" stat and the
//   sync tile in the app have always meant exactly this.
// - **drafts** were started in the field and never finished (`is_complete ==
//   false`). The app will not try to upload them, so without this they are
//   invisible to everyone but the person holding the phone.
// - **fixRequired** were rejected by the server and quarantined. They retry
//   only after someone edits them on the device.
//
// Trees are counted per intervention rather than by querying TreeDetail
// directly, because a tree row belongs to its intervention and only the
// intervention carries the is_complete / fix_required state that decides
// whether it can upload.
//
// Monitoring plots are not included: they are a separate Realm schema with
// their own sync pair, and `pendingInterventions` has never counted them.
const getPendingCounts = (): {
  pendingInterventions?: number;
  pendingTrees?: number;
  syncSnapshot?: DeviceSyncSnapshot;
} => {
  try {
    const unsynced = appRealm
      .objects<InterventionData>(RealmSchema.Intervention)
      .filtered(UNSYNCED_FILTER);

    const snapshot: DeviceSyncSnapshot = {
      drafts: 0,
      fixRequired: 0,
      queued: {
        dataUpload: 0,
        sampleTree: 0,
        treeImage: 0,
        remeasurement: 0,
        other: 0,
      },
      oldestPendingAt: null,
    };

    let pendingInterventions = 0;
    let pendingTrees = 0;
    // Epoch ms, like intervention_date itself. 0 means nothing seen yet.
    let oldest = 0;

    unsynced.forEach((intervention) => {
      if (!intervention.is_complete) {
        snapshot.drafts += 1;
      } else if (intervention.fix_required !== 'NO') {
        snapshot.fixRequired += 1;
      } else {
        snapshot.queued[queuedBucket(intervention.status)] += 1;
        pendingInterventions += 1;
        const trees = intervention.sample_trees || [];
        pendingTrees += trees.filter((t) => t.status !== 'SYNCED').length;
      }

      // Across all three groups: the question is how long any field work has
      // been sitting here, not how long the uploadable part has.
      const date = intervention.intervention_date;
      if (date > 0 && (oldest === 0 || date < oldest)) {
        oldest = date;
      }
    });

    snapshot.oldestPendingAt =
      oldest > 0 ? new Date(oldest).toISOString() : null;

    return { pendingInterventions, pendingTrees, syncSnapshot: snapshot };
  } catch {
    // A Realm that is closed or mid-migration must not break registration.
    return {};
  }
};

// How many of the device's most recent errors travel with the registration,
// and how much of each message. Both caps are about the payload: this rides on
// a call that runs on every app open, and a device that has been failing for
// months holds thousands of log rows.
const MAX_ERROR_LOGS = 20;
const MAX_LOG_MESSAGE_LENGTH = 300;

// The newest errors from the activity log, so a project owner can see why a
// phone is failing without asking its holder to export the log by hand.
//
// Errors only. Info and warn stay on the device, where the share button in
// ActivityLogsView already reaches them, and they are the bulk of the rows.
//
// The whole list is sent every time and replaces what the server holds, rather
// than being appended to. That makes this a picture of the device now, needs no
// watermark or de-duplication on either side, and means an error ages out by
// itself once twenty newer ones exist.
const getRecentErrors = (): DeviceErrorLog[] | undefined => {
  try {
    const errors = appRealm
      .objects<LogDetails>(RealmSchema.ActivityLogs)
      .filtered("logLevel == 'error'")
      .sorted('timestamp', true)
      .slice(0, MAX_ERROR_LOGS);

    return errors.map((log) => ({
      // `timestamp` is a Realm date column, though LogDetails types it as a
      // number. Going through Date covers both.
      at: new Date(log.timestamp as unknown as Date).toISOString(),
      type: log.logType || 'OTHER',
      // Empty string is what the call sites pass when there was no request, so
      // it becomes null rather than an empty badge in the dashboard.
      status: log.statusCode ? log.statusCode : null,
      message: (log.message || '').slice(0, MAX_LOG_MESSAGE_LENGTH),
    }));
  } catch {
    // Same rule as the counts above: never break registration over telemetry.
    return undefined;
  }
};

// Snapshot of how this device is doing, sent with the device registration on
// every app open. Every field is optional: anything we cannot read is omitted
// and the server leaves the previous value alone.
export const collectDeviceTelemetry = (
  net: NetInfoState,
  lastSyncDate: number,
): DeviceTelemetry => {
  const { pendingInterventions, pendingTrees, syncSnapshot } =
    getPendingCounts();

  return {
    storageUsedPct: getStorageUsedPct(),
    networkType: mapNetworkType(net),
    pendingInterventions,
    pendingTrees,
    syncSnapshot,
    recentErrors: getRecentErrors(),
    // 0 is the initial Redux value, meaning "never synced".
    lastSyncAt: lastSyncDate > 0 ? new Date(lastSyncDate).toISOString() : undefined,
  };
};
