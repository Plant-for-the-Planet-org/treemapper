import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MinLength, MaxLength, IsInt, Min, IsBoolean, IsUrl, IsObject, IsNumber, IsLatitude, IsLongitude, ValidateNested } from 'class-validator';
import { IsGeoJSON } from 'src/common/decorator/validation.decorators';

// Which intervention sources require approval. Each defaults to true (gated)
// when omitted and the master switch is on.
export class ApprovalSourcesDto {
  @IsOptional()
  @IsBoolean()
  web?: boolean;

  @IsOptional()
  @IsBoolean()
  bulk?: boolean;

  @IsOptional()
  @IsBoolean()
  mobile?: boolean;
}

export class ApprovalSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ApprovalSourcesDto)
  sources?: ApprovalSourcesDto;

  @IsOptional()
  @IsBoolean()
  siteApprovalRequired?: boolean;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  projectName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  projectType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ecosystem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  projectScale?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  target?: number;

  @IsOptional()
  @IsString()
  projectWebsite?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  purpose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  classification?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  intensity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  revisionPeriodicityLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isPersonal?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  approvalBoardEnabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApprovalSettingsDto)
  approvalSettings?: ApprovalSettingsDto;

  @IsOptional()
  @IsBoolean()
  apiEnabled?: boolean;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsGeoJSON({ message: 'Invalid GeoJSON format' })
  location?: any;

  @IsOptional()
  @IsObject()
  originalGeometry?: any;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  geoLatitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  geoLongitude?: number;

  @IsOptional()
  @IsObject()
  metadata?: {
    customFields?: Record<string, any>;
    settings?: Record<string, any>;
  };
}

// Service Response Interface
export interface ServiceResponse<T = any> {
  message: string;
  statusCode: number;
  error: string | null;
  data: T | null;
  code: string;
}

// Project Membership Interface
export interface ProjectMembership {
  role: string;
  userId: number;
  projectId: number;
}