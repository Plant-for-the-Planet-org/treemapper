import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApprovalBoardService } from './approval-board.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { ApprovalDecisionGuard } from './approval-decision.guard';
import { WorkspacePermissionsGuard } from '../workspace/workspace-permissions.guard';
import { ProjectRoles } from '../projects/decorators/project-roles.decorator';
import { ProjectPermissions } from '../projects/decorators/project-permissions.decorator';
import { Membership } from '../projects/decorators/membership.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProjectGuardResponse } from '../projects/projects.service';
import {
  ReviewQueueQueryDto,
  MakeDecisionDto,
  AddCommentDto,
  ReviewDecisionDto,
  ReviewQueueResponse,
  ReviewCommentResponse,
  ReviewThreadResponse,
  InterventionReviewSummary,
  SiteReviewSummary,
  SiteReviewQueueResponse,
  UserReviewSummary,
  WorkspaceReviewQueueResponse,
  WorkspaceSiteReviewQueueResponse,
} from './dto/approval-board.dto';

@ApiTags('Approval Board')
@UseGuards(JwtAuthGuard)
@Controller('approval-board')
export class ApprovalBoardController {
  constructor(private readonly approvalBoardService: ApprovalBoardService) {}

  // ================== Review Queue (Admin) ==================

  @Get('projects/:id/queue')
  @ApiOperation({ summary: 'Get interventions in the review queue for a project' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('approve_intervention')
  @UseGuards(ProjectPermissionsGuard)
  async getReviewQueue(
    @Membership() membership: ProjectGuardResponse,
    @Query() query: ReviewQueueQueryDto,
  ): Promise<ReviewQueueResponse> {
    return this.approvalBoardService.getReviewQueue(membership.projectId, query);
  }

  // ================== Start Review (pending → in_review) ==================

  @Post('projects/:id/interventions/:interventionUid/start-review')
  @ApiOperation({ summary: 'Move an intervention from pending to in_review' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('approve_intervention')
  @UseGuards(ApprovalDecisionGuard)
  async startReview(
    @Param('interventionUid') interventionUid: string,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<InterventionReviewSummary> {
    const adminId = user.id || user.sub;
    return this.approvalBoardService.startReview(interventionUid, adminId, membership.projectId);
  }

  // ================== Unified Review Action ==================
  // Single endpoint used by the web frontend: handles pending→in_review and in_review→approved|rejected

  @Post('projects/:id/interventions/:interventionUid/review')
  @ApiOperation({ summary: 'Unified review action: move to in_review, approve, or reject' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('approve_intervention')
  @UseGuards(ApprovalDecisionGuard)
  async reviewIntervention(
    @Param('interventionUid') interventionUid: string,
    @Body() dto: ReviewDecisionDto,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<InterventionReviewSummary> {
    const adminId = user.id || user.sub;
    if (dto.decision === 'in_review') {
      return this.approvalBoardService.startReview(interventionUid, adminId, membership.projectId);
    }
    return this.approvalBoardService.makeDecision(interventionUid, adminId, {
      decision: dto.decision as 'approved' | 'rejected',
      note: dto.note,
    }, membership.projectId);
  }

  // ================== Make Decision (in_review → approved | rejected) ==================

  @Post('projects/:id/interventions/:interventionUid/decide')
  @ApiOperation({ summary: 'Approve or reject an intervention (irreversible)' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('approve_intervention')
  @UseGuards(ApprovalDecisionGuard)
  async makeDecision(
    @Param('interventionUid') interventionUid: string,
    @Body() dto: MakeDecisionDto,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<InterventionReviewSummary> {
    const adminId = user.id || user.sub;
    return this.approvalBoardService.makeDecision(interventionUid, adminId, dto, membership.projectId);
  }

  // ================== Comments (Admin) ==================

  @Post('projects/:id/interventions/:interventionUid/comment')
  @ApiOperation({ summary: 'Admin adds a comment to an in-review intervention' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('approve_intervention')
  @UseGuards(ApprovalDecisionGuard)
  async addAdminComment(
    @Param('interventionUid') interventionUid: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<ReviewCommentResponse> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.addComment(interventionUid, userId, 'admin', dto, membership.projectId);
  }

  // ================== Comments (Field Worker) ==================

  @Post('interventions/:interventionUid/comment')
  @ApiOperation({ summary: 'Field worker adds a comment to their in-review intervention' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  async addFieldWorkerComment(
    @Param('interventionUid') interventionUid: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
  ): Promise<ReviewCommentResponse> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.addComment(interventionUid, userId, 'contributor', dto);
  }

  // ================== Current Thread ==================

  @Get('interventions/:interventionUid/threads/current')
  @ApiOperation({ summary: 'Get the current open review thread for an intervention' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  async getCurrentThread(
    @Param('interventionUid') interventionUid: string,
    @CurrentUser() user: any,
  ): Promise<ReviewThreadResponse | null> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.getCurrentThread(interventionUid, userId);
  }

  @Get('interventions/:interventionUid')
  @ApiOperation({ summary: 'Get rich intervention details for approval modal' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  async getInterventionDetails(
    @Param('interventionUid') interventionUid: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.id || user.sub;
    return this.approvalBoardService.getInterventionDetails(interventionUid, userId);
  }

  // ================== Comments by Thread ==================

  @Get('threads/:threadUid/comments')
  @ApiOperation({ summary: 'Get all comments for a thread' })
  @ApiParam({ name: 'threadUid', description: 'Thread UID' })
  async getThreadComments(
    @Param('threadUid') threadUid: string,
    @CurrentUser() user: any,
  ): Promise<ReviewCommentResponse[]> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.getCommentsByThreadUid(threadUid, userId);
  }

  @Post('projects/:id/threads/:threadUid/comments')
  @ApiOperation({ summary: 'Admin adds a comment to a thread' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'threadUid', description: 'Thread UID' })
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('approve_intervention')
  @UseGuards(ApprovalDecisionGuard)
  async addAdminCommentByThread(
    @Param('threadUid') threadUid: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<ReviewCommentResponse> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.addCommentByThread(threadUid, userId, 'admin', dto, membership.projectId);
  }

  @Post('threads/:threadUid/comments')
  @ApiOperation({ summary: 'Field worker adds a comment to a thread' })
  @ApiParam({ name: 'threadUid', description: 'Thread UID' })
  async addFieldWorkerCommentByThread(
    @Param('threadUid') threadUid: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
  ): Promise<ReviewCommentResponse> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.addCommentByThread(threadUid, userId, 'contributor', dto);
  }

  // ================== Get Comments ==================

  @Get('interventions/:interventionUid/comments')
  @ApiOperation({ summary: 'Get all comments for an intervention' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  async getComments(
    @Param('interventionUid') interventionUid: string,
    @CurrentUser() user: any,
  ): Promise<ReviewCommentResponse[]> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.getInterventionComments(interventionUid, userId);
  }

  // ================== Review Status ==================

  @Get('interventions/:interventionUid/status')
  @ApiOperation({ summary: 'Get review status for an intervention' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  async getReviewStatus(
    @Param('interventionUid') interventionUid: string,
    @CurrentUser() user: any,
  ): Promise<InterventionReviewSummary> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.getInterventionReviewStatus(interventionUid, userId);
  }

  // ================== User Summary (Mobile) ==================

  @Get('users/me/summary')
  @ApiOperation({ summary: 'Get review summary for the current user (counts by status)' })
  async getUserReviewSummary(@CurrentUser() user: any): Promise<UserReviewSummary> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.getUserReviewSummary(userId);
  }

  // ================== Project Approval Check ==================

  @Get('projects/:id/requires-approval')
  @ApiOperation({ summary: 'Check if a project requires the approval workflow' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  async checkProjectRequiresApproval(
    @Membership() membership: ProjectGuardResponse,
  ): Promise<{ requiresApproval: boolean }> {
    return this.approvalBoardService.checkProjectRequiresApproval(membership.projectId);
  }

  // ================== Workspace Review Queues ==================

  @Get('workspaces/:uid/queue')
  @ApiOperation({ summary: 'Get interventions across all projects in a workspace' })
  @ApiParam({ name: 'uid', description: 'Workspace UID' })
  @UseGuards(WorkspacePermissionsGuard)
  async getWorkspaceReviewQueue(
    @Param('uid') workspaceUid: string,
    @Query() query: ReviewQueueQueryDto,
    @Req() req: any,
  ): Promise<WorkspaceReviewQueueResponse> {
    return this.approvalBoardService.getWorkspaceReviewQueue(req.workspace.id, query);
  }

  @Get('workspaces/:uid/sites/queue')
  @ApiOperation({ summary: 'Get sites across all projects in a workspace' })
  @ApiParam({ name: 'uid', description: 'Workspace UID' })
  @UseGuards(WorkspacePermissionsGuard)
  async getWorkspaceSiteReviewQueue(
    @Param('uid') workspaceUid: string,
    @Query() query: ReviewQueueQueryDto,
    @Req() req: any,
  ): Promise<WorkspaceSiteReviewQueueResponse> {
    return this.approvalBoardService.getWorkspaceSiteReviewQueue(req.workspace.id, query);
  }

  // ================== Site Review Queue (Admin) ==================

  @Get('projects/:id/sites/queue')
  @ApiOperation({ summary: 'Get sites in the review queue for a project' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('approve_site')
  @UseGuards(ProjectPermissionsGuard)
  async getSiteReviewQueue(
    @Membership() membership: ProjectGuardResponse,
    @Query() query: ReviewQueueQueryDto,
  ): Promise<SiteReviewQueueResponse> {
    return this.approvalBoardService.getSiteReviewQueue(membership.projectId, query);
  }

  // ================== Unified Site Review Action ==================

  @Post('projects/:id/sites/:siteUid/review')
  @ApiOperation({ summary: 'Unified site review action: move to in_review, approve, or reject' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'siteUid', description: 'Site UID' })
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('approve_site')
  @UseGuards(ApprovalDecisionGuard)
  async reviewSite(
    @Param('siteUid') siteUid: string,
    @Body() dto: ReviewDecisionDto,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<SiteReviewSummary> {
    const adminId = user.id || user.sub;
    if (dto.decision === 'in_review') {
      return this.approvalBoardService.startSiteReview(siteUid, adminId, membership.projectId);
    }
    return this.approvalBoardService.makeSiteDecision(siteUid, adminId, {
      decision: dto.decision as 'approved' | 'rejected',
      note: dto.note,
    }, membership.projectId);
  }

  // ================== Make Site Decision (in_review → approved | rejected) ==================

  @Post('projects/:id/sites/:siteUid/decide')
  @ApiOperation({ summary: 'Approve or reject a site' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'siteUid', description: 'Site UID' })
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('approve_site')
  @UseGuards(ApprovalDecisionGuard)
  async makeSiteDecision(
    @Param('siteUid') siteUid: string,
    @Body() dto: MakeDecisionDto,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<SiteReviewSummary> {
    const adminId = user.id || user.sub;
    return this.approvalBoardService.makeSiteDecision(siteUid, adminId, dto, membership.projectId);
  }

  // ================== Site Comments (Admin) ==================

  @Post('projects/:id/sites/:siteUid/comment')
  @ApiOperation({ summary: 'Admin adds a comment to an in-review site' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'siteUid', description: 'Site UID' })
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('approve_site')
  @UseGuards(ApprovalDecisionGuard)
  async addAdminSiteComment(
    @Param('siteUid') siteUid: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
    @Membership() membership: ProjectGuardResponse,
  ): Promise<ReviewCommentResponse> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.addSiteComment(siteUid, userId, 'admin', dto, membership.projectId);
  }

  // ================== Site Comments (Contributor) ==================

  @Post('sites/:siteUid/comment')
  @ApiOperation({ summary: 'Contributor adds a comment to their in-review site' })
  @ApiParam({ name: 'siteUid', description: 'Site UID' })
  async addContributorSiteComment(
    @Param('siteUid') siteUid: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
  ): Promise<ReviewCommentResponse> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.addSiteComment(siteUid, userId, 'contributor', dto);
  }

  // ================== Current Site Thread ==================

  @Get('sites/:siteUid/threads/current')
  @ApiOperation({ summary: 'Get the current open review thread for a site' })
  @ApiParam({ name: 'siteUid', description: 'Site UID' })
  async getCurrentSiteThread(
    @Param('siteUid') siteUid: string,
    @CurrentUser() user: any,
  ): Promise<ReviewThreadResponse | null> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.getCurrentSiteThread(siteUid, userId);
  }

  // ================== Site Review Status ==================

  @Get('sites/:siteUid/status')
  @ApiOperation({ summary: 'Get review status for a site' })
  @ApiParam({ name: 'siteUid', description: 'Site UID' })
  async getSiteReviewStatus(
    @Param('siteUid') siteUid: string,
    @CurrentUser() user: any,
  ): Promise<SiteReviewSummary> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.getSiteReviewStatus(siteUid, userId);
  }
}
