export type DeviceNetworkType = 'wifi' | 'cellular' | 'offline';

// Breakdown of the unsynced field work on this device, so a project owner can
// see not just how much is stuck but why.
//
// `queued` sums to the `pendingInterventions` counter in DeviceTelemetry: it is
// the same backlog split by where each record stopped. `drafts` and
// `fixRequired` sit outside that counter, because neither will ever upload on
// its own -- one needs finishing, the other needs correcting.
export interface DeviceSyncSnapshot {
  drafts: number;
  fixRequired: number;
  queued: {
    dataUpload: number;
    sampleTree: number;
    treeImage: number;
    remeasurement: number;
    // Any sync status not covered above, so the buckets always add up.
    other: number;
  };
  // Intervention date of the oldest record counted here, ISO 8601. Null when
  // nothing is unsynced.
  oldestPendingAt: string | null;
}

// One error from the device's activity log, trimmed for the dashboard.
//
// A projection, not the Realm row: `logStack` is left out because the call
// sites fill it with `JSON.stringify(error)`, which on a JS Error yields `{}`,
// and `referenceId` means nothing to anyone reading the web UI. What is left
// answers "what failed, in which part of the app, and did the server say
// why".
export interface DeviceErrorLog {
  // ISO 8601.
  at: string;
  // The activity log's logType: DATA_SYNC, MAPS, USER, PROJECTS, and so on.
  type: string;
  // HTTP status as the app recorded it, when the failure came from a request.
  status: string | null;
  message: string;
}

// Snapshot of the device's condition, refreshed on every app open. All fields
// are optional: whatever the platform will not tell us is left out, and the
// server keeps the value it already had.
export interface DeviceTelemetry {
  storageUsedPct?: number;
  networkType?: DeviceNetworkType;
  pendingInterventions?: number;
  pendingTrees?: number;
  syncSnapshot?: DeviceSyncSnapshot;
  // Newest errors first, capped. Replaces the whole stored list on the server,
  // so this is the device's current state and not an append-only history.
  recentErrors?: DeviceErrorLog[];
  // ISO 8601. Omitted when the device has never completed a sync.
  lastSyncAt?: string;
}

export interface DeviceRegistrationParams extends DeviceTelemetry {
  deviceId: string;
  oneSignalId?: string;
  deviceOs?: string;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  // Monotonic build number. The dashboard compares builds, not version
  // strings, to decide whether a device is running an outdated app.
  appBuild?: number;
  locale?: string;
  timezone?: string;
  notificationPermission?: boolean;
  isActive?: boolean;
}

export interface DeviceRegistrationResponse {
  uid: string;
  deviceId: string;
}
