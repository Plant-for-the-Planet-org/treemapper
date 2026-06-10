import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { Public } from 'src/auth/public.decorator';
import { ExternalService } from './external.service';
import { SuccessResponse, ErrorResponse } from '../common/interfaces/response.interface';
import { ResponseUtil } from '../common/utils/response.util';
import { IpRateLimit, IpRateLimitGuard } from '../common/guards/ip-rate-limit.guard';

@ApiTags('External')
@Controller('external')
@Public()
// Public, read-only and unauthenticated: cap per-IP traffic so it cannot be
// used to scrape or to hammer the dyno during a live event.
@UseGuards(IpRateLimitGuard)
@IpRateLimit({ limit: 30, windowMs: 60 * 1000, name: 'external' })
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  @Get('project/:projectUid/interventions')
  @ApiOperation({ summary: 'Get all interventions for a project (public)' })
  @SwaggerApiResponse({ status: 200, description: 'Returns all interventions in legacy format' })
  @SwaggerApiResponse({ status: 404, description: 'Project not found' })
  async getProjectInterventions(
    @Param('projectUid') projectUid: string,
  ): Promise<SuccessResponse<any[]> | ErrorResponse> {
    try {
      const data = await this.externalService.getProjectInterventions(projectUid);
      return ResponseUtil.fetched(data, 'Interventions retrieved successfully', 'interventions_fetched');
    } catch (error: any) {
      if (error.status === 404) {
        return ResponseUtil.notFound('Project not found', null, 'project_not_found');
      }
      throw error;
    }
  }
}
