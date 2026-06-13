import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { ProjectRoles } from 'src/projects/decorators/project-roles.decorator';
import { Membership } from 'src/projects/decorators/membership.decorator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { MonitoringPlotsService } from './monitoring-plots.service';
import {
  CreateMonitoringPlotDto,
  CreatePlotGroupDto,
  MonitoringPlotUploadResponseDto,
  UploadRemeasurementsDto,
  AddPlotPlantsDto,
  UpdateMonitoringPlotDto,
  UpdatePlotGroupDto,
} from './dto/monitoring-plots.dto';

@ApiTags('Monitoring Plots')
@ApiBearerAuth()
@Controller('monitoring-plots')
@UseGuards(JwtAuthGuard)
export class MonitoringPlotsController {
  constructor(private readonly monitoringPlotsService: MonitoringPlotsService) {}

  @Post('projects/:projectId/upload')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Upload a single offline monitoring plot from mobile' })
  @ApiResponse({ status: 201, description: 'Monitoring plot uploaded', type: MonitoringPlotUploadResponseDto })
  async uploadPlot(
    @Body() dto: CreateMonitoringPlotDto,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<MonitoringPlotUploadResponseDto> {
    return this.monitoringPlotsService.uploadMonitoringPlot(dto, membership);
  }

  @Post('projects/:projectId/upload/bulk')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Bulk upload offline monitoring plots from mobile' })
  @ApiResponse({ status: 201, description: 'Batch processed (per-plot results returned)' })
  async bulkUploadPlots(
    @Body() dtos: CreateMonitoringPlotDto[],
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.monitoringPlotsService.bulkUploadMonitoringPlots(dtos, membership);
  }

  @Post('projects/:projectId/remeasure')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Upload remeasurements for already-synced plot plants' })
  @ApiResponse({ status: 201, description: 'Remeasurements processed (per-tree results returned)' })
  async remeasure(
    @Body() dto: UploadRemeasurementsDto,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.monitoringPlotsService.addRemeasurements(dto, membership);
  }

  @Post('projects/:projectId/plants')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Add new plants to an already-uploaded plot' })
  @ApiResponse({ status: 201, description: 'Plants added (per-plant tree identities returned)' })
  async addPlants(
    @Body() dto: AddPlotPlantsDto,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.monitoringPlotsService.addPlotPlants(dto, membership);
  }

  @Post('projects/:projectId/groups')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Create a plot group and attach uploaded plots' })
  @ApiResponse({ status: 201, description: 'Plot group created/updated' })
  async createGroup(
    @Body() dto: CreatePlotGroupDto,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.monitoringPlotsService.createPlotGroup(dto, membership);
  }

  @Get('projects/:projectId')
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'List monitoring plots for a project' })
  @ApiResponse({ status: 200, description: 'Returns the project monitoring plots' })
  async listPlots(@Membership() membership: ProjectGuardResponse) {
    return this.monitoringPlotsService.listProjectPlots(membership.projectId);
  }

  @Get('projects/:projectId/plots/:plotUid')
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Get full detail of a single monitoring plot' })
  @ApiResponse({ status: 200, description: 'Returns plot detail with plants, timelines and observations' })
  async getPlotDetail(
    @Param('plotUid') plotUid: string,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.monitoringPlotsService.getPlotDetail(membership.projectId, plotUid);
  }

  @Patch('projects/:projectId/plots/:plotUid')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Update a monitoring plot\'s metadata' })
  @ApiResponse({ status: 200, description: 'Returns the refreshed plot detail' })
  async updatePlot(
    @Param('plotUid') plotUid: string,
    @Body() dto: UpdateMonitoringPlotDto,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.monitoringPlotsService.updatePlot(membership.projectId, plotUid, dto, membership);
  }

  @Delete('projects/:projectId/plots/:plotUid')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Delete a monitoring plot (soft delete)' })
  @ApiResponse({ status: 200, description: 'Plot deleted' })
  async deletePlot(
    @Param('plotUid') plotUid: string,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.monitoringPlotsService.deletePlot(membership.projectId, plotUid, membership);
  }

  @Get('projects/:projectId/groups')
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'List a project\'s plot groups with their member plots' })
  @ApiResponse({ status: 200, description: 'Returns the project plot groups' })
  async listGroups(@Membership() membership: ProjectGuardResponse) {
    return this.monitoringPlotsService.listProjectGroups(membership.projectId);
  }

  @Patch('projects/:projectId/groups/:groupUid')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Rename a plot group and/or set its member plots' })
  @ApiResponse({ status: 200, description: 'Group updated' })
  async updateGroup(
    @Param('groupUid') groupUid: string,
    @Body() dto: UpdatePlotGroupDto,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.monitoringPlotsService.updateGroup(membership.projectId, groupUid, dto, membership);
  }

  @Delete('projects/:projectId/groups/:groupUid')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Delete a plot group (soft delete; member plots untouched)' })
  @ApiResponse({ status: 200, description: 'Group deleted' })
  async deleteGroup(
    @Param('groupUid') groupUid: string,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.monitoringPlotsService.deleteGroup(membership.projectId, groupUid);
  }
}
