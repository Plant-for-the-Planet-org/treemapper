/**
 * Mock data for the Device Management module.
 *
 * This module is a POC. The mobile app currently only supports receiving push
 * notifications, so everything below is generated locally to design and demo
 * the dashboard experience. No data here is fetched from the server.
 *
 * When the backend is ready, swap these helpers for the `getProjectDevices` /
 * `notifyProjectDevices` calls in `@shared-core/fetchApi/api.fetch`.
 */

export type Platform = 'ios' | 'android'
export type NetworkType = 'wifi' | 'cellular' | 'offline'

export interface DeviceUser {
  uid: string
  name: string
  email: string
  image: string | null
  role: 'Owner' | 'Admin' | 'Member' | 'Contributor'
}

export interface Device {
  uid: string
  deviceId: string
  deviceName: string | null
  deviceModel: string | null
  deviceOs: Platform
  osVersion: string | null
  appVersion: string | null
  appBuild: number
  locale: string | null
  timezone: string | null
  notificationPermission: boolean
  isActive: boolean
  online: boolean
  lastActiveAt: string | null
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
  user: DeviceUser
  // POC telemetry — shown in the UI, generated locally.
  batteryLevel: number // 0-100
  storageUsedPct: number // 0-100
  networkType: NetworkType
  pendingInterventions: number
  pendingTrees: number
  site: string | null
}

export type CampaignStatus = 'sent' | 'scheduled' | 'sending' | 'failed'
export type CampaignTarget = 'fleet' | 'segment' | 'device'
export type Priority = 'normal' | 'high'

export interface NotificationCampaign {
  uid: string
  title: string
  message: string
  priority: Priority
  target: CampaignTarget
  targetLabel: string
  status: CampaignStatus
  createdAt: string
  scheduledFor: string | null
  recipients: number
  delivered: number
  opened: number
  failed: number
  sentBy: string
}

export type TemplateCategory = 'sync' | 'monitoring' | 'update' | 'reminder' | 'alert'

