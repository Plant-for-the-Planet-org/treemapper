import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserSpeciesDto {
  @ApiProperty({ description: 'ID of the global species' })
  @IsUUID()
  speciesId: string;

  @ApiPropertyOptional({ description: 'Local name for this species' })
  @IsOptional()
  @IsString()
  localName?: string;

  @ApiPropertyOptional({ description: 'Custom image URL for this species' })
  @IsOptional()
  @IsString()
  customImage?: string;

  @ApiPropertyOptional({ description: 'Personal notes about this species' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata for user species' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}