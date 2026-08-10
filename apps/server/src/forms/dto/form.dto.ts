import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  ValidateNested,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// These DTOs mirror the frontend form types (apps/web/src/forms/types.ts).
// The whole section/field tree is sent on every save and stored as a jsonb
// blob, so we validate its shape here rather than in normalized tables.

const FIELD_TYPES = ['text', 'number', 'date', 'dropdown', 'checkbox', 'radio'] as const;
const FIELD_VISIBILITIES = ['public', 'private'] as const;
const SITE_ASSIGNMENTS = ['all', 'none', 'specific'] as const;
const INTERVENTION_ASSIGNMENTS = ['all', 'specific'] as const;
// Mirrors interventionTypeEnum in the DB schema. Kept in sync by hand; the
// values that may be targeted by a form's intervention rule.
const INTERVENTION_TYPES = [
  'assisting-seed-rain',
  'control-livestock',
  'direct-seeding',
  'enrichment-planting',
  'fencing',
  'fire-patrol',
  'fire-suppression',
  'firebreaks',
  'generic-tree-registration',
  'grass-suppression',
  'liberating-regenerant',
  'maintenance',
  'marking-regenerant',
  'multi-tree-registration',
  'other-intervention',
  'plot-plant-registration',
  'removal-invasive-species',
  'sample-tree-registration',
  'single-tree-registration',
  'soil-improvement',
  'stop-tree-harvesting',
] as const;
const CONDITION_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
] as const;

export class FormFieldOptionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  label: string;

  @IsString()
  value: string;
}

export class FormConditionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  targetFieldId: string;

  @IsEnum(CONDITION_OPERATORS)
  operator: (typeof CONDITION_OPERATORS)[number];

  @IsString()
  value: string;

  @IsEnum(['show', 'hide'])
  action: 'show' | 'hide';
}

export class FormFieldDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEnum(FIELD_TYPES)
  type: (typeof FIELD_TYPES)[number];

  @IsString()
  label: string;

  @IsString()
  @IsOptional()
  placeholder?: string;

  @IsString()
  @IsOptional()
  helpText?: string;

  @IsBoolean()
  required: boolean;

  // Routes the answer to meta_data.public or meta_data.private on mobile.
  // Optional for back-compat with forms saved before the field existed; those
  // default to private on mobile.
  @IsOptional()
  @IsEnum(FIELD_VISIBILITIES)
  visibility?: (typeof FIELD_VISIBILITIES)[number];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormConditionDto)
  conditions: FormConditionDto[];

  // Type-specific settings; shape depends on `type` and is enforced on the
  // client (the properties panel narrows on field.type before dispatching).
  @IsObject()
  config: Record<string, any>;
}

export class FormSectionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  collapsed: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];
}

export class FormSchemaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormSectionDto)
  sections: FormSectionDto[];
}

export class CreateFormDto {
  @ApiProperty({ description: 'Form name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Form description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Form status', enum: ['draft', 'published'] })
  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: 'draft' | 'published';

  @ApiPropertyOptional({ description: 'Which sites the form applies to', enum: SITE_ASSIGNMENTS })
  @IsOptional()
  @IsEnum(SITE_ASSIGNMENTS)
  siteAssignment?: (typeof SITE_ASSIGNMENTS)[number];

  @ApiPropertyOptional({ description: 'Site uids targeted when siteAssignment = specific', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  siteIds?: string[];

  @ApiPropertyOptional({ description: 'Which intervention types the form applies to', enum: INTERVENTION_ASSIGNMENTS })
  @IsOptional()
  @IsEnum(INTERVENTION_ASSIGNMENTS)
  interventionAssignment?: (typeof INTERVENTION_ASSIGNMENTS)[number];

  @ApiPropertyOptional({ description: 'Intervention types targeted when interventionAssignment = specific', enum: INTERVENTION_TYPES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(INTERVENTION_TYPES, { each: true })
  interventionTypes?: (typeof INTERVENTION_TYPES)[number][];

  @ApiPropertyOptional({ description: 'Sections and fields tree' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FormSchemaDto)
  schema?: FormSchemaDto;
}

export class UpdateFormDto {
  @ApiPropertyOptional({ description: 'Form name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Form description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Form status', enum: ['draft', 'published'] })
  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: 'draft' | 'published';

  @ApiPropertyOptional({ description: 'Which sites the form applies to', enum: SITE_ASSIGNMENTS })
  @IsOptional()
  @IsEnum(SITE_ASSIGNMENTS)
  siteAssignment?: (typeof SITE_ASSIGNMENTS)[number];

  @ApiPropertyOptional({ description: 'Site uids targeted when siteAssignment = specific', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  siteIds?: string[];

  @ApiPropertyOptional({ description: 'Which intervention types the form applies to', enum: INTERVENTION_ASSIGNMENTS })
  @IsOptional()
  @IsEnum(INTERVENTION_ASSIGNMENTS)
  interventionAssignment?: (typeof INTERVENTION_ASSIGNMENTS)[number];

  @ApiPropertyOptional({ description: 'Intervention types targeted when interventionAssignment = specific', enum: INTERVENTION_TYPES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(INTERVENTION_TYPES, { each: true })
  interventionTypes?: (typeof INTERVENTION_TYPES)[number][];

  @ApiPropertyOptional({ description: 'Sections and fields tree' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FormSchemaDto)
  schema?: FormSchemaDto;
}

export class QueryFormsDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['draft', 'published'] })
  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: 'draft' | 'published';
}
