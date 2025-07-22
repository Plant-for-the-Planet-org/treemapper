import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUrl,
  IsObject,
  MaxLength,
  MinLength,
  Min,
  IsLatitude,
  IsLongitude,
  Length,
  IsNumber
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsSlug, IsGeoJSON } from '../../common/decorator/validation.decorators';

export class CreateProjectDto {

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  projectName: string;

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsOptional()
  @IsString()
  target?: string;


  @IsString()
  description?: string;

  @IsOptional()
  @IsGeoJSON({ message: 'Invalid GeoJSON format' })
  location?: any;


  @IsOptional()
  @IsString()
  @MaxLength(36)
  uid?: string;


  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsSlug({ message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  purpose?: string;


  @IsOptional()
  @IsString()
  ecosystem?: string;

  @IsOptional()
  @IsString()
  projectScale?: string;


  @IsOptional()
  @IsString()
  projectWebsite?: string;


  @IsOptional()
  @IsString()
  classification?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  country?: string;


  @IsOptional()
  @IsString()
  originalGeometry?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  geoLatitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  geoLongitude?: number;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  linkText?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = true;


  @IsOptional()
  @IsBoolean()
  isPersonal?: boolean = true;


  @IsOptional()
  @IsString()
  @MaxLength(100)
  intensity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  revisionPeriodicityLevel?: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    customFields?: Record<string, any>;
    settings?: Record<string, any>;
  };
}
