export type DeviceNetworkType = 'wifi' | 'cellular' | 'offline';

// Snapshot of the device's condition, refreshed on every app open. All fields
// are optional: whatever the platform will not tell us is left out, and the
// server keeps the value it already had.
export interface DeviceTelemetry {
  storageUsedPct?: number;
  networkType?: DeviceNetworkType;
  pendingInterventions?: number;
  pendingTrees?: number;
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
