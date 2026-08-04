import { InferSelectModel } from 'drizzle-orm';
import { userDevice } from '../../database/schema/index';

export type UserDevice = InferSelectModel<typeof userDevice>;

// Device row enriched with its owner and a computed online flag, shaped for the
// dashboard list.
export interface ProjectDevice {
  uid: string;
  deviceId: string;
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
  batteryLevel: number | null;
  storageUsedPct: number | null;
  networkType: string | null;
  pendingInterventions: number | null;
  pendingTrees: number | null;
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
  pendingSync: number;
}

export interface ProjectDevicesResponse {
  devices: ProjectDevice[];
  stats: ProjectDeviceStats;
  // The build the fleet is compared against, so the dashboard can label it.
  latestAppBuild: number | null;
  latestAppVersion: string | null;
}
