import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsDateString, IsUrl, ValidateNested, IsObject } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  PROJECT_INVITE = 'project_invite',
  PROJECT_UPDATE = 'project_update',
  TREE_MEASUREMENT_DUE = 'tree_measurement_due',
  INTERVENTION_COMPLETED = 'intervention_completed',
  SITE_STATUS_CHANGED = 'site_status_changed',
  NEW_MEMBER_JOINED = 'new_member_joined',
  SPECIES_ADDED = 'species_added',
  IMAGE_UPLOADED = 'image_uploaded',
  MILESTONE_REACHED = 'milestone_reached',
  WEATHER_ALERT = 'weather_alert',
  MAINTENANCE_REMINDER = 'maintenance_reminder',
  SYSTEM_UPDATE = 'system_update'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationCategory {
  COLLABORATION = 'collaboration',
  MONITORING = 'monitoring',
  MAINTENANCE = 'maintenance',
  SYSTEM = 'system',
  PROGRESS = 'progress',
  ALERTS = 'alerts'
}

export enum DeliveryMethod {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms'
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to receive the notification' })
  @IsInt()
  userId: number;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  relatedEntityId?: number;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actionText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ enum: DeliveryMethod })
  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BulkCreateNotificationDto {
  @ApiProperty({ type: [Number] })
  @IsInt({ each: true })
  userIds: number[];

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  relatedEntityId?: number;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class NotificationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  unreadOnly?: boolean;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}

export class NotificationStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  unread: number;

  @ApiProperty()
  read: number;

  @ApiProperty()
  archived: number;

  @ApiProperty()
  byCategory: Record<string, number>;

  @ApiProperty()
  byPriority: Record<string, number>;
}