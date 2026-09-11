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
} from 'class-validator';

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
}
