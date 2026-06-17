import {
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  ArrayNotEmpty,
  MaxLength,
  ValidateIf,
} from 'class-validator';

// Push notification composed from the dashboard. Recipients are resolved on the
// server from the project's members; the client only sends device uids when it
// targets a subset.
export class SendDeviceNotificationDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsIn(['normal', 'high'])
  priority?: 'normal' | 'high';

  // 'fleet' = every member device with notifications on.
  // 'selected' = only the devices named in deviceUids.
  @IsIn(['fleet', 'selected'])
  recipients: 'fleet' | 'selected';

  @ValidateIf((o) => o.recipients === 'selected')
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  deviceUids?: string[];
}
