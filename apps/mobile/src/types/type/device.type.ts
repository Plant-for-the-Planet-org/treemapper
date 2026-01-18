export interface DeviceRegistrationParams {
  deviceId: string;
  oneSignalId?: string;
  deviceOs?: string;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  locale?: string;
  timezone?: string;
  notificationPermission?: boolean;
  isActive?: boolean;
}

export interface DeviceRegistrationResponse {
  uid: string;
  deviceId: string;
}
