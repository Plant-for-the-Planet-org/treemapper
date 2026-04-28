import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsDateString, IsUrl, ValidateNested, IsObject } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  PROJECT = 'project',
  SITE = 'site',
  MEMBER = 'member',
  INTERVENTION = 'intervention',
  TREE = 'tree',
  SPECIES = 'species',
  USER = 'user',
  INVITE = 'invite',
  SYSTEM = 'system',
  OTHER = 'other'
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

  @ApiPropertyOptional({ description: 'Related entity ID' })
  @IsOptional()
  @IsInt()
  entityId?: number;

  @ApiPropertyOptional({
    enum: ['low', 'normal', 'high', 'urgent'],
    description: 'Notification priority level'
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  @ApiPropertyOptional({ description: 'Notification category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Action URL for the notification' })
  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Action button text' })
  @IsOptional()
  @IsString()
  actionText?: string;

  @ApiPropertyOptional({ description: 'Schedule notification for future delivery' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional({ description: 'Notification expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Delivery method' })
  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @ApiPropertyOptional({ description: 'Notification image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Batch ID for grouped notifications' })
  @IsOptional()
  @IsString()
  batchId?: string;
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

// Mobile-specific DTOs

export class MobileNotificationQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter to only unread notifications' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  unreadOnly?: boolean;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Filter by notification type' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

export class MobileNotificationItemDto {
  @ApiProperty({ description: 'Notification unique identifier' })
  uid: string;

  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  type: string;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification message content' })
  message: string;

  @ApiProperty({ description: 'Whether the notification has been read' })
  isRead: boolean;

  @ApiPropertyOptional({ description: 'Priority level' })
  priority?: string;

  @ApiPropertyOptional({ description: 'Category of the notification' })
  category?: string;

  @ApiPropertyOptional({ description: 'URL for action' })
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Text for action button' })
  actionText?: string;

  @ApiPropertyOptional({ description: 'Image URL for the notification' })
  image?: string;

  @ApiProperty({ description: 'When the notification was created' })
  createdAt: Date;
}

export class MobileNotificationPaginationDto {
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of notifications' })
  total: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}

export class MobileNotificationResponseDto {
  @ApiProperty({ type: [MobileNotificationItemDto], description: 'List of notifications' })
  notifications: MobileNotificationItemDto[];

  @ApiProperty({ type: MobileNotificationPaginationDto, description: 'Pagination information' })
  pagination: MobileNotificationPaginationDto;

  @ApiProperty({ description: 'Count of unread notifications' })
  unreadCount: number;
}