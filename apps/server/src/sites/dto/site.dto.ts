import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  IsObject,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsGeoJSON } from 'src/common/decorator/validation.decorators';

// Create Site DTO
export class CreateSiteDto {
  @ApiProperty({ description: 'Site name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Site description' })
  @IsOptional()
  @IsString()
  description?: string;


  @ApiPropertyOptional({
    description: 'Site status',
    enum: ['planted', 'planting', 'barren', 'reforestation']
  })
  @IsOptional()
  @IsEnum(['planted', 'planting', 'barren', 'reforestation'])
  status?: 'planted' | 'planting' | 'barren' | 'reforestation';

  @IsGeoJSON({ message: 'Invalid GeoJSON format' })
  location?: any;


  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

// Update Site DTO
export class UpdateSiteDto {
  @ApiPropertyOptional({ description: 'Site name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Site description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Site location as GeoJSON geometry' })
  @IsOptional()
  @IsObject()
  originalGeometry?: any;

  @ApiPropertyOptional({
    description: 'Site status',
    enum: ['planted', 'planting', 'barren', 'reforestation']
  })
  @IsOptional()
  @IsEnum(['planted', 'planting', 'barren', 'reforestation'])
  status?: 'planted' | 'planting' | 'barren' | 'reforestation';

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

// Update Site Images DTO
export class UpdateSiteImagesDto {
  @ApiPropertyOptional({ description: 'Primary image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'CDN image URL' })
  @IsOptional()
  @IsString()
  imageCdn?: string;

  @ApiPropertyOptional({ description: 'All images as JSON array' })
  @IsOptional()
  @IsObject()
  allImages?: any;
}

// Query Sites DTO
export class QuerySitesDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['planted', 'planting', 'barren', 'reforestation']
  })
  @IsOptional()
  @IsEnum(['planted', 'planting', 'barren', 'reforestation'])
  status?: 'planted' | 'planting' | 'barren' | 'reforestation';
}
