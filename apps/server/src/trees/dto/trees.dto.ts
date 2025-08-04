// src/modules/trees/dto/create-tree.dto.ts
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, ValidateNested, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TreeStatus {
  ALIVE = 'alive',
  DEAD = 'dead',
  UNKNOWN = 'unknown',
  REMOVED = 'removed',
}

export class CreateTreeDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  interventionId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  scientificSpeciesId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  interventionSpeciesId?: number;

  @ApiPropertyOptional({ example: 'TR-001' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ example: 'sample' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: 19.0760 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 72.8777 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 100.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  altitude?: number;

  @ApiPropertyOptional({ example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentHeight?: number;

  @ApiPropertyOptional({ example: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentDiameter?: number;

  @ApiProperty({ enum: TreeStatus, default: TreeStatus.ALIVE })
  @IsEnum(TreeStatus)
  status: TreeStatus = TreeStatus.ALIVE;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  plantingDate?: string;

  @ApiPropertyOptional({ example: ['image1.jpg', 'image2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allImages?: string[];

  @ApiPropertyOptional({ example: 'primary-image.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageCdn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}

// src/modules/trees/dto/update-tree.dto.ts
import { PartialType } from '@nestjs/swagger';

export class UpdateTreeDto extends PartialType(CreateTreeDto) {}

// src/modules/trees/dto/create-tree-record.dto.ts
export class CreateTreeRecordDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  treeId: number;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ example: 0.35 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  diameter?: number;

  @ApiPropertyOptional({ example: 1.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  crownDiameter?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  healthScore?: number;

  @ApiPropertyOptional({ enum: TreeStatus })
  @IsOptional()
  @IsEnum(TreeStatus)
  previousStatus?: TreeStatus;

  @ApiPropertyOptional({ enum: TreeStatus })
  @IsOptional()
  @IsEnum(TreeStatus)
  newStatus?: TreeStatus;

  @ApiPropertyOptional({ example: 'disease' })
  @IsOptional()
  @IsString()
  statusReason?: string;

  @ApiPropertyOptional({ example: 'Tree showing good growth, healthy leaves' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  measurements?: any;

  @ApiPropertyOptional({ example: ['record1.jpg', 'record2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allImages?: string[];

  @ApiPropertyOptional({ example: 'record-image.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/record.jpg' })
  @IsOptional()
  @IsString()
  imageCdn?: string;

  @ApiPropertyOptional({ example: 'measurement' })
  @IsOptional()
  @IsString()
  recordType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}

// src/modules/trees/dto/update-tree-record.dto.ts
export class UpdateTreeRecordDto extends PartialType(CreateTreeRecordDto) {}

// src/modules/trees/dto/query-tree.dto.ts
export class QueryTreeDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  interventionId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  scientificSpeciesId?: number;

  @ApiPropertyOptional({ enum: TreeStatus })
  @IsOptional()
  @IsEnum(TreeStatus)
  status?: TreeStatus;

  @ApiPropertyOptional({ example: 'sample' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  plantingDateStart?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  plantingDateEnd?: string;

  @ApiPropertyOptional({ example: 'TR-001' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// src/modules/trees/dto/tree-response.dto.ts
export class TreeRecordResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'rec_abc123' })
  uid: string;

  @ApiProperty({ example: 2.5 })
  height: number;

  @ApiProperty({ example: 0.35 })
  diameter: number;

  @ApiProperty({ example: 1.2 })
  crownDiameter: number;

  @ApiProperty({ example: 8 })
  healthScore: number;

  @ApiProperty({ enum: TreeStatus })
  previousStatus: TreeStatus;

  @ApiProperty({ enum: TreeStatus })
  newStatus: TreeStatus;

  @ApiProperty({ example: 'disease' })
  statusReason: string;

  @ApiProperty({ example: 'Tree showing good growth' })
  notes: string;

  @ApiProperty({ example: 'measurement' })
  recordType: string;

  @ApiProperty({ example: 1 })
  recordedById: number;

  @ApiProperty({ example: 'John Doe' })
  recordedByName: string;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  createdAt: string;
}

export class TreeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'tree_abc123' })
  uid: string;

  @ApiProperty({ example: 1 })
  interventionId: number;

  @ApiProperty({ example: 'INT-2024-001' })
  interventionHid: string;

  @ApiProperty({ example: 1 })
  scientificSpeciesId: number;

  @ApiProperty({ example: 'Mangifera indica' })
  scientificName: string;

  @ApiProperty({ example: 'Mango' })
  commonName: string;

  @ApiProperty({ example: 'TR-001' })
  tag: string;

  @ApiProperty({ example: 'sample' })
  type: string;

  @ApiProperty({ example: 19.0760 })
  latitude: number;

  @ApiProperty({ example: 72.8777 })
  longitude: number;

  @ApiProperty({ example: 100.5 })
  altitude: number;

  @ApiProperty({ example: 5.0 })
  accuracy: number;

  @ApiProperty({ example: 2.5 })
  currentHeight: number;

  @ApiProperty({ example: 0.35 })
  currentDiameter: number;

  @ApiProperty({ enum: TreeStatus })
  status: TreeStatus;

  @ApiProperty({ example: '2024-01-15' })
  plantingDate: string;

  @ApiProperty({ example: '2024-06-15T09:00:00Z' })
  lastMeasurementDate: string;

  @ApiProperty({ example: 1 })
  createdById: number;

  @ApiProperty({ example: 'John Doe' })
  createdByName: string;

  @ApiProperty({ type: [TreeRecordResponseDto] })
  records: TreeRecordResponseDto[];

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  updatedAt: string;
}

// src/modules/trees/dto/bulk-tree-import.dto.ts
export class BulkTreeImportDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;

  @ApiProperty({ example: 1 })
  @IsNumber()
  interventionId: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  validateOnly?: boolean = false;
}

export class BulkTreeImportResultDto {
  @ApiProperty({ example: 100 })
  totalRecords: number;

  @ApiProperty({ example: 95 })
  successCount: number;

  @ApiProperty({ example: 5 })
  errorCount: number;

  @ApiProperty({ example: ['Row 3: Invalid coordinates', 'Row 7: Missing species'] })
  errors: string[];

  @ApiProperty({ example: ['tree_001', 'tree_002'] })
  successfulIds: string[];
}

// src/modules/trees/dto/tree-stats.dto.ts
export class TreeStatsDto {
  @ApiProperty({ example: 150 })
  totalTrees: number;

  @ApiProperty({ example: { alive: 140, dead: 8, unknown: 2 } })
  statusBreakdown: Record<string, number>;

  @ApiProperty({ example: { sample: 15, regular: 135 } })
  typeBreakdown: Record<string, number>;

  @ApiProperty({ example: { 'Mangifera indica': 50, 'Ficus benghalensis': 30 } })
  speciesBreakdown: Record<string, number>;

  @ApiProperty({ example: 2.3 })
  averageHeight: number;

  @ApiProperty({ example: 0.25 })
  averageDiameter: number;

  @ApiProperty({ example: 93.3 })
  survivalRate: number;

  @ApiProperty({ example: 45 })
  treesWithRecords: number;

  @ApiProperty({ example: 120 })
  totalRecords: number;

  @ApiProperty({ example: '2024-06-15T09:00:00Z' })
  lastMeasurement: string;
}