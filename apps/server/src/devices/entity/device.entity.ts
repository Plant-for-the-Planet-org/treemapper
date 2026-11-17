import { InferSelectModel } from 'drizzle-orm';
import {
  DeviceErrorLog,
  DeviceSyncSnapshot,
  userDevice,
} from '../../database/schema/index';

export type UserDevice = InferSelectModel<typeof userDevice>;

// Device row enriched with its owner and a computed online flag, shaped for the
// dashboard list.
//
// `deviceId` is deliberately NOT here. It is the client-supplied key that
// `UsersService.registerOrUpdateDevice` upserts on, so anyone holding one can
// claim that row; the dashboard addresses devices by `uid` and has no use for
// it. Do not add it back.
export interface ProjectDevice {
  uid: string;
  deviceName: string | null;
  deviceModel: string | null;
  deviceOs: string | null;
  osVersion: string | null;
  appVersion: string | null;
  appBuild: number | null;
  locale: string | null;
  timezone: string | null;
  notificationPermission: boolean;
  isActive: boolean;
  online: boolean;
  // True when a newer app build exists than the one this device runs. See
  // DevicesService.getLatestAppBuild for where "newer" comes from.
  needsUpdate: boolean;
  // Telemetry snapshot from the device's last app open. Null means the device
  // has not reported it yet (older app build), which is not the same as zero.
  //
  // `batteryLevel` is not exposed: the column exists but the mobile app never
  // collects it (see collectDeviceTelemetry) and no screen renders it, so every
  // value would be null. Wire the collection first if the dashboard ever wants
  // it.
  storageUsedPct: number | null;
  networkType: string | null;
  pendingInterventions: number | null;
  pendingTrees: number | null;
  // The same backlog split by status, plus the drafts and quarantined records
  // the two counters above exclude. Null on a device whose app build predates
  // the field; the dashboard shows the counters alone in that case.
  syncSnapshot: DeviceSyncSnapshot | null;
  // Newest first, capped at 20. Null means the app build does not report
  // errors; an empty array means it reported and had none, which is a real
  // answer and must not render the same way.
  recentErrors: DeviceErrorLog[] | null;
  lastSyncAt: Date | string | null;
  lastActiveAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: {
    uid: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
  };
}

export interface ProjectDeviceStats {
  total: number;
  online: number;
  notificationsEnabled: number;
  inactive: number;
  ios: number;
  android: number;
  needsUpdate: number;
  // Sum of pending interventions across the fleet. Devices that have not
  // reported telemetry contribute nothing.
  //
  // This stays strictly "uploadable work queued". The two counts below are
  // separate because a push nudge fixes neither: a draft needs the person to
  // finish it, and a quarantined record needs the person to correct it.
  pendingSync: number;
  // Interventions started in the field and never completed, fleet-wide.
  draftsPending: number;
  // Interventions the server rejected, waiting on an edit, fleet-wide.
  fixRequired: number;
}

export interface ProjectDevicesResponse {
  devices: ProjectDevice[];
  stats: ProjectDeviceStats;
  // The build the fleet is compared against, so the dashboard can label it.
  latestAppBuild: number | null;
  latestAppVersion: string | null;
}
