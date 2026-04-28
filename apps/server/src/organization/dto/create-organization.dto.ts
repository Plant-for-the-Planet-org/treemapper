import { IsString, IsOptional, IsEmail, IsUrl, Length, IsHexColor, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'Forest Conservation Society',
    minLength: 2,
    maxLength: 255
  })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiPropertyOptional({
    description: 'Organization description',
    example: 'A non-profit organization dedicated to forest conservation and reforestation efforts.'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Organization logo URL',
    example: 'https://example.com/logo.png'
  })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Primary brand color (hex)',
    example: '#2E8B57'
  })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Secondary brand color (hex)',
    example: '#90EE90'
  })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiPropertyOptional({
    description: 'Organization email',
    example: 'contact@forestconservation.org'
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @ApiPropertyOptional({
    description: 'Organization phone number',
    example: '+1-555-123-4567'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Organization website',
    example: 'https://forestconservation.org'
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Organization address',
    example: '123 Forest Lane, Green Valley, CA 90210'
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US'
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @ApiPropertyOptional({
    description: 'Organization timezone',
    example: 'America/Los_Angeles'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
