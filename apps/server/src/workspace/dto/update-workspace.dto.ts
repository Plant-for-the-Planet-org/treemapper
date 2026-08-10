import { IsOptional, IsString, IsEmail, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Body for PATCH /workspace/:uid. Only presentation/contact fields are
 * editable here. Notably `type` (workspace tier: platform/private/development/
 * premium) is intentionally NOT included -- changing the tier is a privileged
 * operation and must never be settable through the member-facing update route.
 * Used with ValidationPipe({ whitelist: true }) so any other property (e.g.
 * `type`, `isActive`, `settings`) is stripped before it reaches the service.
 */
export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ description: 'Display name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'URL slug (lowercase letters, digits, hyphens; min length 3)' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug may only contain lowercase letters, digits, and hyphens' })
  slug?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  website?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Primary brand color' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  secondaryColor?: string;
}
