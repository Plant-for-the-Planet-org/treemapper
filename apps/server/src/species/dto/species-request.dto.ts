import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from './common.dto';

export class CreateSpeciesRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  scientificName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  commonName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  requestReason: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  gbifId?: string;
}

export class SpeciesRequestFilterDto extends PaginationDto {
  @ApiProperty({ required: false, enum: ['pending', 'approved', 'rejected'] })
  @IsOptional()
  @IsString()
  status?: 'pending' | 'approved' | 'rejected';
}

