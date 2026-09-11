import { Paths } from 'expo-file-system';
import { NetInfoState } from '@react-native-community/netinfo';
import { appRealm } from 'src/db/RealmProvider';
import { RealmSchema } from 'src/types/enum/db.enum';
import { InterventionData } from 'src/types/interface/slice.interface';
import { DeviceTelemetry, DeviceNetworkType } from 'src/types/type/device.type';

// The same filter the sync tile uses (see SyncIntervention.tsx). Quarantined
// records (fix_required != "NO") are left out: they cannot upload without the
// user editing them first, so counting them as "pending sync" would tell the
// dashboard to nudge a device that nudging will not help.
const PENDING_INTERVENTIONS_FILTER =
  'status != "SYNCED" AND is_complete == true AND fix_required == "NO"';

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

// Field data recorded on this device but not yet uploaded. Trees are counted
// per intervention rather than by querying TreeDetail directly, because a tree
// row belongs to its intervention and only the intervention carries the
// is_complete / fix_required state that decides whether it can upload.
const getPendingCounts = (): {
  pendingInterventions?: number;
  pendingTrees?: number;
} => {
  try {
    const pending = appRealm
      .objects<InterventionData>(RealmSchema.Intervention)
      .filtered(PENDING_INTERVENTIONS_FILTER);

    let pendingTrees = 0;
    pending.forEach((intervention) => {
      const trees = intervention.sample_trees || [];
      pendingTrees += trees.filter((t) => t.status !== 'SYNCED').length;
    });

    return { pendingInterventions: pending.length, pendingTrees };
  } catch {
    // A Realm that is closed or mid-migration must not break registration.
    return {};
  }
};

// Snapshot of how this device is doing, sent with the device registration on
// every app open. Every field is optional: anything we cannot read is omitted
// and the server leaves the previous value alone.
export const collectDeviceTelemetry = (
  net: NetInfoState,
  lastSyncDate: number,
): DeviceTelemetry => {
  const { pendingInterventions, pendingTrees } = getPendingCounts();

  return {
    storageUsedPct: getStorageUsedPct(),
    networkType: mapNetworkType(net),
    pendingInterventions,
    pendingTrees,
    // 0 is the initial Redux value, meaning "never synced".
    lastSyncAt: lastSyncDate > 0 ? new Date(lastSyncDate).toISOString() : undefined,
  };
};