export interface NotificationTemplate {
  uid: string
  label: string
  title: string
  message: string
  category: TemplateCategory
  usageCount: number
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LATEST_APP_VERSION = '4.2.1'
export const LATEST_APP_BUILD = 421

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
const ahead = (ms: number) => new Date(Date.now() + ms).toISOString()

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

export const MOCK_DEVICES: Device[] = [
  {
    uid: 'dev-01', deviceId: 'A1B2-C3D4-E5F6', deviceName: 'Amara’s iPhone',
    deviceModel: 'iPhone 15 Pro', deviceOs: 'ios', osVersion: '17.5',
    appVersion: '4.2.1', appBuild: 421, locale: 'en-KE', timezone: 'Africa/Nairobi',
    notificationPermission: true, isActive: true, online: true,
    lastActiveAt: ago(3 * MINUTE), lastSyncAt: ago(12 * MINUTE),
    createdAt: ago(210 * DAY), updatedAt: ago(3 * MINUTE),
    batteryLevel: 82, storageUsedPct: 64, networkType: 'wifi',
    pendingInterventions: 0, pendingTrees: 0, site: 'Kijabe Ridge',
    user: { uid: 'u-01', name: 'Amara Okafor', email: 'amara.okafor@plant.org', image: null, role: 'Admin' },
  },
  {
    uid: 'dev-02', deviceId: 'B2C3-D4E5-F6A1', deviceName: 'Field Pixel 7',
    deviceModel: 'Google Pixel 7', deviceOs: 'android', osVersion: '14',
    appVersion: '4.2.1', appBuild: 421, locale: 'en-KE', timezone: 'Africa/Nairobi',
    notificationPermission: true, isActive: true, online: true,
    lastActiveAt: ago(8 * MINUTE), lastSyncAt: ago(40 * MINUTE),
    createdAt: ago(180 * DAY), updatedAt: ago(8 * MINUTE),
    batteryLevel: 47, storageUsedPct: 71, networkType: 'cellular',
    pendingInterventions: 6, pendingTrees: 214, site: 'Kijabe Ridge',
    user: { uid: 'u-02', name: 'David Mwangi', email: 'david.mwangi@plant.org', image: null, role: 'Member' },
  },
  {
    uid: 'dev-03', deviceId: 'C3D4-E5F6-A1B2', deviceName: 'Samsung A54',
    deviceModel: 'Samsung Galaxy A54', deviceOs: 'android', osVersion: '13',
    appVersion: '4.1.0', appBuild: 410, locale: 'en-TZ', timezone: 'Africa/Dar_es_Salaam',
    notificationPermission: true, isActive: true, online: false,
    lastActiveAt: ago(2 * HOUR), lastSyncAt: ago(2 * HOUR),
    createdAt: ago(150 * DAY), updatedAt: ago(2 * HOUR),
    batteryLevel: 23, storageUsedPct: 88, networkType: 'offline',
    pendingInterventions: 18, pendingTrees: 642, site: 'Usambara East',
    user: { uid: 'u-03', name: 'Grace Kimani', email: 'grace.kimani@plant.org', image: null, role: 'Member' },
  },
  {
    uid: 'dev-04', deviceId: 'D4E5-F6A1-B2C3', deviceName: 'iPhone SE',
    deviceModel: 'iPhone SE (3rd gen)', deviceOs: 'ios', osVersion: '16.7',
    appVersion: '4.0.2', appBuild: 402, locale: 'pt-BR', timezone: 'America/Sao_Paulo',
    notificationPermission: false, isActive: true, online: true,
    lastActiveAt: ago(22 * MINUTE), lastSyncAt: ago(3 * HOUR),
    createdAt: ago(95 * DAY), updatedAt: ago(22 * MINUTE),
    batteryLevel: 91, storageUsedPct: 52, networkType: 'wifi',
    pendingInterventions: 2, pendingTrees: 38, site: 'Mata Atlântica',
    user: { uid: 'u-04', name: 'João Pereira', email: 'joao.pereira@plant.org', image: null, role: 'Contributor' },
  },
  {
    uid: 'dev-05', deviceId: 'E5F6-A1B2-C3D4', deviceName: 'Redmi Note 12',
    deviceModel: 'Xiaomi Redmi Note 12', deviceOs: 'android', osVersion: '13',
    appVersion: '4.2.1', appBuild: 421, locale: 'hi-IN', timezone: 'Asia/Kolkata',
    notificationPermission: true, isActive: true, online: true,
    lastActiveAt: ago(1 * MINUTE), lastSyncAt: ago(1 * MINUTE),
    createdAt: ago(60 * DAY), updatedAt: ago(1 * MINUTE),
    batteryLevel: 68, storageUsedPct: 44, networkType: 'wifi',
    pendingInterventions: 0, pendingTrees: 0, site: 'Aravalli Hills',
    user: { uid: 'u-05', name: 'Priya Sharma', email: 'priya.sharma@plant.org', image: null, role: 'Admin' },
  },
  {
    uid: 'dev-06', deviceId: 'F6A1-B2C3-D4E5', deviceName: null,
    deviceModel: 'Samsung Galaxy S21', deviceOs: 'android', osVersion: '14',
    appVersion: '4.2.1', appBuild: 421, locale: 'en-GH', timezone: 'Africa/Accra',
    notificationPermission: true, isActive: true, online: false,
    lastActiveAt: ago(5 * HOUR), lastSyncAt: ago(6 * HOUR),
    createdAt: ago(120 * DAY), updatedAt: ago(5 * HOUR),
    batteryLevel: 55, storageUsedPct: 60, networkType: 'offline',
    pendingInterventions: 9, pendingTrees: 301, site: 'Atewa Range',
    user: { uid: 'u-06', name: 'Kwame Asante', email: 'kwame.asante@plant.org', image: null, role: 'Member' },
  },
  {
    uid: 'dev-07', deviceId: 'A7B8-C9D0-E1F2', deviceName: 'Maria iPad',
    deviceModel: 'iPad (10th gen)', deviceOs: 'ios', osVersion: '17.4',
    appVersion: '4.2.1', appBuild: 421, locale: 'es-MX', timezone: 'America/Mexico_City',
    notificationPermission: true, isActive: true, online: true,
    lastActiveAt: ago(14 * MINUTE), lastSyncAt: ago(30 * MINUTE),
    createdAt: ago(75 * DAY), updatedAt: ago(14 * MINUTE),
    batteryLevel: 38, storageUsedPct: 47, networkType: 'wifi',
    pendingInterventions: 1, pendingTrees: 12, site: 'Sierra Norte',
    user: { uid: 'u-07', name: 'Maria González', email: 'maria.gonzalez@plant.org', image: null, role: 'Member' },
  },
  {
    uid: 'dev-08', deviceId: 'B8C9-D0E1-F2A3', deviceName: 'OnePlus Nord',
    deviceModel: 'OnePlus Nord 3', deviceOs: 'android', osVersion: '14',
    appVersion: '4.2.1', appBuild: 421, locale: 'en-ID', timezone: 'Asia/Jakarta',
    notificationPermission: false, isActive: false, online: false,
    lastActiveAt: ago(14 * DAY), lastSyncAt: ago(14 * DAY),
    createdAt: ago(200 * DAY), updatedAt: ago(14 * DAY),
    batteryLevel: 0, storageUsedPct: 33, networkType: 'offline',
    pendingInterventions: 0, pendingTrees: 0, site: null,
    user: { uid: 'u-08', name: 'Budi Santoso', email: 'budi.santoso@plant.org', image: null, role: 'Contributor' },
  },
  {
    uid: 'dev-09', deviceId: 'C9D0-E1F2-A3B4', deviceName: 'Tecno Spark',
    deviceModel: 'Tecno Spark 10', deviceOs: 'android', osVersion: '13',
    appVersion: '4.1.0', appBuild: 410, locale: 'fr-CD', timezone: 'Africa/Kinshasa',
    notificationPermission: true, isActive: true, online: false,
    lastActiveAt: ago(1 * DAY), lastSyncAt: ago(1 * DAY),
    createdAt: ago(45 * DAY), updatedAt: ago(1 * DAY),
    batteryLevel: 12, storageUsedPct: 79, networkType: 'offline',
    pendingInterventions: 27, pendingTrees: 988, site: 'Congo Basin Plot 4',
    user: { uid: 'u-09', name: 'Aline Mukendi', email: 'aline.mukendi@plant.org', image: null, role: 'Member' },
  },
  {
    uid: 'dev-10', deviceId: 'D0E1-F2A3-B4C5', deviceName: 'Lucas iPhone 13',
    deviceModel: 'iPhone 13', deviceOs: 'ios', osVersion: '17.5',
    appVersion: '4.2.1', appBuild: 421, locale: 'en-AU', timezone: 'Australia/Sydney',
    notificationPermission: true, isActive: true, online: true,
    lastActiveAt: ago(6 * MINUTE), lastSyncAt: ago(20 * MINUTE),
    createdAt: ago(30 * DAY), updatedAt: ago(6 * MINUTE),
    batteryLevel: 74, storageUsedPct: 41, networkType: 'cellular',
    pendingInterventions: 3, pendingTrees: 56, site: 'Daintree North',
    user: { uid: 'u-10', name: 'Lucas Bennett', email: 'lucas.bennett@plant.org', image: null, role: 'Owner' },
  },
  {
    uid: 'dev-11', deviceId: 'E1F2-A3B4-C5D6', deviceName: 'Moto G84',
    deviceModel: 'Motorola Moto G84', deviceOs: 'android', osVersion: '14',
    appVersion: '4.2.1', appBuild: 421, locale: 'es-CO', timezone: 'America/Bogota',
    notificationPermission: true, isActive: true, online: false,
    lastActiveAt: ago(45 * MINUTE), lastSyncAt: ago(50 * MINUTE),
    createdAt: ago(88 * DAY), updatedAt: ago(45 * MINUTE),
    batteryLevel: 61, storageUsedPct: 56, networkType: 'offline',
    pendingInterventions: 4, pendingTrees: 91, site: 'Andes Cloud Forest',
    user: { uid: 'u-11', name: 'Sofía Ramírez', email: 'sofia.ramirez@plant.org', image: null, role: 'Member' },
  },
  {
    uid: 'dev-12', deviceId: 'F2A3-B4C5-D6E7', deviceName: 'Galaxy A34',
    deviceModel: 'Samsung Galaxy A34', deviceOs: 'android', osVersion: '13',
    appVersion: '3.9.5', appBuild: 395, locale: 'sw-KE', timezone: 'Africa/Nairobi',
    notificationPermission: true, isActive: true, online: true,
    lastActiveAt: ago(18 * MINUTE), lastSyncAt: ago(4 * HOUR),
    createdAt: ago(260 * DAY), updatedAt: ago(18 * MINUTE),
    batteryLevel: 29, storageUsedPct: 92, networkType: 'cellular',
    pendingInterventions: 11, pendingTrees: 377, site: 'Kijabe Ridge',
    user: { uid: 'u-12', name: 'Joseph Otieno', email: 'joseph.otieno@plant.org', image: null, role: 'Member' },
  },
]

// ---------------------------------------------------------------------------
// Notification campaign history
// ---------------------------------------------------------------------------

export const MOCK_CAMPAIGNS: NotificationCampaign[] = [
  {
    uid: 'camp-01', title: 'Please sync when on Wi-Fi',
    message: 'You have field data queued. Please open the app on Wi-Fi to upload your latest interventions.',
    priority: 'high', target: 'fleet', targetLabel: 'Whole fleet',
    status: 'sent', createdAt: ago(2 * HOUR), scheduledFor: null,
    recipients: 10, delivered: 9, opened: 6, failed: 1, sentBy: 'Amara Okafor',
  },
  {
    uid: 'camp-02', title: 'New monitoring form available',
    message: 'A new monitoring form is ready for Kijabe Ridge. Please check the app to start your visit.',
    priority: 'normal', target: 'segment', targetLabel: 'Kijabe Ridge team',
    status: 'sent', createdAt: ago(1 * DAY), scheduledFor: null,
    recipients: 4, delivered: 4, opened: 3, failed: 0, sentBy: 'Lucas Bennett',
  },
  {
    uid: 'camp-03', title: 'Update to the latest version',
    message: 'TreeMapper 4.2.1 is available with sync fixes. Please update when you can.',
    priority: 'normal', target: 'segment', targetLabel: 'Outdated app versions',
    status: 'sent', createdAt: ago(2 * DAY), scheduledFor: null,
    recipients: 3, delivered: 3, opened: 1, failed: 0, sentBy: 'Priya Sharma',
  },
  {
    uid: 'camp-04', title: 'Weekly sync reminder',
    message: 'It is the end of the week. Please sync your devices so no field data is lost.',
    priority: 'normal', target: 'fleet', targetLabel: 'Whole fleet',
    status: 'scheduled', createdAt: ago(3 * HOUR), scheduledFor: ahead(2 * DAY),
    recipients: 10, delivered: 0, opened: 0, failed: 0, sentBy: 'Amara Okafor',
  },
  {
    uid: 'camp-05', title: 'Low storage on your device',
    message: 'Your device storage is almost full. Please sync and free up space to keep recording.',
    priority: 'high', target: 'segment', targetLabel: 'Storage over 85%',
    status: 'sent', createdAt: ago(4 * DAY), scheduledFor: null,
    recipients: 3, delivered: 2, opened: 2, failed: 1, sentBy: 'David Mwangi',
  },
  {
    uid: 'camp-06', title: 'Reminder: submit Plot 4 measurements',
    message: 'Plot 4 in the Congo Basin still needs this month’s remeasurement. Please complete it soon.',
    priority: 'normal', target: 'device', targetLabel: 'Aline Mukendi',
    status: 'failed', createdAt: ago(5 * DAY), scheduledFor: null,
    recipients: 1, delivered: 0, opened: 0, failed: 1, sentBy: 'Lucas Bennett',
  },
  {
    uid: 'camp-07', title: 'Thank you for a great planting season',
    message: 'Your team logged over 12,000 trees this quarter. Thank you for the incredible work!',
    priority: 'normal', target: 'fleet', targetLabel: 'Whole fleet',
    status: 'sent', createdAt: ago(8 * DAY), scheduledFor: null,
    recipients: 9, delivered: 9, opened: 8, failed: 0, sentBy: 'Lucas Bennett',
  },
]

// ---------------------------------------------------------------------------
// Notification templates
// ---------------------------------------------------------------------------

export const MOCK_TEMPLATES: NotificationTemplate[] = [
  {
    uid: 'tpl-01', label: 'Sync on Wi-Fi', category: 'sync',
    title: 'Please sync when on Wi-Fi',
    message: 'Please open the app on Wi-Fi to upload your latest interventions. Thanks!',
    usageCount: 24,
  },
  {
    uid: 'tpl-02', label: 'New monitoring', category: 'monitoring',
    title: 'New monitoring form available',
    message: 'A new monitoring form is ready. Please check the app to start your visit.',
    usageCount: 11,
  },
  {
    uid: 'tpl-03', label: 'Update app', category: 'update',
    title: 'Update to the latest version',
    message: 'A new app version is available with bug fixes. Please update when you can.',
    usageCount: 9,
  },
  {
    uid: 'tpl-04', label: 'Weekly reminder', category: 'reminder',
    title: 'Weekly sync reminder',
    message: 'It is the end of the week. Please sync your devices so no field data is lost.',
    usageCount: 17,
  },
  {
    uid: 'tpl-05', label: 'Low storage', category: 'alert',
    title: 'Low storage on your device',
    message: 'Your device storage is almost full. Please sync and free up space to keep recording.',
    usageCount: 5,
  },
  {
    uid: 'tpl-06', label: 'Field check-in', category: 'reminder',
    title: 'Field check-in',
    message: 'Please confirm you are safe and on site. Tap to open today’s task list.',
    usageCount: 3,
  },
]

// ---------------------------------------------------------------------------
// Derived data
// ---------------------------------------------------------------------------

const ONLINE_WINDOW = 15 * MINUTE

export function computeStats(devices: Device[]): FleetStats {
  return devices.reduce<FleetStats>(
    (acc, d) => {
      acc.total += 1
      if (d.online) acc.online += 1
      if (d.notificationPermission && d.isActive) acc.notificationsEnabled += 1
      if (!d.isActive) acc.inactive += 1
      if (d.deviceOs === 'ios') acc.ios += 1
      if (d.deviceOs === 'android') acc.android += 1
      if (d.appBuild < LATEST_APP_BUILD) acc.needsUpdate += 1
      acc.pendingSync += d.pendingInterventions
      return acc
    },
    { total: 0, online: 0, notificationsEnabled: 0, inactive: 0, ios: 0, android: 0, needsUpdate: 0, pendingSync: 0 },
  )
}

export interface VersionBucket {
  version: string
  count: number
  outdated: boolean
}

export function appVersionDistribution(devices: Device[]): VersionBucket[] {
  const map = new Map<string, number>()
  for (const d of devices) {
    const v = d.appVersion || 'Unknown'
    map.set(v, (map.get(v) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([version, count]) => ({ version, count, outdated: version !== LATEST_APP_VERSION }))
    .sort((a, b) => b.version.localeCompare(a.version))
}

export const isOnline = (d: Device) =>
  d.lastActiveAt ? Date.now() - new Date(d.lastActiveAt).getTime() < ONLINE_WINDOW : false

export const canReceive = (d: Device) => d.notificationPermission && d.isActive

export const needsUpdate = (d: Device) => d.appBuild < LATEST_APP_BUILD
