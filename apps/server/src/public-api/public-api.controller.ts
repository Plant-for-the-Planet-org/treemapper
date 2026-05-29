import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiProject, ApiProjectContext } from './decorators/api-project.decorator';
import { PublicApiService } from './public-api.service';

@ApiTags('Public API')
@ApiSecurity('x-api-key')
@Controller('v1/public')
@Public()
@UseGuards(ApiKeyGuard)
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Get('project')
  @ApiOperation({ summary: 'Get the authenticated project information' })
  @ApiResponse({ status: 200, description: 'Project information' })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key' })
  @ApiResponse({ status: 403, description: 'API access disabled for this project' })
  getProject(@ApiProject() apiProject: ApiProjectContext) {
    return this.publicApiService.getProject(apiProject.id);
  }

  @Get('sites')
  @ApiOperation({ summary: 'Get all sites for the authenticated project' })
  @ApiResponse({ status: 200, description: 'List of sites' })
  getSites(@ApiProject() apiProject: ApiProjectContext) {
    return this.publicApiService.getSites(apiProject.id);
  }

  @Get('interventions')
  @ApiOperation({ summary: 'Get all interventions for the authenticated project' })
  @ApiResponse({ status: 200, description: 'List of interventions' })
  getInterventions(@ApiProject() apiProject: ApiProjectContext) {
    return this.publicApiService.getInterventions(apiProject.uid);
  }
}
