import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PlanMeasurementsDto {
  @ApiPropertyOptional({ description: 'Tree height in meters' })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ description: 'Tree width/diameter in centimeters' })
  @IsOptional()
  @IsNumber()
  width?: number;
}

export class PlanImageDto {
  @ApiPropertyOptional({ description: 'Filename of the image already uploaded to R2 via presigned URL' })
  @IsString()
  filename: string;

  @ApiPropertyOptional({ description: 'Image mime type, e.g. image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Image type, defaults to overview' })
  @IsOptional()
  @IsString()
  type?: string;
}

/**
 * Records ("uploads") a planned single-tree intervention from mobile.
 *
 * Plans are created on web with only the intervention + species rows (no tree),
 * status `planning`. This payload carries whatever the field worker captured.
 * Every field is optional ("no compulsion"); only what is provided is updated.
 * The tree row is created on the first call and updated on later calls.
 */
export class RecordPlannedInterventionDto {
  @ApiPropertyOptional({ description: 'GeoJSON Point (or Feature/FeatureCollection wrapping a Point) for the tree location' })
  @IsOptional()
  @IsObject()
  geometry?: any;

  @ApiPropertyOptional({ type: PlanMeasurementsDto, description: 'Recorded tree dimensions' })
  @IsOptional()
  @IsObject()
  measurements?: PlanMeasurementsDto;

  @ApiPropertyOptional({ description: 'Tree tag' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ type: PlanImageDto, description: 'Image already uploaded to R2' })
  @IsOptional()
  @IsObject()
  image?: PlanImageDto;

  @ApiPropertyOptional({ description: 'Device GPS location at capture time' })
  @IsOptional()
  @IsObject()
  deviceLocation?: any;

  @ApiPropertyOptional({ description: 'Planting date as an ISO string' })
  @IsOptional()
  @IsString()
  plantingDate?: string;

  @ApiPropertyOptional({ description: 'Additional metadata to merge onto the tree' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
