import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './common.dto';

export class ScientificSpeciesDto {
  @IsString()
  scientific_name: string;

  @IsString()
  guid: string;
}

export class BulkUploadScientificSpeciesDto {
  @ApiProperty({ type: [ScientificSpeciesDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScientificSpeciesDto)
  species: ScientificSpeciesDto[];
}

export class ScientificSpeciesFilterDto extends PaginationDto {
  // Add any specific filters for scientific species if needed
}
