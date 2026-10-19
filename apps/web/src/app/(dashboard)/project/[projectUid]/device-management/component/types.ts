/**
 * Mirrors the server's ProjectDevice contract
 * (apps/server/src/devices/entity/device.entity.ts).
 *
 * Telemetry fields are nullable on purpose: an older app build reports none of
 * them, and null must render as "-" rather than as zero. A device with null
 * pendingInterventions has not told us anything, which is not the same as a
 * device that has told us it is fully synced.
 */

/**
 * Mirrors DeviceSyncSnapshot on the server. The device reports it with every
 * app open, so it is a snapshot of that moment, not a live figure.
 *
 * `queued` sums to `pendingInterventions`: the same uploadable backlog split by
 * where each record stopped. `drafts` and `fixRequired` sit outside it, and the
 * difference matters to whoever reads this screen. Queued work clears itself
 * once the phone has a connection, so a push nudge is worth sending. A draft
 * needs the person to finish it, and a fix-required record needs the person to
 * correct it. Neither moves because an admin pressed a button.
 */
export interface SyncSnapshot {
  drafts: number
  fixRequired: number
  queued: {
    dataUpload: number
    sampleTree: number
    treeImage: number
    remeasurement: number
    other: number
  }
  oldestPendingAt: string | null
}

/**
 * One error from the device's own activity log, as the phone reported it on
 * its last app open.
 *
 * Capped at 20 and replaced in full each time, so this is what is wrong with
 * the device now, not a searchable history. An error that has scrolled past
 * twenty newer ones is gone from here and still on the phone, where the app's
 * Activity Logs screen and its share button reach it.
 */
export interface DeviceErrorLog {
  at: string
  type: string
  status: string | null
  message: string
}

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

// The server does not send deviceId, on purpose: it is the key device
// registration upserts on, so it stays on the phone. Address a device by uid.
export interface Device {
  uid: string
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
  // Null on a device running an app build from before this shipped. Those
  // devices still report the two counters above, so the pane falls back to
  // them rather than showing nothing.
  syncSnapshot: SyncSnapshot | null
  // Null means the app build does not report errors. An empty array means it
  // reported and had none, which is good news and must read differently.
  recentErrors: DeviceErrorLog[] | null
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
  // Uploadable work queued across the fleet. Unchanged in meaning: the two
  // counts below are separate precisely so this one keeps meaning "a sync
  // will clear this".
  pendingSync: number
  draftsPending: number
  fixRequired: number
}

export interface ProjectDevicesResponse {
  devices: Device[]
  stats: FleetStats
  latestAppBuild: number | null
  latestAppVersion: string | null
}

// What the server reports back after a send. Null batchId means nothing was
// sent (code 'no_recipients'), which still arrives as a 200.
export interface NotifyResult {
  batchId: string | null
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
//
// `outdated` is read off each device's own needsUpdate rather than re-derived
// from build numbers here. One version string can cover more than one build, so
// comparing the bucket's build against the latest let a bucket read "latest"
// while a device inside it showed "update available" in the detail pane. The
// server decides what needs an update; this only counts.
export function appVersionDistribution(devices: Device[]): VersionBucket[] {
  const map = new Map<
    string,
    { count: number; outdatedCount: number; build: number | null }
  >()

  for (const d of devices) {
    const version = d.appVersion || 'Unknown'
    const existing = map.get(version)
    if (existing) {
      existing.count += 1
      if (d.needsUpdate) existing.outdatedCount += 1
      // Keep the highest build seen for this version string, for ordering.
      if (d.appBuild !== null && (existing.build === null || d.appBuild > existing.build)) {
        existing.build = d.appBuild
      }
    } else {
      map.set(version, {
        count: 1,
        outdatedCount: d.needsUpdate ? 1 : 0,
        build: d.appBuild,
      })
    }
  }

  return Array.from(map.entries())
    .map(([version, { count, outdatedCount, build }]) => ({
      version,
      count,
      outdated: outdatedCount > 0,
      build,
    }))
    .sort((a, b) => (b.build ?? -1) - (a.build ?? -1))
    .map(({ version, count, outdated }) => ({ version, count, outdated }))
}
