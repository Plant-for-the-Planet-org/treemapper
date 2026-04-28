import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from "class-validator";

export class SearchSpeciesQueryDto {

  @IsString()
  @IsNotEmpty()
  name: string;


  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
