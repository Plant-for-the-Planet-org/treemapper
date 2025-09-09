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
  HttpException,
  HttpStatus,
  Patch,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { InterventionsService, PaginatedInterventionsResponse, TransferInterventionOwnershipDto } from './interventions.service';
import {
  CreateInterventionDto,
  InterventionResponseDto,
  CreateInterventionBulkDto,
  GetProjectInterventionsQueryDto,
  GetProjectInterventionsResponseDto,
  UpdateInterventionSpeciesDto,
} from './dto/interventions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust import path
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard'; // Adjust import path
import { ProjectRoles } from 'src/projects/decorators/project-roles.decorator';
import { Membership } from 'src/projects/decorators/membership.decorator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { CurrentUser } from 'src/auth/current-user.decorator';



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


  @Get('/projects/:id/member/:interventionId/owner')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async getMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() req: any,
  ) {
    const requesterId = req.user?.id || req.user?.sub;
    if (!requesterId) {
      throw new BadRequestException('User authentication required');
    }

    const member = await this.interventionsService.searchProjectMembers(
      projectId,
      userId,
    );

    if (!member) {
      throw new BadRequestException('Member not found in this project');
    }

    return member;
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


  @Put(':interventionId/:id/owner')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async transferOwnership(
    @Param('interventionId', ParseIntPipe) interventionId: number,
    @Body() transferDto: TransferInterventionOwnershipDto,
    @CurrentUser() req: any, // Replace with your user request type
  ): Promise<any> {
    // Validate intervention ID
    if (interventionId <= 0) {
      throw new BadRequestException('Intervention ID must be greater than 0');
    }

    // Extract user ID from request (adjust based on your auth implementation)
    const requesterId = req.user?.id || req.user?.sub;
    if (!requesterId) {
      throw new BadRequestException('User authentication required');
    }

    return await this.interventionsService.transferInterventionOwnership(
      interventionId,
      transferDto,
      requesterId,
    );
  }


  @Put(':interventionId/:id/:speciesId')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async updateInterventionSpecies(
    @Param('interventionId') interventionId: string,
    @Param('speciesId') speciesId: string,
    @Body() updateDto: UpdateInterventionSpeciesDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.interventionsService.updateInterventionSpecies(
        interventionId,
        speciesId,
        updateDto,
        user.id,
      );
      return {
        success: true,
        message: 'Intervention species updated successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle tree count exceeded error
      if (error.code === 'TREE_COUNT_EXCEEDS_SPECIES_COUNT') {
        throw new HttpException(
          {
            error: error.code,
            message: error.message,
            currentTreeCount: error.currentTreeCount,
            requestedSpeciesCount: error.requestedSpeciesCount,
            treeHids: error.treeHids,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id/:interventionId')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async deleteMyIntervention(@Param('interventionId') interventionId: string, @Membership() membership: ProjectGuardResponse,) {
    const data = await this.interventionsService.deleteMyIntervention(interventionId);
    return data
  }


  @Get(':id/map/all')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async getProjectMap(req: any, res: any, @Membership() membership: ProjectGuardResponse,) {
    const data = await this.interventionsService.getProjectMapInterventions(membership.projectId);
    return data
  }

  @Get(':id/map/tree')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async getInterventionTrees(req: any, res: any, @Membership() membership: ProjectGuardResponse,) {
    try {
      const { interventionId } = req.params;

      if (!interventionId || isNaN(Number(interventionId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid intervention ID is required',
        });
      }

      const data = await this.interventionsService.getInterventionTrees(membership.projectId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error fetching intervention trees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tree data',
      });
    }
  }

}