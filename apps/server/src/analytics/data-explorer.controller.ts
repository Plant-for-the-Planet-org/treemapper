// src/analytics/data-explorer.controller.ts
//
// Read-only routes for the Data Explorer page. Every route carries the project
// uid as :projectUid, which is what ProjectPermissionsGuard resolves the
// membership from, and @Membership() then hands the numeric project id to the
// service.

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { ProjectRoles } from '../projects/decorators/project-roles.decorator';
import { Membership } from '../projects/decorators/membership.decorator';
import { ProjectGuardResponse } from '../projects/projects.service';
import { DataExplorerService } from './data-explorer.service';
import {
  DateRangeQueryDto,
  TreesPlantedQueryDto,
  SpeciesPlantedQueryDto,
  MapInterventionsQueryDto,
  DataExplorerSummary,
  TreesPlantedResponse,
  SpeciesPlantedResponse,
  MapSiteFeature,
  MapInterventionFeature,
  MapInterventionDetail,
  FeatureCollectionOf,
} from './dto/data-explorer.dto';

const queryPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: false,
});

@Controller('data-explorer')
@UseGuards(JwtAuthGuard)
export class DataExplorerController {
  constructor(private readonly dataExplorerService: DataExplorerService) { }

  @Get(':projectUid/summary')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getSummary(
    @Query(queryPipe) dto: DateRangeQueryDto,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<DataExplorerSummary> {
    return this.dataExplorerService.getSummary(membership.projectId, dto);
  }

  @Get(':projectUid/trees-planted')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getTreesPlanted(
    @Query(queryPipe) dto: TreesPlantedQueryDto,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<TreesPlantedResponse> {
    return this.dataExplorerService.getTreesPlanted(membership.projectId, dto);
  }

  @Get(':projectUid/species-planted')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getSpeciesPlanted(
    @Query(queryPipe) dto: SpeciesPlantedQueryDto,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<SpeciesPlantedResponse> {
    return this.dataExplorerService.getSpeciesPlanted(membership.projectId, dto);
  }

  @Get(':projectUid/map/species')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getMapSpecies(
    @Membership() membership: ProjectGuardResponse,
  ): Promise<{ data: string[] }> {
    return this.dataExplorerService.getMapSpecies(membership.projectId);
  }

  @Get(':projectUid/map/sites')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getMapSites(
    @Membership() membership: ProjectGuardResponse,
  ): Promise<FeatureCollectionOf<MapSiteFeature>> {
    return this.dataExplorerService.getMapSites(membership.projectId);
  }

  @Get(':projectUid/map/interventions')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getMapInterventions(
    @Query(queryPipe) dto: MapInterventionsQueryDto,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<FeatureCollectionOf<MapInterventionFeature>> {
    return this.dataExplorerService.getMapInterventions(membership.projectId, dto);
  }

  @Get(':projectUid/map/interventions/:interventionUid')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getMapInterventionDetail(
    @Param('interventionUid') interventionUid: string,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<MapInterventionDetail> {
    return this.dataExplorerService.getMapInterventionDetail(
      membership.projectId,
      interventionUid,
    );
  }
}
