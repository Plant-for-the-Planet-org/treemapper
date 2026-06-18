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
  locale: string | null;
  timezone: string | null;
  notificationPermission: boolean;
  isActive: boolean;
  online: boolean;
  lastActiveAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: {
    uid: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export interface ProjectDeviceStats {
  total: number;
  online: number;
  notificationsEnabled: number;
  inactive: number;
  ios: number;
  android: number;
}

export interface ProjectDevicesResponse {
  devices: ProjectDevice[];
  stats: ProjectDeviceStats;
}
