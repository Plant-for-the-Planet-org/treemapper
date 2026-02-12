import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FeedbackType {
  FEEDBACK = 'feedback',
  ISSUE = 'issue',
  TRANSLATION_FIX = 'translation_fix',
}

export class CreateFeedbackDto {
  @ApiProperty({ enum: FeedbackType, description: 'Type of feedback' })
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @ApiProperty({ description: 'Feedback message content' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'App locale (e.g. en, fr, mg)' })
  @IsOptional()
  @IsString()
  locale?: string;
  

  @ApiPropertyOptional({ description: 'App locale (e.g. en, fr, mg)' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'App version string' })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiPropertyOptional({ description: 'Device information (OS, model, etc.)' })
  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
