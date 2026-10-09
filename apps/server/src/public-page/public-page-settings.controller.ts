import { BadRequestException, Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectRoles } from '../projects/decorators/project-roles.decorator';
import { Membership } from '../projects/decorators/membership.decorator';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import type { ProjectGuardResponse } from '../projects/projects.service';
import { ErrorResponse, SuccessResponse } from '../common/interfaces/response.interface';
import { ResponseUtil } from '../common/utils/response.util';
import { PublicPageSettingsDto } from './dto/public-page-settings.dto';
import { PublicPageService } from './public-page.service';
import { PUBLIC_PAGE_THEMES, PublicPageSettings, PublicPageTheme, PublicProjectPage } from './public-page.types';

/**
 * Reading and changing a project's public page settings.
 *
 * A separate controller from `PublicPageController` on purpose: that one is
 * `@Public()` at the class level, and hanging an authenticated write off it
 * would be one decorator away from publishing a write endpoint to the open
 * internet.
 *
 * Owner or admin only. Turning this on puts a project's work on a public URL
 * that search engines will index, which is not a contributor's decision to
 * make.
 */
@ApiTags('Public page')
@Controller('projects/:id/public-page')
export class PublicPageSettingsController {
  constructor(private readonly publicPageService: PublicPageService) {}

  @Get('settings')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: "Read a project's public page settings" })
  async getSettings(
    @Membership() membership: ProjectGuardResponse,
  ): Promise<SuccessResponse<PublicPageSettings> | ErrorResponse> {
    const settings = await this.publicPageService.getSettings(membership.projectId);
    return ResponseUtil.fetched(settings, 'Public page settings retrieved', 'public_page_settings_fetched');
  }

  @Patch('settings')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: "Change a project's public page settings" })
  @SwaggerApiResponse({ status: 200, description: 'Returns the settings as stored' })
  async updateSettings(
    @Membership() membership: ProjectGuardResponse,
    @Body() dto: PublicPageSettingsDto,
  ): Promise<SuccessResponse<PublicPageSettings> | ErrorResponse> {
    const settings = await this.publicPageService.updateSettings(membership.projectId, dto);
    return ResponseUtil.updated(settings, 'Public page settings updated', 'public_page_settings_updated');
  }

  /**
   * The public page payload for someone allowed to see it before it is public.
   *
   * This is the protected half of the preview. The rendered page lives at
   * `/preview/:projectUid/:theme` in the web app, outside the public `/p/`
   * namespace, precisely so that it goes through this guard rather than
   * through the unauthenticated read.
   *
   * It ignores the `enabled` flag, which is what makes a preview useful: the
   * point is to look at the page before publishing it.
   */
  @Get('preview')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Render data for a public page preview (owner or admin)' })
  @SwaggerApiResponse({ status: 200, description: 'The page payload, whether or not it is published' })
  @SwaggerApiResponse({ status: 403, description: 'Not an owner or admin of this project' })
  async getPreview(
    @Membership() membership: ProjectGuardResponse,
    @Query('theme') theme?: string,
  ): Promise<SuccessResponse<PublicProjectPage> | ErrorResponse> {
    if (theme && !PUBLIC_PAGE_THEMES.includes(theme as PublicPageTheme)) {
      throw new BadRequestException(`Unknown theme. Expected one of: ${PUBLIC_PAGE_THEMES.join(', ')}`);
    }

    const data = await this.publicPageService.getPreview(
      membership.projectId,
      theme as PublicPageTheme | undefined,
    );
    return ResponseUtil.fetched(data, 'Preview retrieved', 'public_page_preview_fetched');
  }
}
