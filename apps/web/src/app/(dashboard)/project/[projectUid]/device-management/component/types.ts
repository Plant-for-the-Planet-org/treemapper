/**
 * Mirrors the server's ProjectDevice contract
 * (apps/server/src/devices/entity/device.entity.ts).
 *
 * Telemetry fields are nullable on purpose: an older app build reports none of
 * them, and null must render as "-" rather than as zero. A device with null
 * pendingInterventions has not told us anything, which is not the same as a
 * device that has told us it is fully synced.
 */

export type Platform = 'ios' | 'android'
export type NetworkType = 'wifi' | 'cellular' | 'offline'
export type Priority = 'normal' | 'high'

export interface DeviceUser {
  uid: string
  name: string
  email: string
  image: string | null
  role: string
}

export interface Device {
  uid: string
  deviceId: string
  deviceName: string | null
  deviceModel: string | null
  deviceOs: Platform | string | null
  osVersion: string | null
  appVersion: string | null
  appBuild: number | null
  locale: string | null
  timezone: string | null
  notificationPermission: boolean
  isActive: boolean
  online: boolean
  needsUpdate: boolean
  storageUsedPct: number | null
  networkType: NetworkType | string | null
  pendingInterventions: number | null
  pendingTrees: number | null
  lastSyncAt: string | null
  lastActiveAt: string | null
  createdAt: string
  updatedAt: string
  user: DeviceUser
}

export interface FleetStats {
  total: number
  online: number
  notificationsEnabled: number
  inactive: number
  ios: number
  android: number
  needsUpdate: number
  pendingSync: number
}

export interface ProjectDevicesResponse {
  devices: Device[]
  stats: FleetStats
  latestAppBuild: number | null
  latestAppVersion: string | null
}

// What the server reports back after a send.
export interface NotifyResult {
  batchId: string
  devicesTargeted: number
  usersNotified: number
  devicesWithoutPushId: number
  pushAccepted: number
  pushConfigured: boolean
  pushError: string | null
}

export interface VersionBucket {
  version: string
  count: number
  outdated: boolean
}

// Groups the fleet by app version for the adoption chart. Buckets are keyed by
// version string but ordered by build number, since version strings do not sort
// correctly ("4.10.0" vs "4.9.0").
export function appVersionDistribution(
  devices: Device[],
  latestBuild: number | null,
): VersionBucket[] {
  const map = new Map<string, { count: number; build: number | null }>()

  for (const d of devices) {
    const version = d.appVersion || 'Unknown'
    const existing = map.get(version)
    if (existing) {
      existing.count += 1
      // Keep the highest build seen for this version string.
      if (d.appBuild !== null && (existing.build === null || d.appBuild > existing.build)) {
        existing.build = d.appBuild
      }
    } else {
      map.set(version, { count: 1, build: d.appBuild })
    }
  }

  return Array.from(map.entries())
    .map(([version, { count, build }]) => ({
      version,
      count,
      outdated: latestBuild !== null && build !== null && build < latestBuild,
      build,
    }))
    .sort((a, b) => (b.build ?? -1) - (a.build ?? -1))
    .map(({ version, count, outdated }) => ({ version, count, outdated }))
}
