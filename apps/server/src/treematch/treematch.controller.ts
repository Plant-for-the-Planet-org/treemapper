import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { ProjectRoles } from '../projects/decorators/project-roles.decorator';
import { Membership } from '../projects/decorators/membership.decorator';
import { ProjectGuardResponse } from '../projects/projects.service';
import { TreeMatchService } from './services/treematch.service';
import { TreeMatchRulesService } from './services/treematch-rules.service';
import { TreeMatchAutomatchService } from './services/treematch-automatch.service';
import {
  GetTreeMatchContributionsQueryDto,
  GetTreeMatchInterventionsQueryDto,
  PutTreeMatchRulesDto,
  SetContributionIgnoreDto,
  WriteBackAllocationsDto,
} from './dto/treematch.dto';

// Matching donations to plant locations is a restoration-organisation admin
// task, so every route is owner/admin only.
@UseGuards(JwtAuthGuard)
@Controller('treematch')
export class TreeMatchController {
  constructor(
    private readonly treeMatchService: TreeMatchService,
    private readonly rulesService: TreeMatchRulesService,
    private readonly automatchService: TreeMatchAutomatchService,
  ) {}

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

  @Put('/projects/:id/contributions/allocated')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async writeAllocations(
    @Membership() membership: ProjectGuardResponse,
    @Body() dto: WriteBackAllocationsDto,
  ) {
    return this.treeMatchService.writeAllocations(
      membership.projectId,
      membership.userId,
      dto,
    );
  }

  @Get('/projects/:id/rules')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getRules(@Membership() membership: ProjectGuardResponse) {
    return this.rulesService.getRules(membership.projectId);
  }

  // Full-list replace; the body's array order is the rule priority.
  @Put('/projects/:id/rules')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async putRules(
    @Membership() membership: ProjectGuardResponse,
    @Body() dto: PutTreeMatchRulesDto,
  ) {
    return this.rulesService.replaceRules(membership.projectId, membership.userId, dto);
  }

  // :contributionId is TTC's ProjectContribution id, the only id the web has.
  @Patch('/projects/:id/contributions/:contributionId/ignore')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async setContributionIgnore(
    @Membership() membership: ProjectGuardResponse,
    @Param('contributionId', ParseIntPipe) contributionId: number,
    @Body() dto: SetContributionIgnoreDto,
  ) {
    return this.treeMatchService.setContributionIgnore(
      membership.projectId,
      membership.userId,
      contributionId,
      dto,
    );
  }

  // Runs the auto-match engine synchronously and returns the result summary.
  // 200 (not 201): the run record is an implementation detail.
  @Post('/projects/:id/automatch')
  @HttpCode(200)
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async runAutomatch(@Membership() membership: ProjectGuardResponse) {
    return this.automatchService.run(membership.projectId, membership.userId);
  }
}
