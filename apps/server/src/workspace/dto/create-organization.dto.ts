import { IsString, IsOptional, IsEmail, IsUrl, Length, IsHexColor, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNewWorkspaceDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'Forest Conservation Society',
    minLength: 2,
    maxLength: 255
  })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Forest Conservation Society',
    minLength: 2,
    maxLength: 255
  })
  @IsString()
  @Length(2, 255)
  type: 'private' | 'public' | 'platform' | 'development' | 'premium';
}
