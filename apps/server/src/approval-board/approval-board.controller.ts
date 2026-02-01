// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Param,
//   Query,
//   UseGuards,
// } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
// import { ApprovalBoardService } from './approval-board.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
// import { ProjectRoles } from '../projects/decorators/project-roles.decorator';
// import { Membership } from '../projects/decorators/membership.decorator';
// import { CurrentUser } from '../auth/current-user.decorator';
// import { ProjectGuardResponse } from '../projects/projects.service';
// import {
//   ReviewQueueQueryDto,
//   ReviewThreadQueryDto,
//   CreateReviewDecisionDto,
//   CreateReviewCommentDto,
//   SubmitForReviewDto,
//   ResubmitForReviewDto,
//   PublishInterventionDto,
//   UnpublishInterventionDto,
//   MarkIssueAddressedDto,
//   ResolveIssueDto,
//   ReviewQueueResponse,
//   ReviewThreadResponse,
//   ReviewCommentResponse,
//   InterventionReviewSummary,
//   UserReviewSummary,
//   PaginatedResponse,
// } from './dto/approval-board.dto';

// @ApiTags('Approval Board')
// @UseGuards(JwtAuthGuard)
// @Controller('approval-board')
// export class ApprovalBoardController {
//   constructor(private readonly approvalBoardService: ApprovalBoardService) {}

//   // ================== Review Queue (Admin) ==================

//   @Get('projects/:id/queue')
//   @ApiOperation({ summary: 'Get interventions pending review for a project' })
//   @ApiParam({ name: 'id', description: 'Project UID' })
//   @ProjectRoles('owner', 'admin')
//   @UseGuards(ProjectPermissionsGuard)
//   async getReviewQueue(
//     @Membership() membership: ProjectGuardResponse,
//     @Query() query: ReviewQueueQueryDto,
//   ): Promise<ReviewQueueResponse> {
//     return this.approvalBoardService.getReviewQueue(membership.projectId, query);
//   }

//   // ================== Intervention Review Status ==================

//   @Get('interventions/:interventionUid')
//   @ApiOperation({ summary: 'Get review details for an intervention' })
//   @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
//   async getInterventionReviewDetails(
//     @Param('interventionUid') interventionUid: string,
//   ): Promise<InterventionReviewSummary> {
//     return this.approvalBoardService.getInterventionReviewDetails(interventionUid);
//   }

//   // ================== Submit for Review (Field Worker) ==================

//   @Post('interventions/:interventionUid/submit')
//   @ApiOperation({ summary: 'Submit an intervention for review' })
//   @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
//   async submitForReview(
//     @Param('interventionUid') interventionUid: string,
//     @Body() dto: SubmitForReviewDto,
//     @CurrentUser() user: any,
//   ): Promise<InterventionReviewSummary> {
//     const userId = user.id || user.sub;
//     return this.approvalBoardService.submitForReview(interventionUid, userId, dto);
//   }

//   @Post('interventions/:interventionUid/resubmit')
//   @ApiOperation({ summary: 'Resubmit an intervention after revisions' })
//   @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
//   async resubmitForReview(
//     @Param('interventionUid') interventionUid: string,
//     @Body() dto: ResubmitForReviewDto,
//     @CurrentUser() user: any,
//   ): Promise<InterventionReviewSummary> {
//     const userId = user.id || user.sub;
//     return this.approvalBoardService.resubmitForReview(interventionUid, userId, dto);
//   }

//   // ================== Review Decision (Admin) ==================

//   @Post('projects/:id/interventions/:interventionUid/review')
//   @ApiOperation({ summary: 'Submit a review decision for an intervention' })
//   @ApiParam({ name: 'id', description: 'Project UID' })
//   @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
//   @ProjectRoles('owner', 'admin')
//   @UseGuards(ProjectPermissionsGuard)
//   async submitReviewDecision(
//     @Param('interventionUid') interventionUid: string,
//     @Body() dto: CreateReviewDecisionDto,
//     @CurrentUser() user: any,
//   ): Promise<InterventionReviewSummary> {
//     const reviewerId = user.id || user.sub;
//     return this.approvalBoardService.submitReviewDecision(
//       interventionUid,
//       reviewerId,
//       dto,
//     );
//   }

//   @Post('projects/:id/interventions/:interventionUid/publish')
//   @ApiOperation({ summary: 'Publish an approved intervention' })
//   @ApiParam({ name: 'id', description: 'Project UID' })
//   @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
//   @ProjectRoles('owner', 'admin')
//   @UseGuards(ProjectPermissionsGuard)
//   async publishIntervention(
//     @Param('interventionUid') interventionUid: string,
//     @Body() dto: PublishInterventionDto,
//     @CurrentUser() user: any,
//   ): Promise<InterventionReviewSummary> {
//     const publisherId = user.id || user.sub;
//     return this.approvalBoardService.publishIntervention(
//       interventionUid,
//       publisherId,
//       dto,
//     );
//   }

//   @Post('projects/:id/interventions/:interventionUid/unpublish')
//   @ApiOperation({ summary: 'Unpublish a published intervention' })
//   @ApiParam({ name: 'id', description: 'Project UID' })
//   @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
//   @ProjectRoles('owner', 'admin')
//   @UseGuards(ProjectPermissionsGuard)
//   async unpublishIntervention(
//     @Param('interventionUid') interventionUid: string,
//     @Body() dto: UnpublishInterventionDto,
//     @CurrentUser() user: any,
//   ): Promise<InterventionReviewSummary> {
//     const adminId = user.id || user.sub;
//     return this.approvalBoardService.unpublishIntervention(
//       interventionUid,
//       adminId,
//       dto,
//     );
//   }

