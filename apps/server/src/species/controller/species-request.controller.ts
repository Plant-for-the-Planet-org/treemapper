import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SpeciesRequestService } from '../services/species-request.service';
import { CreateSpeciesRequestDto, SpeciesRequestFilterDto, ReviewSpeciesRequestDto } from '../dto/species-request.dto';
import { ProjectPermissionsGuard } from '../../projects/guards/project-permissions.guard';
import { WorkspaceSpeciesApprovalGuard } from '../guards/workspace-species-approval.guard';
import { WorkspacePermissionsGuard } from '../../workspace/workspace-permissions.guard';
import { ProjectRoles } from '../../projects/decorators/project-roles.decorator';
import { ProjectPermissions } from '../../projects/decorators/project-permissions.decorator';
import { Membership } from 'src/projects/decorators/membership.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { ProjectGuardResponse } from '../../projects/projects.service';

@ApiTags('Species Requests')
@Controller('species-requests')
export class SpeciesRequestController {
  constructor(private readonly speciesRequestService: SpeciesRequestService) { }

  @Post('/:id')
  @ProjectRoles('owner', 'admin', 'contributor')
  @ProjectPermissions('request_species')
  @UseGuards(ProjectPermissionsGuard)
  async createRequest(
    @Body() createDto: CreateSpeciesRequestDto,
    @Membership() membership: any,
  ) {
    return this.speciesRequestService.createRequest(
      membership.userId,
      membership.projectId,
      createDto,
    );
  }

  @Get('projects/:id/queue')
  @ApiOperation({ summary: 'Get species requests (pending + history) for a project' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @UseGuards(WorkspaceSpeciesApprovalGuard)
  async getProjectQueue(
    @Membership() membership: ProjectGuardResponse,
    @Query() filterDto: SpeciesRequestFilterDto,
  ) {
    return this.speciesRequestService.getProjectRequests(membership.projectId, filterDto);
  }

  @Get('workspaces/:uid/queue')
  @ApiOperation({ summary: 'Get species requests across all projects in a workspace' })
  @ApiParam({ name: 'uid', description: 'Workspace UID' })
  @UseGuards(WorkspacePermissionsGuard)
  async getWorkspaceQueue(
    @Query() filterDto: SpeciesRequestFilterDto,
    @Req() req: any,
  ) {
    return this.speciesRequestService.getWorkspaceRequests(req.workspace.id, filterDto);
  }

  @Post('projects/:id/:requestUid/review')
  @ApiOperation({ summary: 'Approve or reject a species request (workspace admin only)' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'requestUid', description: 'Species request UID' })
  @UseGuards(WorkspaceSpeciesApprovalGuard)
  async reviewRequest(
    @Param('requestUid') requestUid: string,
    @Body() dto: ReviewSpeciesRequestDto,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ) {
    const adminId = user.id || user.sub;
    return this.speciesRequestService.reviewRequest(requestUid, adminId, membership.projectId, dto);
  }
}
