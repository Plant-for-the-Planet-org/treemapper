import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/auth/public.decorator';
import { ExternalService } from './external.service';

@ApiTags('External')
@Controller('external')
@Public()
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  @Get('project/:projectUid/interventions')
  @ApiOperation({ summary: 'Get all interventions for a project (public)' })
  @ApiResponse({ status: 200, description: 'Returns all interventions in legacy format' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectInterventions(
    @Param('projectUid') projectUid: string,
  ): Promise<any[]> {
    return this.externalService.getProjectInterventions(projectUid);
  }
}
