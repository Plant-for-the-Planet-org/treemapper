import {
  Body,
  Controller,
  Delete,
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
import { TreeMatchService } from './treematch.service';
import { TreeMatchRulesService } from './automatch/treematch-rules.service';
import { TreeMatchAutomatchService } from './automatch/treematch-automatch.service';
import {
  CreateMatchesDto,
  GetTreeMatchContributionsQueryDto,
  GetTreeMatchInterventionsQueryDto,
  SetContributionIgnoreDto,
} from './dto/treematch.dto';
import {
  ApplyAutomatchRunDto,
  PutTreeMatchRulesDto,
  StartAutomatchRunDto,
} from './dto/automatch.dto';

// Matching contributions to plant locations is a restoration-organisation admin
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

  // --- Auto-match rules -----------------------------------------------------

  @Get('/projects/:id/rules')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getRules(@Membership() membership: ProjectGuardResponse) {
    return this.rulesService.getRules(membership.projectId);
  }

  // Full-list replace: the body's array order is the rule order.
  @Put('/projects/:id/rules')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async putRules(
    @Membership() membership: ProjectGuardResponse,
    @Body() dto: PutTreeMatchRulesDto,
  ) {
    return this.rulesService.replaceRules(membership.projectId, dto);
  }

  // --- Auto-match runs ------------------------------------------------------

  // 202: the run row exists, but planning is still reading TTC. Poll the run
  // until its status leaves 'planning'. Nothing has reached TTC at this point;
  // a run only writes when it is applied.
  @Post('/projects/:id/automatch/runs')
  @HttpCode(202)
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async startRun(
    @Membership() membership: ProjectGuardResponse,
    @Body() dto: StartAutomatchRunDto,
  ) {
    return this.automatchService.startRun(membership.projectId, membership.userId, dto);
  }

  @Get('/projects/:id/automatch/runs/latest')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getLatestRun(@Membership() membership: ProjectGuardResponse) {
    return this.automatchService.getLatestRun(membership.projectId);
  }

  @Get('/projects/:id/automatch/runs/:runUid')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getRun(
    @Membership() membership: ProjectGuardResponse,
    @Param('runUid') runUid: string,
  ) {
    return this.automatchService.getRun(membership.projectId, runUid);
  }

  // Stop a sweep that is still reading and plan with what it has. Takes effect
  // between pages, so the run stays in 'planning' for up to one more page.
  @Post('/projects/:id/automatch/runs/:runUid/stop')
  @HttpCode(200)
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async stopRun(
    @Membership() membership: ProjectGuardResponse,
    @Param('runUid') runUid: string,
  ) {
    return this.automatchService.requestStop(membership.projectId, runUid);
  }

  // The only route in the feature that writes anything, and it writes through
  // the ordinary match path. The body may narrow the plan to a subset of its
  // pairs, which is how the review dialog drops links before applying.
  @Post('/projects/:id/automatch/runs/:runUid/apply')
  @HttpCode(200)
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async applyRun(
    @Membership() membership: ProjectGuardResponse,
    @Param('runUid') runUid: string,
    @Body() dto: ApplyAutomatchRunDto,
  ) {
    return this.automatchService.apply(
      membership.projectId,
      membership.userId,
      runUid,
      dto,
    );
  }

  @Delete('/projects/:id/automatch/runs/:runUid')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async discardRun(
    @Membership() membership: ProjectGuardResponse,
    @Param('runUid') runUid: string,
  ) {
    return this.automatchService.discard(membership.projectId, runUid);
  }
}
