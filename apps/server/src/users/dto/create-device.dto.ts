import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsIn,
  IsISO8601,
  IsObject,
  IsArray,
} from 'class-validator';

// What the mobile app may send under `syncSnapshot`. Every field is optional
// and nothing is validated beyond "it is an object": the server normalizes it
// into the stored shape (`normalizeSyncSnapshot` in users.service.ts) rather
// than rejecting it.
//
// That is deliberate. The global ValidationPipe runs with
// forbidNonWhitelisted, so a nested DTO class would 400 the whole device
// registration the moment a newer app build reported one extra bucket. Device
// registration must never fail over telemetry, and normalizing also means we
// only ever store keys we chose, not whatever arrived.
export interface DeviceErrorLogInput {
  at?: unknown;
  type?: unknown;
  status?: unknown;
  message?: unknown;
}

export interface SyncSnapshotInput {
  drafts?: unknown;
  fixRequired?: unknown;
  queued?: Record<string, unknown>;
  oldestPendingAt?: unknown;
}

export class CreateDeviceDto {
  @IsString()
  @MaxLength(255)
  deviceId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  oneSignalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  deviceOs?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  osVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  appBuild?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  notificationPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Telemetry snapshot from this app open. All optional: an older app build
  // sends none of it and the columns stay null.
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  storageUsedPct?: number;

  @IsOptional()
  @IsIn(['wifi', 'cellular', 'offline'])
  networkType?: 'wifi' | 'cellular' | 'offline';

  @IsOptional()
  @IsInt()
  @Min(0)
  pendingInterventions?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pendingTrees?: number;

  @IsOptional()
  @IsISO8601()
  lastSyncAt?: string;

  // Breakdown of the same backlog `pendingInterventions` counts, plus the
  // drafts and quarantined records that counter leaves out. See
  // SyncSnapshotInput above for why this is not a nested DTO class.
  @IsOptional()
  @IsObject()
  syncSnapshot?: SyncSnapshotInput;

  // The device's newest error-level activity logs. Validated as loosely as
  // syncSnapshot and for the same reason: `normalizeRecentErrors` in
  // users.service.ts caps the list, trims every string and keeps only the four
  // fields we store, so nothing the client sends reaches the column unchecked.
  @IsOptional()
  @IsArray()
  recentErrors?: DeviceErrorLogInput[];
}