//   // ================== Review Threads ==================

//   @Get('interventions/:interventionUid/threads')
//   @ApiOperation({ summary: 'Get all review threads for an intervention' })
//   @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
//   async getInterventionThreads(
//     @Param('interventionUid') interventionUid: string,
//     @Query() query: ReviewThreadQueryDto,
//   ): Promise<PaginatedResponse<ReviewThreadResponse>> {
//     return this.approvalBoardService.getInterventionThreads(interventionUid, query);
//   }

//   @Get('interventions/:interventionUid/threads/current')
//   @ApiOperation({ summary: 'Get the current active review thread for an intervention' })
//   @ApiParam({ name: 'interventionUid', description: 'Intervention UID' })
//   async getCurrentThread(
//     @Param('interventionUid') interventionUid: string,
//   ): Promise<ReviewThreadResponse | null> {
//     return this.approvalBoardService.getCurrentThread(interventionUid);
//   }

//   // ================== Review Comments ==================

//   @Get('threads/:threadUid/comments')
//   @ApiOperation({ summary: 'Get all comments in a review thread' })
//   @ApiParam({ name: 'threadUid', description: 'Thread UID' })
//   async getThreadComments(
//     @Param('threadUid') threadUid: string,
//   ): Promise<ReviewCommentResponse[]> {
//     return this.approvalBoardService.getThreadComments(threadUid);
//   }

//   @Post('projects/:id/threads/:threadUid/comments')
//   @ApiOperation({ summary: 'Add a comment to a review thread (Admin)' })
//   @ApiParam({ name: 'id', description: 'Project UID' })
//   @ApiParam({ name: 'threadUid', description: 'Thread UID' })
//   @ProjectRoles('owner', 'admin')
//   @UseGuards(ProjectPermissionsGuard)
//   async addAdminComment(
//     @Param('threadUid') threadUid: string,
//     @Body() dto: CreateReviewCommentDto,
//     @CurrentUser() user: any,
//   ): Promise<ReviewCommentResponse> {
//     const userId = user.id || user.sub;
//     return this.approvalBoardService.addComment(threadUid, userId, 'admin', dto);
//   }

//   @Post('threads/:threadUid/comments')
//   @ApiOperation({ summary: 'Add a comment to a review thread (Field Worker)' })
//   @ApiParam({ name: 'threadUid', description: 'Thread UID' })
//   async addFieldWorkerComment(
//     @Param('threadUid') threadUid: string,
//     @Body() dto: CreateReviewCommentDto,
//     @CurrentUser() user: any,
//   ): Promise<ReviewCommentResponse> {
//     const userId = user.id || user.sub;
//     return this.approvalBoardService.addComment(threadUid, userId, 'field_worker', dto);
//   }

//   // ================== Issue Resolution ==================

//   @Post('comments/:commentUid/addressed')
//   @ApiOperation({ summary: 'Mark an issue as addressed by field worker' })
//   @ApiParam({ name: 'commentUid', description: 'Comment UID' })
//   async markIssueAddressed(
//     @Param('commentUid') commentUid: string,
//     @Body() dto: MarkIssueAddressedDto,
//     @CurrentUser() user: any,
//   ): Promise<ReviewCommentResponse> {
//     const userId = user.id || user.sub;
//     return this.approvalBoardService.markIssueAddressed(commentUid, userId, dto);
//   }

//   @Post('projects/:id/comments/:commentUid/resolve')
//   @ApiOperation({ summary: 'Resolve an issue (Admin)' })
//   @ApiParam({ name: 'id', description: 'Project UID' })
//   @ApiParam({ name: 'commentUid', description: 'Comment UID' })
//   @ProjectRoles('owner', 'admin')
//   @UseGuards(ProjectPermissionsGuard)
//   async resolveIssue(
//     @Param('commentUid') commentUid: string,
//     @Body() dto: ResolveIssueDto,
//     @CurrentUser() user: any,
//   ): Promise<ReviewCommentResponse> {
//     const resolverId = user.id || user.sub;
//     return this.approvalBoardService.resolveIssue(commentUid, resolverId, dto);
//   }

//   // ================== User Summary (Mobile) ==================

//   @Get('users/me/summary')
//   @ApiOperation({ summary: 'Get review summary for the current user' })
//   async getUserReviewSummary(
//     @CurrentUser() user: any,
//   ): Promise<UserReviewSummary> {
//     const userId = user.id || user.sub;
//     return this.approvalBoardService.getUserReviewSummary(userId);
//   }

//   // ================== Project Approval Settings ==================

//   @Get('projects/:id/requires-approval')
//   @ApiOperation({ summary: 'Check if a project requires approval workflow' })
//   @ApiParam({ name: 'id', description: 'Project UID' })
//   @ApiResponse({ status: 200, description: 'Returns whether the project requires approval' })
//   @ProjectRoles('owner', 'admin', 'contributor', 'observer')
//   @UseGuards(ProjectPermissionsGuard)
//   async checkProjectRequiresApproval(
//     @Membership() membership: ProjectGuardResponse,
//   ): Promise<{ requiresApproval: boolean }> {
//     return this.approvalBoardService.checkProjectRequiresApproval(membership.projectId);
//   }
// }
