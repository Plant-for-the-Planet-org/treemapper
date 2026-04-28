import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsBoolean,
  IsEnum,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Species change action for edit operation
 */
export class EditInterventionSpeciesItemDto {
  @IsString()
  @IsOptional()
  uid?: string; // Existing species UID (null/undefined for new species)

  @IsNumber()
  @IsOptional()
  scientificSpeciesId?: number;

  @IsBoolean()
  isUnknown: boolean;

  @IsString()
  @IsOptional()
  speciesName?: string;

  @IsString()
  @IsOptional()
  commonName?: string;

  @IsNumber()
  @Min(1)
  speciesCount: number;

  @IsEnum(['add', 'update', 'remove'])
  action: 'add' | 'update' | 'remove';

  // For removal with trees - reassign trees to this species UID
  @IsString()
  @IsOptional()
  reassignToSpeciesUid?: string;
}

/**
 * Main Edit Intervention DTO
 */
export class EditInterventionDto {
  @IsDateString()
  @IsOptional()
  interventionStartDate?: string;

  @IsDateString()
  @IsOptional()
  interventionEndDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  description?: string;

  @IsOptional()
  geometry?: any; // GeoJSON - will be validated separately

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditInterventionSpeciesItemDto)
  @IsOptional()
  species?: EditInterventionSpeciesItemDto[];

  // null = remove image; undefined = no change
  @ValidateIf((obj) => obj.image !== null && obj.image !== undefined)
  @IsString()
  image?: string | null;

  // null = unassign from site; undefined = no change
  @ValidateIf((obj) => obj.siteUid !== null && obj.siteUid !== undefined)
  @IsString()
  siteUid?: string | null;
}

/**
 * Tree outside polygon error details
 */
export interface TreeOutsidePolygonError {
  treeUid: string;
  treeHid: string;
  speciesName: string;
  location: { lat: number; lng: number };
}

/**
 * Species with registered trees error (for removal validation)
 */
export interface SpeciesWithTreesError {
  speciesUid: string;
  speciesName: string;
  treeCount: number;
  treeHids: string[];
}

/**
 * Species count validation error
 */
export interface SpeciesCountError {
  speciesUid: string;
  speciesName: string;
  currentTreeCount: number;
  requestedCount: number;
}

/**
 * Edit validation error item
 */
export interface EditValidationError {
  code:
    | 'PERMISSION_DENIED'
    | 'INTERVENTION_NOT_FOUND'
    | 'TREES_OUTSIDE_POLYGON'
    | 'SPECIES_HAS_TREES'
    | 'SPECIES_COUNT_TOO_LOW'
    | 'INVALID_SITE'
    | 'INVALID_DATE_RANGE'
    | 'INVALID_GEOMETRY'
    | 'SPECIES_NOT_FOUND';
  message: string;
  details?: TreeOutsidePolygonError[] | SpeciesWithTreesError | SpeciesCountError | any;
}

/**
 * Edit validation result
 */
export interface EditValidationResult {
  valid: boolean;
  errors: EditValidationError[];
}

/**
 * Edit intervention response
 */
export interface EditInterventionResponse {
  success: boolean;
  intervention?: any;
  changedFields?: string[];
  auditLogId?: number;
  error?: EditValidationError;
}
