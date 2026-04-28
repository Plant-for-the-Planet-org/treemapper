import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

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
}
