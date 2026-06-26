import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsInt, MaxLength, IsArray, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './common.dto';

export class CreateUserSpeciesDto {
  @IsNotEmpty()
  @IsInt()
  scientificSpeciesId: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  aliases?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  commonName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsBoolean()
  favourite?: boolean = false;


  @IsBoolean()
  isNativeSpecies?: boolean = false;

  @IsBoolean()
  isDisbaledSpecies?: boolean = false;

}

export class UpdateUserSpeciesDto {

  @IsOptional()
  @IsString()
  @MaxLength(255)
  aliases?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  commonName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  favourite?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isNativeSpecies?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isDisbaledSpecies?: boolean = false;

}

export class AssignUnknownSpeciesDto {
  // The known scientific species to assign the unknown records to.
  @IsNotEmpty()
  @IsInt()
  scientificSpeciesId: number;

  // UIDs of the unknown `intervention_species` rows to reassign.
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  interventionSpeciesUids: string[];

  // Optional common name override; defaults to the scientific species' common name.
  @IsOptional()
  @IsString()
  @MaxLength(255)
  commonName?: string;
}

export class UserSpeciesFilterDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  favouriteOnly?: boolean;
}
