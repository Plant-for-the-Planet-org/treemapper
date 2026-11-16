import {
  IsString,
  IsOptional,
  IsIn,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { landmarkTypeEnum } from '../../database/schema';

// Single source of truth is the pg enum in the schema.
export const LANDMARK_TYPES = landmarkTypeEnum.enumValues;
export type LandmarkType = (typeof LANDMARK_TYPES)[number];

export class CreateLandmarkDto {
  @ApiProperty({ description: 'Landmark name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Landmark type', enum: LANDMARK_TYPES })
  @IsIn([...LANDMARK_TYPES])
  type: LandmarkType;

  @ApiPropertyOptional({ description: 'Landmark description', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: "Label shown when type is 'other'", maxLength: 100 })
  @ValidateIf((o) => o.type === 'other')
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  otherLabel?: string;

  @ApiProperty({ description: 'Latitude (WGS84)', minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude (WGS84)', minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: 'Image key or URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: 'Private landmarks are never served to the public dashboard. Defaults to true.',
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class UpdateLandmarkDto {
  @ApiPropertyOptional({ description: 'Landmark name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Landmark type', enum: LANDMARK_TYPES })
  @IsOptional()
  @IsIn([...LANDMARK_TYPES])
  type?: LandmarkType;

  @ApiPropertyOptional({ description: 'Landmark description', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: "Label shown when type is 'other'", maxLength: 100 })
  @ValidateIf((o) => o.type === 'other')
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  otherLabel?: string;

  // Latitude and longitude must be sent together; the service enforces the
  // pairing because class-validator cannot express "both or neither" cleanly.
  @ApiPropertyOptional({ description: 'Latitude (WGS84)', minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude (WGS84)', minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Image key or URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Private landmarks are never served to the public dashboard.' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
