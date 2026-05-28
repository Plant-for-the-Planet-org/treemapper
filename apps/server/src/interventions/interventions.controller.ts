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
  CreateCustomBulkDto,
  GetProjectInterventionsQueryDto,
  GetProjectInterventionsResponseDto,
  UpdateInterventionSpeciesDto,
  BulkUpdateSpeciesDto,
  BulkUpdateStartDateDto,
  EditTreeDto,
  AddTreeRemeasurementDto,
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
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async createNewInterventionWeb(
    @Body() createInterventionDto: any,
    @Membership() membership: any
  ): Promise<InterventionResponseDto> {
    return this.interventionsService.createNewInterventionWeb(createInterventionDto, membership);
  }

  @Post('/projects/:id/web/plan')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async createPlannedInterventionWeb(
    @Body() dto: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<any> {
    return this.interventionsService.createPlannedInterventionWeb(dto, membership);
  }

  @Get('/projects/:id')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async findAllintervention(
    @Membership() membership: ProjectGuardResponse,
    @Query() queryDto: GetProjectInterventionsQueryDto,
  ): Promise<GetProjectInterventionsResponseDto> {
    return this.interventionsService.getProjectInterventions(
      membership.projectId,
      queryDto,
      membership.role,
      membership.userId,
    );
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

  @Post('/projects/:id/custom-bulk')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async customBulkInterventionUpload(
    @Body() dto: CreateCustomBulkDto,
    @Membership() membership: any
  ): Promise<any> {
    return this.interventionsService.customBulkInterventionUpload(dto, membership);
  }

  @Put(':interventionId/:id')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async editInterventionDetails(
    @Param('interventionId') interventionId: string,
    @Body() transferDto: any,
    @CurrentUser() req: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<any> {
    const requesterId = req.user?.id || req.user?.sub;
    return await this.interventionsService.interventionEdit(
      interventionId,
      transferDto,
      requesterId,
      membership.projectId,
    );
  }


  @Put(':interventionId/:id/owner')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async transferOwnership(
    @Param('interventionId', ParseIntPipe) interventionId: number,
    @Body() transferDto: TransferInterventionOwnershipDto,
    @CurrentUser() req: any, // Replace with your user request type
    @Membership() membership: ProjectGuardResponse,
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
      membership.projectId,
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

  @Put('/projects/:id/species/bulk')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async bulkUpdateInterventionSpecies(
    @Body() dto: BulkUpdateSpeciesDto,
    @Membership() membership: ProjectGuardResponse,
  ) {
    const result = await this.interventionsService.bulkUpdateInterventionSpecies(
      dto,
      membership,
    );
    return {
      success: true,
      message: 'Bulk species update applied successfully',
      data: result,
    };
  }

  @Put('/projects/:id/start-date/bulk')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async bulkUpdateInterventionStartDate(
    @Body() dto: BulkUpdateStartDateDto,
    @Membership() membership: ProjectGuardResponse,
  ) {
    const result = await this.interventionsService.bulkUpdateInterventionStartDate(dto, membership);
    return {
      success: true,
      message: 'Bulk start date update applied successfully',
      data: result,
    };
  }

  @Delete(':id/:interventionId')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async deleteMyIntervention(@Param('interventionId') interventionId: string, @Membership() membership: ProjectGuardResponse,) {
    const data = await this.interventionsService.deleteMyIntervention(interventionId, membership.userId, membership.projectId);
    return data
  }

  /**
   * Comprehensive edit intervention endpoint
   * Allows editing: dates, description, geometry, species, image, site
   */
  @Put(':interventionId/:id/edit')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async editInterventionComprehensive(
    @Param('interventionId') interventionUid: string,
    @Body() editDto: any,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<any> {
    const requesterId = user?.id || user?.sub;
    if (!requesterId) {
      throw new BadRequestException('User authentication required');
    }

    try {
      const result = await this.interventionsService.editInterventionComprehensive(
        interventionUid,
        editDto,
        requesterId,
        membership.projectId,
      );
      return {
        success: true,
        statusCode: 200,
        message: 'Intervention updated successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle validation errors
      if (error.response?.errors) {
        throw new HttpException(
          {
            success: false,
            statusCode: 400,
            message: 'Validation failed',
            errors: error.response.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Failed to update intervention',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Pre-validate edit operation without making changes
   * Returns validation results for frontend preview
   */
  @Post(':interventionId/:id/edit/validate')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async preValidateEdit(
    @Param('interventionId') interventionUid: string,
    @Body() editDto: any,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<any> {
    const requesterId = user?.id || user?.sub;
    if (!requesterId) {
      throw new BadRequestException('User authentication required');
    }

    const result = await this.interventionsService.preValidateInterventionEdit(
      interventionUid,
      editDto,
      requesterId,
      membership.projectId,
    );

    return {
      success: true,
      statusCode: 200,
      data: result,
    };
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
      // Accept interventionId from multiple locations to be resilient:
      // - req.params.interventionId
      // - req.params.id (route param)
      // - req.query.interventionId
      const rawId = req.params?.interventionId ?? req.params?.id ?? req.query?.interventionId;
      const interventionId = Number(rawId);

      if (!interventionId || isNaN(interventionId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid intervention ID is required',
        });
      }

      const data = await this.interventionsService.getInterventionTrees(interventionId);

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

  @Get('trees/:treeHid/:id/records')
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  async getTreeRecords(
    @Param('treeHid') treeHid: string,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<any> {
    try {
      const result = await this.interventionsService.getTreeRecords(
        treeHid,
        membership.projectId,
      );
      return { success: true, statusCode: 200, data: result };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to fetch tree records',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('trees/:treeHid/:id/edit')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async editTreeDetails(
    @Param('treeHid') treeHid: string,
    @Body() editDto: EditTreeDto,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<any> {
    const requesterId = user?.id || user?.sub;
    if (!requesterId) {
      throw new BadRequestException('User authentication required');
    }

    try {
      const result = await this.interventionsService.editTree(
        treeHid,
        editDto,
        membership.projectId,
      );
      return {
        success: true,
        statusCode: 200,
        message: 'Tree updated successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to update tree',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('trees/:treeHid/:id/remeasure')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async addTreeRemeasurement(
    @Param('treeHid') treeHid: string,
    @Body() dto: AddTreeRemeasurementDto,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<any> {
    const requesterId = user?.id || user?.sub;
    if (!requesterId) {
      throw new BadRequestException('User authentication required');
    }

    try {
      const result = await this.interventionsService.addTreeRemeasurement(
        treeHid,
        dto,
        membership.projectId,
        requesterId,
      );
      return {
        success: true,
        statusCode: 201,
        message: 'Remeasurement recorded successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to record remeasurement',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}