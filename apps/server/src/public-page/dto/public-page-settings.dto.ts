import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { PUBLIC_PAGE_THEMES, PublicPageTheme } from '../public-page.types';

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
}
