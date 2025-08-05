// src/modules/interventions/interventions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  ParseIntPipe,
  Query,
  Delete,
} from '@nestjs/common';
import { InterventionsService, PaginatedInterventionsResponse } from './interventions.service';
import {
  CreateInterventionDto,
  InterventionResponseDto,
  CreateInterventionBulkDto,
  GetProjectInterventionsQueryDto,
  GetProjectInterventionsResponseDto,
} from './dto/interventions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust import path
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard'; // Adjust import path
import { ProjectRoles } from 'src/projects/decorators/project-roles.decorator';
import { Membership } from 'src/projects/decorators/membership.decorator';
import { ProjectGuardResponse } from 'src/projects/projects.service';


@UseGuards(JwtAuthGuard)
@Controller('interventions')
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) { }

  @Post('/projects/:id/web')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async createNewInterventionWeb(
    @Body() createInterventionDto: any,
    @Membership() membership: any
  ): Promise<InterventionResponseDto> {
    return this.interventionsService.createNewInterventionWeb(createInterventionDto, membership);
  }

  @Get('/projects/:id')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async findAllintervention(
    @Membership() membership: ProjectGuardResponse,
    @Query() queryDto: GetProjectInterventionsQueryDto,
  ): Promise<GetProjectInterventionsResponseDto> {
    return this.interventionsService.getProjectInterventions(membership.projectId, queryDto);
  }


  @Post('/projects/:id/bulk')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async bulkInterventionUpload(
    @Body() interventionData: CreateInterventionBulkDto[],
    @Membership() membership: any
  ): Promise<InterventionResponseDto> {
    return this.interventionsService.bulkInterventionUpload(interventionData, membership);
  }


  // @Delete(':id/:intervention')
  // @ProjectRoles('owner', 'admin', 'contributor')
  // @UseGuards(ProjectPermissionsGuard)
  // async delete(
  //   @Param('intervention') intervention: string,
  //   @Membership() membership: ProjectGuardResponse,
  // ) {
  //   return this.interventionsService.deleteIntervention(intervention, membership);
  // }



}