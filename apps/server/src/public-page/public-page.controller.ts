import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { IpRateLimit, IpRateLimitGuard } from '../common/guards/ip-rate-limit.guard';
import { ErrorResponse, SuccessResponse } from '../common/interfaces/response.interface';
import { ResponseUtil } from '../common/utils/response.util';
import { PublicPageService } from './public-page.service';
import { PublicProjectPage } from './public-page.types';

/**
 * The shareable public project page.
 *
 * Unauthenticated and uncached by the client, but the Next.js page in front of
 * it serves a statically regenerated copy, so this endpoint sees one request
 * per revalidation rather than one per visitor. The per-IP cap is the backstop
 * for anyone hitting it directly.
 *
 * Not to be confused with the two other public surfaces:
 * `/api/external/*` returns legacy-shaped intervention data, and
 * `/api/v1/public/*` is per-project API-key access.
 */
@ApiTags('Public page')
@Controller('public-page')
@Public()
@UseGuards(IpRateLimitGuard)
@IpRateLimit({ limit: 60, windowMs: 60 * 1000, name: 'public-page' })
export class PublicPageController {
  constructor(private readonly publicPageService: PublicPageService) {}

  @Get(':slugOrUid')
  @ApiOperation({ summary: 'Aggregate data for a project public page (public)' })
  @SwaggerApiResponse({ status: 200, description: 'Returns everything the public page renders' })
  @SwaggerApiResponse({ status: 404, description: 'No project, or its public page is switched off' })
  async getPublicPage(
    @Param('slugOrUid') slugOrUid: string,
  ): Promise<SuccessResponse<PublicProjectPage> | ErrorResponse> {
    try {
      const data = await this.publicPageService.getPublicPage(slugOrUid);
      return ResponseUtil.fetched(data, 'Public page retrieved successfully', 'public_page_fetched');
    } catch (error: any) {
      // A project whose page is off answers exactly like one that does not
      // exist, so the endpoint cannot be used to enumerate private projects.
      if (error?.status === 404) {
        return ResponseUtil.notFound('Project not found', null, 'project_not_found');
      }
      throw error;
    }
  }
}
