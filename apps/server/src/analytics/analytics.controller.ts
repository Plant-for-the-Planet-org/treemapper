// src/analytics/analytics.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Body,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { ProjectRoles } from '../projects/decorators/project-roles.decorator';
import { AnalyticsService, RecentAdditionsResponse, ProjectAnalyticsDto, ProjectKPIsResponse, PlantingOverviewDto, PlantingOverviewResponse, RecentAdditionsDto } from './analytics.service';
import { Membership } from 'src/projects/decorators/membership.decorator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { InterventionExportDto, InterventionExportResponse } from './dto/analytics.dto';

export enum TimeInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}


@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('planting-overview/:id')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getPlantingOverview(@Query() dto: PlantingOverviewDto, @Membership() membership: any,
  ): Promise<PlantingOverviewResponse> {
    return this.analyticsService.getPlantingOverview(dto, membership.projectId);
  }

  @Get('recent-additions/:id')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getRecentAdditions(@Query() dto: RecentAdditionsDto, @Membership() membership: any): Promise<RecentAdditionsResponse> {
    return this.analyticsService.getRecentAdditions(dto, membership.projectId);
  }

  @Get('project-kpis/:id')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getProjectKPIs(@Query() dto: ProjectAnalyticsDto, @Membership() membership: any,
  ): Promise<ProjectKPIsResponse> {
    return this.analyticsService.getProjectKPIs(dto, membership.projectId);
  }


  @Get(':id/map')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getProjectMapData(@Membership() membership: any): Promise<any> {
    return this.analyticsService.getProjectMapData(membership.projectId);
  }

  
  // @Post('/:id/export')
  // @ProjectRoles('owner', 'admin')
  // @UseGuards(ProjectPermissionsGuard)
  // async exportInterventionData(
  //   @Body(ValidationPipe) dto: InterventionExportDto,
  //   @Req() req: Request,
  //   @Membership() membership: any
  // ): Promise<InterventionExportResponse> {

  //   return this.analyticsService.exportInterventionData(
  //     dto,
  //     membership.projectId
  //   );
  // }
}
