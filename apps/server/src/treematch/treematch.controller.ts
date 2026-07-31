import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { ProjectRoles } from '../projects/decorators/project-roles.decorator';
import { Membership } from '../projects/decorators/membership.decorator';
import { ProjectGuardResponse } from '../projects/projects.service';
import { TreeMatchService } from './treematch.service';
import {
  CreateMatchesDto,
  GetTreeMatchContributionsQueryDto,
  GetTreeMatchInterventionsQueryDto,
  SetContributionIgnoreDto,
} from './dto/treematch.dto';

// Matching contributions to plant locations is a restoration-organisation admin
// task, so every route is owner/admin only.
@UseGuards(JwtAuthGuard)
@Controller('treematch')
export class TreeMatchController {
  constructor(private readonly treeMatchService: TreeMatchService) {}

  @Get('/projects/:id/interventions')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getInterventions(
    @Membership() membership: ProjectGuardResponse,
    @Query() query: GetTreeMatchInterventionsQueryDto,
  ) {
    return this.treeMatchService.getInterventions(membership.projectId, query);
  }

  @Get('/projects/:id/contributions')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getContributions(
    @Membership() membership: ProjectGuardResponse,
    @Query() query: GetTreeMatchContributionsQueryDto,
  ) {
    return this.treeMatchService.getContributions(membership.projectId, query);
  }

  // 200 (not 201): the allocation rows are an internal detail, and the useful
  // answer is the absolute totals TTC applied.
  //
  // The locations may belong to other projects the caller administers, so the
  // service authorizes each of them; the guard only covers the path project.
  @Post('/projects/:id/matches')
  @HttpCode(200)
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async createMatches(
    @Membership() membership: ProjectGuardResponse,
    @Body() dto: CreateMatchesDto,
  ) {
    return this.treeMatchService.createMatches(
      membership.projectId,
      membership.userId,
      dto,
    );
  }

  // :contributionId is TTC's ProjectContribution id, the only id the web has.
  @Patch('/projects/:id/contributions/:contributionId/ignore')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async setContributionIgnore(
    @Param('contributionId', ParseIntPipe) contributionId: number,
    @Body() dto: SetContributionIgnoreDto,
  ) {
    return this.treeMatchService.setContributionIgnore(contributionId, dto);
  }
}
