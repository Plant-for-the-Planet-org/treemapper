import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApprovalBoardService } from './approval-board.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { ProjectRoles } from '../projects/decorators/project-roles.decorator';
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
  UserReviewSummary,
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
  @UseGuards(ProjectPermissionsGuard)
  async startReview(
    @Param('interventionUid') interventionUid: string,
    @CurrentUser() user: any,
  ): Promise<InterventionReviewSummary> {
    const adminId = user.id || user.sub;
    return this.approvalBoardService.startReview(interventionUid, adminId);
  }

  // ================== Unified Review Action ==================
  // Single endpoint used by the web frontend: handles pending→in_review and in_review→approved|rejected

  @Post('projects/:id/interventions/:interventionUid/review')
  @ApiOperation({ summary: 'Unified review action: move to in_review, approve, or reject' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async reviewIntervention(
    @Param('interventionUid') interventionUid: string,
    @Body() dto: ReviewDecisionDto,
    @CurrentUser() user: any,
  ): Promise<InterventionReviewSummary> {
    const adminId = user.id || user.sub;
    if (dto.decision === 'in_review') {
      return this.approvalBoardService.startReview(interventionUid, adminId);
    }
    return this.approvalBoardService.makeDecision(interventionUid, adminId, {
      decision: dto.decision as 'approved' | 'rejected',
      note: dto.note,
    });
  }

  // ================== Make Decision (in_review → approved | rejected) ==================

  @Post('projects/:id/interventions/:interventionUid/decide')
  @ApiOperation({ summary: 'Approve or reject an intervention (irreversible)' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async makeDecision(
    @Param('interventionUid') interventionUid: string,
    @Body() dto: MakeDecisionDto,
    @CurrentUser() user: any,
  ): Promise<InterventionReviewSummary> {
    const adminId = user.id || user.sub;
    return this.approvalBoardService.makeDecision(interventionUid, adminId, dto);
  }

  // ================== Comments (Admin) ==================

  @Post('projects/:id/interventions/:interventionUid/comment')
  @ApiOperation({ summary: 'Admin adds a comment to an in-review intervention' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async addAdminComment(
    @Param('interventionUid') interventionUid: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
  ): Promise<ReviewCommentResponse> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.addComment(interventionUid, userId, 'admin', dto);
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
  ): Promise<ReviewThreadResponse | null> {
    return this.approvalBoardService.getCurrentThread(interventionUid);
  }

  // ================== Comments by Thread ==================

  @Get('threads/:threadUid/comments')
  @ApiOperation({ summary: 'Get all comments for a thread' })
  @ApiParam({ name: 'threadUid', description: 'Thread UID' })
  async getThreadComments(
    @Param('threadUid') threadUid: string,
  ): Promise<ReviewCommentResponse[]> {
    return this.approvalBoardService.getCommentsByThreadUid(threadUid);
  }

  @Post('projects/:id/threads/:threadUid/comments')
  @ApiOperation({ summary: 'Admin adds a comment to a thread' })
  @ApiParam({ name: 'id', description: 'Project UID' })
  @ApiParam({ name: 'threadUid', description: 'Thread UID' })
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async addAdminCommentByThread(
    @Param('threadUid') threadUid: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
  ): Promise<ReviewCommentResponse> {
    const userId = user.id || user.sub;
    return this.approvalBoardService.addCommentByThread(threadUid, userId, 'admin', dto);
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
  ): Promise<ReviewCommentResponse[]> {
    return this.approvalBoardService.getInterventionComments(interventionUid);
  }

  // ================== Review Status ==================

  @Get('interventions/:interventionUid/status')
  @ApiOperation({ summary: 'Get review status for an intervention' })
  @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
  async getReviewStatus(
    @Param('interventionUid') interventionUid: string,
  ): Promise<InterventionReviewSummary> {
    return this.approvalBoardService.getInterventionReviewStatus(interventionUid);
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
}
