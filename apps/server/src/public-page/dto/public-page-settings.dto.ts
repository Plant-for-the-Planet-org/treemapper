import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  PUBLIC_PAGE_BLOCK_IDS,
  PUBLIC_PAGE_BLOCK_KEY_MAX,
  PUBLIC_PAGE_BLOCK_VARIANT_MAX,
  PUBLIC_PAGE_MAX_BLOCKS,
  PUBLIC_PAGE_SURFACES,
  PUBLIC_PAGE_TEXT_BODY_MAX,
  PUBLIC_PAGE_TEXT_HEADING_MAX,
  PUBLIC_PAGE_THEMES,
  PublicPageBlockId,
  PublicPageSurface,
  PublicPageTheme,
} from '../public-page.types';

/**
 * Words a project writes itself. Plain text only: the page renders it as text
 * nodes, so there is no markup to escape and nothing to sanitise beyond length.
 */
export class PublicPageBlockContentDto {
  @ApiPropertyOptional({ maxLength: PUBLIC_PAGE_TEXT_HEADING_MAX })
  @IsOptional()
  @IsString()
  @MaxLength(PUBLIC_PAGE_TEXT_HEADING_MAX)
  heading?: string;

  @ApiPropertyOptional({ maxLength: PUBLIC_PAGE_TEXT_BODY_MAX })
  @IsOptional()
  @IsString()
  @MaxLength(PUBLIC_PAGE_TEXT_BODY_MAX)
  body?: string;
}

export class PublicPageBlockDto {
  @ApiPropertyOptional({ enum: PUBLIC_PAGE_BLOCK_IDS })
  @IsIn(PUBLIC_PAGE_BLOCK_IDS as unknown as string[])
  id: PublicPageBlockId;

  @ApiPropertyOptional({ description: 'Stable id for this instance of the block.' })
  @IsString()
  @MaxLength(PUBLIC_PAGE_BLOCK_KEY_MAX)
  key: string;

  @ApiPropertyOptional({ description: 'Layout variant. A block it does not recognise falls back.' })
  @IsOptional()
  @IsString()
  @MaxLength(PUBLIC_PAGE_BLOCK_VARIANT_MAX)
  variant?: string;

  @ApiPropertyOptional({ enum: PUBLIC_PAGE_SURFACES })
  @IsOptional()
  @IsIn(PUBLIC_PAGE_SURFACES as unknown as string[])
  surface?: PublicPageSurface;

  @ApiPropertyOptional({ type: PublicPageBlockContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PublicPageBlockContentDto)
  content?: PublicPageBlockContentDto;
}

/**
 * One saved arrangement per theme.
 *
 * A theme left out keeps what is stored. A theme sent as `null` is reset to
 * the theme's own default list, which is why these are nullable rather than
 * only optional: there is no other way to say "stop overriding this".
 */
export class PublicPageLayoutsDto {
  @ApiPropertyOptional({ type: [PublicPageBlockDto], nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PUBLIC_PAGE_MAX_BLOCKS)
  @ValidateNested({ each: true })
  @Type(() => PublicPageBlockDto)
  report?: PublicPageBlockDto[] | null;

  @ApiPropertyOptional({ type: [PublicPageBlockDto], nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PUBLIC_PAGE_MAX_BLOCKS)
  @ValidateNested({ each: true })
  @Type(() => PublicPageBlockDto)
  story?: PublicPageBlockDto[] | null;

  @ApiPropertyOptional({ type: [PublicPageBlockDto], nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PUBLIC_PAGE_MAX_BLOCKS)
  @ValidateNested({ each: true })
  @Type(() => PublicPageBlockDto)
  full?: PublicPageBlockDto[] | null;

  @ApiPropertyOptional({ type: [PublicPageBlockDto], nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PUBLIC_PAGE_MAX_BLOCKS)
  @ValidateNested({ each: true })
  @Type(() => PublicPageBlockDto)
  academy?: PublicPageBlockDto[] | null;
}

/**
 * A partial update. Anything left out keeps its stored value, so turning the
 * page on does not silently reset the theme someone chose last week.
 */
export class PublicPageSettingsDto {
  @ApiPropertyOptional({
    description: 'Whether the public page is live. Off by default on every project.',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: PUBLIC_PAGE_THEMES })
  @IsOptional()
  @IsIn(PUBLIC_PAGE_THEMES as unknown as string[])
  theme?: PublicPageTheme;

  @ApiPropertyOptional({
    description:
      'Name contributors on the page. Off by default: joining a project is not consent to appear on a public URL.',
  })
  @IsOptional()
  @IsBoolean()
  showContributorNames?: boolean;

  @ApiPropertyOptional({
    type: PublicPageLayoutsDto,
    description:
      'Block arrangements, one per theme. Send a theme as null to go back to that theme default.',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PublicPageLayoutsDto)
  layouts?: PublicPageLayoutsDto;
}
