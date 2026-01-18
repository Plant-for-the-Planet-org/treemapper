import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import {
  intervention,
  reviewThread,
  reviewComment,
  user,
  project,
  site,
} from '../database/schema/index';
import { eq, and, or, desc, asc, sql, isNull, inArray, ilike } from 'drizzle-orm';
import { generateUid } from '../util/uidGenerator';
import {
  ReviewQueueQueryDto,
  ReviewThreadQueryDto,
  CreateReviewDecisionDto,
  CreateReviewCommentDto,
  SubmitForReviewDto,
  ResubmitForReviewDto,
  PublishInterventionDto,
  UnpublishInterventionDto,
  MarkIssueAddressedDto,
  ResolveIssueDto,
  ReviewQueueResponse,
  ReviewThreadResponse,
  ReviewCommentResponse,
  UserReviewSummary,
  InterventionReviewSummary,
  ReviewStatus,
  ReviewDecision,
  PaginatedResponse,
} from './dto/approval-board.dto';
import { ProjectGuardResponse } from '../projects/projects.service';

@Injectable()
export class ApprovalBoardService {
  constructor(private drizzleService: DrizzleService) {}

  // ================== Review Queue (Admin) ==================

  async getReviewQueue(
    projectId: number,
    query: ReviewQueueQueryDto,
  ): Promise<ReviewQueueResponse> {
    const { limit = 20, page = 1, status, search, sortOrder = 'asc', sortBy = 'submittedAt' } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [
      eq(intervention.projectId, projectId),
      isNull(intervention.deletedAt),
    ];

    // Filter by review status
    if (status) {
      whereConditions.push(eq(intervention.reviewStatus, status));
    } else {
      // Default: show pending and resubmitted (review queue)
      whereConditions.push(
        inArray(intervention.reviewStatus, ['pending', 'resubmitted']),
      );
    }

    // Search filter
    if (search) {
      const searchCondition = or(
        ilike(intervention.hid, `%${search}%`),
        ilike(intervention.description, `%${search}%`),
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Get sort column
    const sortColumn =
      sortBy === 'submittedAt'
        ? intervention.submittedAt
        : sortBy === 'updatedAt'
          ? intervention.updatedAt
          : intervention.createdAt;

    // Execute queries in parallel
    const [data, totalResult] = await Promise.all([
      this.drizzleService.db
        .select({
          interventionId: intervention.id,
          interventionUid: intervention.uid,
          interventionHid: intervention.hid,
          interventionDescription: intervention.description,
          type: intervention.type,
          reviewStatus: intervention.reviewStatus,
          submittedAt: intervention.submittedAt,
          revisionCount: intervention.revisionCount,
          currentThreadId: intervention.currentReviewThreadId,
          userId: intervention.userId,
          userName: user.displayName,
          projectId: intervention.projectId,
          projectName: project.name,
          siteId: intervention.siteId,
          siteName: site.name,
        })
        .from(intervention)
        .leftJoin(user, eq(intervention.userId, user.id))
        .leftJoin(project, eq(intervention.projectId, project.id))
        .leftJoin(site, eq(intervention.siteId, site.id))
        .where(and(...whereConditions))
        .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
        .limit(limit)
        .offset(offset),
      this.drizzleService.db
        .select({ count: sql<number>`count(*)` })
        .from(intervention)
        .where(and(...whereConditions)),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    // Get unresolved issues count for each intervention
    const interventionIds = data.map((d) => d.interventionId);
    let issuesCountMap: Map<number, number> = new Map();

    if (interventionIds.length > 0) {
      const issuesCounts = await this.drizzleService.db
        .select({
          interventionId: reviewThread.interventionId,
          count: sql<number>`count(*)`,
        })
        .from(reviewComment)
        .innerJoin(reviewThread, eq(reviewComment.threadId, reviewThread.id))
        .where(
          and(
            inArray(reviewThread.interventionId, interventionIds),
            eq(reviewComment.type, 'issue'),
            eq(reviewComment.isResolved, false),
            isNull(reviewComment.deletedAt),
          ),
        )
        .groupBy(reviewThread.interventionId);

      issuesCountMap = new Map(
        issuesCounts.map((ic) => [ic.interventionId, Number(ic.count)]),
      );
    }

    const formattedData: InterventionReviewSummary[] = data.map((d) => ({
      interventionId: d.interventionId,
      interventionUid: d.interventionUid,
      interventionHid: d.interventionHid,
      interventionName: d.interventionDescription || undefined,
      type: d.type,
      reviewStatus: d.reviewStatus as ReviewStatus,
      submittedAt: d.submittedAt || undefined,
      userId: d.userId,
      userName: d.userName || 'Unknown',
      projectId: d.projectId,
      projectName: d.projectName || 'Unknown',
      siteId: d.siteId || undefined,
      siteName: d.siteName || undefined,
      unresolvedIssuesCount: issuesCountMap.get(d.interventionId) || 0,
      revisionCount: d.revisionCount,
      currentThreadId: d.currentThreadId || undefined,
    }));

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ================== Submit for Review (Field Worker) ==================

  async submitForReview(
    interventionUid: string,
    userId: number,
    dto: SubmitForReviewDto,
  ): Promise<InterventionReviewSummary> {
    return await this.drizzleService.db.transaction(async (tx) => {
      // Get the intervention
      const [inv] = await tx
        .select()
        .from(intervention)
        .where(
          and(
            eq(intervention.uid, interventionUid),
            isNull(intervention.deletedAt),
          ),
        )
        .limit(1);

      if (!inv) {
        throw new NotFoundException('Intervention not found');
      }

      // Verify ownership
      if (inv.userId !== userId) {
        throw new ForbiddenException(
          'You can only submit your own interventions for review',
        );
      }

      // Check valid status transition
      if (!['draft', 'in_revision'].includes(inv.reviewStatus)) {
        throw new BadRequestException(
          `Cannot submit for review from status: ${inv.reviewStatus}`,
        );
      }

      const now = new Date();
      const isFirstSubmission = !inv.firstSubmittedAt;

      // Update intervention
      const [updated] = await tx
        .update(intervention)
        .set({
          reviewStatus: 'pending',
          submittedAt: now,
          firstSubmittedAt: isFirstSubmission ? now : inv.firstSubmittedAt,
          updatedAt: now,
        })
        .where(eq(intervention.id, inv.id))
        .returning();

      // Create a new review thread
      const threadNumber = inv.revisionCount + 1;
      const [thread] = await tx
        .insert(reviewThread)
        .values({
          uid: generateUid('rvth'),
          interventionId: inv.id,
          threadNumber,
          status: 'open',
        })
        .returning();

      // Update intervention with current thread
      await tx
        .update(intervention)
        .set({ currentReviewThreadId: thread.id })
        .where(eq(intervention.id, inv.id));

      // Add system comment if note provided
      if (dto.note) {
        await tx.insert(reviewComment).values({
          uid: generateUid('rvcm'),
          threadId: thread.id,
          authorId: userId,
          authorRole: 'field_worker',
          type: 'general',
          message: dto.note,
        });
      }

      // Get user and project info
      const [userData] = await tx
        .select({ displayName: user.displayName })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      const [projectData] = await tx
        .select({ name: project.name })
        .from(project)
        .where(eq(project.id, inv.projectId))
        .limit(1);

      return {
        interventionId: updated.id,
        interventionUid: updated.uid,
        interventionHid: updated.hid,
        interventionName: updated.description || undefined,
        type: updated.type,
        reviewStatus: updated.reviewStatus as ReviewStatus,
        submittedAt: updated.submittedAt || undefined,
        userId: updated.userId,
        userName: userData?.displayName || 'Unknown',
        projectId: updated.projectId,
        projectName: projectData?.name || 'Unknown',
        siteId: updated.siteId || undefined,
        siteName: undefined,
        unresolvedIssuesCount: 0,
        revisionCount: updated.revisionCount,
        currentThreadId: thread.id,
      };
    });
  }

  // ================== Review Decision (Admin) ==================

  async submitReviewDecision(
    interventionUid: string,
    reviewerId: number,
    dto: CreateReviewDecisionDto,
  ): Promise<InterventionReviewSummary> {
    return await this.drizzleService.db.transaction(async (tx) => {
      // Get the intervention with current thread
      const [inv] = await tx
        .select()
        .from(intervention)
        .where(
          and(
            eq(intervention.uid, interventionUid),
            isNull(intervention.deletedAt),
          ),
        )
        .limit(1);

      if (!inv) {
        throw new NotFoundException('Intervention not found');
      }

      // Check valid status for review
      if (!['pending', 'resubmitted', 'in_review'].includes(inv.reviewStatus)) {
        throw new BadRequestException(
          `Cannot review intervention with status: ${inv.reviewStatus}`,
        );
      }

      const now = new Date();
      let newStatus: ReviewStatus;
      let approvedAt: Date | null = null;
      let approvedById: number | null = null;

      switch (dto.decision) {
        case 'approved':
          newStatus = 'approved';
          approvedAt = now;
          approvedById = reviewerId;
          break;
        case 'changes_requested':
          newStatus = 'changes_requested';
          break;
        case 'rejected':
          newStatus = 'rejected';
          break;
      }

      // Update intervention
      const [updated] = await tx
        .update(intervention)
        .set({
          reviewStatus: newStatus,
          approvedAt,
          approvedById,
          updatedAt: now,
        })
        .where(eq(intervention.id, inv.id))
        .returning();

      // Update current thread if exists
      if (inv.currentReviewThreadId) {
        await tx
          .update(reviewThread)
          .set({
            status: dto.decision === 'changes_requested' ? 'open' : 'resolved',
            resolution: dto.decision,
            resolvedAt: now,
            resolvedById: reviewerId,
            updatedAt: now,
          })
          .where(eq(reviewThread.id, inv.currentReviewThreadId));

        // Add review decision comment
        if (dto.note) {
          await tx.insert(reviewComment).values({
            uid: generateUid('rvcm'),
            threadId: inv.currentReviewThreadId,
            authorId: reviewerId,
            authorRole: 'admin',
            type: 'general',
            message: dto.note,
          });
        }

        // Add issue comments if provided
        if (dto.issues && dto.issues.length > 0) {
          for (const issue of dto.issues) {
            await tx.insert(reviewComment).values({
              uid: generateUid('rvcm'),
              threadId: inv.currentReviewThreadId,
              authorId: reviewerId,
              authorRole: 'admin',
              type: 'issue',
              message: issue.message,
              targetField: issue.field,
              severity: issue.severity,
              isResolved: false,
            });
          }
        }
      }

      // Get user and project info
      const [userData] = await tx
        .select({ displayName: user.displayName })
        .from(user)
        .where(eq(user.id, inv.userId))
        .limit(1);

      const [projectData] = await tx
        .select({ name: project.name })
        .from(project)
        .where(eq(project.id, inv.projectId))
        .limit(1);

      return {
        interventionId: updated.id,
        interventionUid: updated.uid,
        interventionHid: updated.hid,
        interventionName: updated.description || undefined,
        type: updated.type,
        reviewStatus: updated.reviewStatus as ReviewStatus,
        submittedAt: updated.submittedAt || undefined,
        userId: updated.userId,
        userName: userData?.displayName || 'Unknown',
        projectId: updated.projectId,
        projectName: projectData?.name || 'Unknown',
        siteId: updated.siteId || undefined,
        siteName: undefined,
        unresolvedIssuesCount: dto.issues?.length || 0,
        revisionCount: updated.revisionCount,
        currentThreadId: updated.currentReviewThreadId || undefined,
      };
    });
  }

  // ================== Publish/Unpublish (Admin) ==================

  async publishIntervention(
    interventionUid: string,
    publisherId: number,
    dto: PublishInterventionDto,
  ): Promise<InterventionReviewSummary> {
    return await this.drizzleService.db.transaction(async (tx) => {
      const [inv] = await tx
        .select()
        .from(intervention)
        .where(
          and(
            eq(intervention.uid, interventionUid),
            isNull(intervention.deletedAt),
          ),
        )
        .limit(1);

      if (!inv) {
        throw new NotFoundException('Intervention not found');
      }

      if (inv.reviewStatus !== 'approved') {
        throw new BadRequestException(
          'Only approved interventions can be published',
        );
      }

      const now = new Date();

      const [updated] = await tx
        .update(intervention)
        .set({
          reviewStatus: 'published',
          publishedAt: now,
          publishedById: publisherId,
          updatedAt: now,
        })
        .where(eq(intervention.id, inv.id))
        .returning();

      // Add system comment if note provided
      if (dto.note && inv.currentReviewThreadId) {
        await tx.insert(reviewComment).values({
          uid: generateUid('rvcm'),
          threadId: inv.currentReviewThreadId,
          authorId: publisherId,
          authorRole: 'admin',
          type: 'system',
          message: `Published: ${dto.note}`,
        });
      }

      // Get info for response
      const [userData] = await tx
        .select({ displayName: user.displayName })
        .from(user)
        .where(eq(user.id, inv.userId))
        .limit(1);

      const [projectData] = await tx
        .select({ name: project.name })
        .from(project)
        .where(eq(project.id, inv.projectId))
        .limit(1);

      return {
        interventionId: updated.id,
        interventionUid: updated.uid,
        interventionHid: updated.hid,
        interventionName: updated.description || undefined,
        type: updated.type,
        reviewStatus: updated.reviewStatus as ReviewStatus,
        submittedAt: updated.submittedAt || undefined,
        userId: updated.userId,
        userName: userData?.displayName || 'Unknown',
        projectId: updated.projectId,
        projectName: projectData?.name || 'Unknown',
        siteId: updated.siteId || undefined,
        siteName: undefined,
        unresolvedIssuesCount: 0,
        revisionCount: updated.revisionCount,
        currentThreadId: updated.currentReviewThreadId || undefined,
      };
    });
  }

  async unpublishIntervention(
    interventionUid: string,
    adminId: number,
    dto: UnpublishInterventionDto,
  ): Promise<InterventionReviewSummary> {
    return await this.drizzleService.db.transaction(async (tx) => {
      const [inv] = await tx
        .select()
        .from(intervention)
        .where(
          and(
            eq(intervention.uid, interventionUid),
            isNull(intervention.deletedAt),
          ),
        )
        .limit(1);

      if (!inv) {
        throw new NotFoundException('Intervention not found');
      }

      if (inv.reviewStatus !== 'published') {
        throw new BadRequestException('Only published interventions can be unpublished');
      }

      const now = new Date();

      // Update intervention
      let newStatus: ReviewStatus = 'unpublished';
      let currentThreadId = inv.currentReviewThreadId;

      // Optionally create new review thread
      if (dto.createReviewThread) {
        const threadNumber = inv.revisionCount + 1;
        const [thread] = await tx
          .insert(reviewThread)
          .values({
            uid: generateUid('rvth'),
            interventionId: inv.id,
            threadNumber,
            status: 'open',
          })
          .returning();

        currentThreadId = thread.id;
        newStatus = 'changes_requested';

        // Add system comment explaining unpublish
        await tx.insert(reviewComment).values({
          uid: generateUid('rvcm'),
          threadId: thread.id,
          authorId: adminId,
          authorRole: 'admin',
          type: 'system',
          message: `Intervention unpublished. Reason: ${dto.reason}`,
        });
      }

      const [updated] = await tx
        .update(intervention)
        .set({
          reviewStatus: newStatus,
          unpublishedAt: now,
          unpublishedById: adminId,
          unpublishReason: dto.reason,
          currentReviewThreadId: currentThreadId,
          revisionCount: dto.createReviewThread ? inv.revisionCount + 1 : inv.revisionCount,
          updatedAt: now,
        })
        .where(eq(intervention.id, inv.id))
        .returning();

      // Get info for response
      const [userData] = await tx
        .select({ displayName: user.displayName })
        .from(user)
        .where(eq(user.id, inv.userId))
        .limit(1);

      const [projectData] = await tx
        .select({ name: project.name })
        .from(project)
        .where(eq(project.id, inv.projectId))
        .limit(1);

      return {
        interventionId: updated.id,
        interventionUid: updated.uid,
        interventionHid: updated.hid,
        interventionName: updated.description || undefined,
        type: updated.type,
        reviewStatus: updated.reviewStatus as ReviewStatus,
        submittedAt: updated.submittedAt || undefined,
        userId: updated.userId,
        userName: userData?.displayName || 'Unknown',
        projectId: updated.projectId,
        projectName: projectData?.name || 'Unknown',
        siteId: updated.siteId || undefined,
        siteName: undefined,
        unresolvedIssuesCount: 0,
        revisionCount: updated.revisionCount,
        currentThreadId: updated.currentReviewThreadId || undefined,
      };
    });
  }

  // ================== Resubmit (Field Worker) ==================

  async resubmitForReview(
    interventionUid: string,
    userId: number,
    dto: ResubmitForReviewDto,
  ): Promise<InterventionReviewSummary> {
    return await this.drizzleService.db.transaction(async (tx) => {
      const [inv] = await tx
        .select()
        .from(intervention)
        .where(
          and(
            eq(intervention.uid, interventionUid),
            isNull(intervention.deletedAt),
          ),
        )
        .limit(1);

      if (!inv) {
        throw new NotFoundException('Intervention not found');
      }

      // Verify ownership
      if (inv.userId !== userId) {
        throw new ForbiddenException('You can only resubmit your own interventions');
      }

      // Check valid status transition
      if (!['changes_requested', 'in_revision'].includes(inv.reviewStatus)) {
        throw new BadRequestException(
          `Cannot resubmit from status: ${inv.reviewStatus}`,
        );
      }

      const now = new Date();

      const [updated] = await tx
        .update(intervention)
        .set({
          reviewStatus: 'resubmitted',
          submittedAt: now,
          revisionCount: inv.revisionCount + 1,
          updatedAt: now,
        })
        .where(eq(intervention.id, inv.id))
        .returning();

      // Add resubmit comment to current thread
      if (inv.currentReviewThreadId && dto.note) {
        await tx.insert(reviewComment).values({
          uid: generateUid('rvcm'),
          threadId: inv.currentReviewThreadId,
          authorId: userId,
          authorRole: 'field_worker',
          type: 'general',
          message: dto.note,
        });
      }

      // Get info for response
      const [userData] = await tx
        .select({ displayName: user.displayName })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      const [projectData] = await tx
        .select({ name: project.name })
        .from(project)
        .where(eq(project.id, inv.projectId))
        .limit(1);

      return {
        interventionId: updated.id,
        interventionUid: updated.uid,
        interventionHid: updated.hid,
        interventionName: updated.description || undefined,
        type: updated.type,
        reviewStatus: updated.reviewStatus as ReviewStatus,
        submittedAt: updated.submittedAt || undefined,
        userId: updated.userId,
        userName: userData?.displayName || 'Unknown',
        projectId: updated.projectId,
        projectName: projectData?.name || 'Unknown',
        siteId: updated.siteId || undefined,
        siteName: undefined,
        unresolvedIssuesCount: 0,
        revisionCount: updated.revisionCount,
        currentThreadId: updated.currentReviewThreadId || undefined,
      };
    });
  }

  // ================== Review Threads ==================

  async getInterventionThreads(
    interventionUid: string,
    query: ReviewThreadQueryDto,
  ): Promise<PaginatedResponse<ReviewThreadResponse>> {
    const { limit = 20, page = 1, status } = query;
    const offset = (page - 1) * limit;

    // Get intervention first
    const [inv] = await this.drizzleService.db
      .select({ id: intervention.id })
      .from(intervention)
      .where(
        and(
          eq(intervention.uid, interventionUid),
          isNull(intervention.deletedAt),
        ),
      )
      .limit(1);

    if (!inv) {
      throw new NotFoundException('Intervention not found');
    }

    const whereConditions = [eq(reviewThread.interventionId, inv.id)];

    if (status) {
      whereConditions.push(eq(reviewThread.status, status));
    }

    const [data, totalResult] = await Promise.all([
      this.drizzleService.db
        .select({
          id: reviewThread.id,
          uid: reviewThread.uid,
          interventionId: reviewThread.interventionId,
          threadNumber: reviewThread.threadNumber,
          status: reviewThread.status,
          resolution: reviewThread.resolution,
          resolvedAt: reviewThread.resolvedAt,
          resolvedById: reviewThread.resolvedById,
          resolvedByName: user.displayName,
          createdAt: reviewThread.createdAt,
          updatedAt: reviewThread.updatedAt,
        })
        .from(reviewThread)
        .leftJoin(user, eq(reviewThread.resolvedById, user.id))
        .where(and(...whereConditions))
        .orderBy(desc(reviewThread.threadNumber))
        .limit(limit)
        .offset(offset),
      this.drizzleService.db
        .select({ count: sql<number>`count(*)` })
        .from(reviewThread)
        .where(and(...whereConditions)),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    const formattedData: ReviewThreadResponse[] = data.map((d) => ({
      id: d.id,
      uid: d.uid,
      interventionId: d.interventionId,
      threadNumber: d.threadNumber,
      status: d.status as 'open' | 'resolved' | 'closed',
      resolution: d.resolution as ReviewDecision | undefined,
      resolvedAt: d.resolvedAt || undefined,
      resolvedBy: d.resolvedById
        ? { id: d.resolvedById, displayName: d.resolvedByName || 'Unknown' }
        : undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCurrentThread(interventionUid: string): Promise<ReviewThreadResponse | null> {
    const [result] = await this.drizzleService.db
      .select({
        id: reviewThread.id,
        uid: reviewThread.uid,
        interventionId: reviewThread.interventionId,
        threadNumber: reviewThread.threadNumber,
        status: reviewThread.status,
        resolution: reviewThread.resolution,
        resolvedAt: reviewThread.resolvedAt,
        resolvedById: reviewThread.resolvedById,
        resolvedByName: user.displayName,
        createdAt: reviewThread.createdAt,
        updatedAt: reviewThread.updatedAt,
      })
      .from(intervention)
      .innerJoin(reviewThread, eq(intervention.currentReviewThreadId, reviewThread.id))
      .leftJoin(user, eq(reviewThread.resolvedById, user.id))
      .where(
        and(
          eq(intervention.uid, interventionUid),
          isNull(intervention.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      uid: result.uid,
      interventionId: result.interventionId,
      threadNumber: result.threadNumber,
      status: result.status as 'open' | 'resolved' | 'closed',
      resolution: result.resolution as ReviewDecision | undefined,
      resolvedAt: result.resolvedAt || undefined,
      resolvedBy: result.resolvedById
        ? { id: result.resolvedById, displayName: result.resolvedByName || 'Unknown' }
        : undefined,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  // ================== Review Comments ==================

  async getThreadComments(
    threadUid: string,
  ): Promise<ReviewCommentResponse[]> {
    const [thread] = await this.drizzleService.db
      .select({ id: reviewThread.id })
      .from(reviewThread)
      .where(eq(reviewThread.uid, threadUid))
      .limit(1);

    if (!thread) {
      throw new NotFoundException('Review thread not found');
    }

    const comments = await this.drizzleService.db
      .select({
        id: reviewComment.id,
        uid: reviewComment.uid,
        threadId: reviewComment.threadId,
        parentCommentId: reviewComment.parentCommentId,
        authorId: reviewComment.authorId,
        authorName: user.displayName,
        authorImage: user.image,
        authorRole: reviewComment.authorRole,
        type: reviewComment.type,
        message: reviewComment.message,
        targetField: reviewComment.targetField,
        targetEntityType: reviewComment.targetEntityType,
        targetEntityUid: reviewComment.targetEntityUid,
        severity: reviewComment.severity,
        isResolved: reviewComment.isResolved,
        resolvedAt: reviewComment.resolvedAt,
        resolvedById: reviewComment.resolvedById,
        createdAt: reviewComment.createdAt,
        updatedAt: reviewComment.updatedAt,
      })
      .from(reviewComment)
      .leftJoin(user, eq(reviewComment.authorId, user.id))
      .where(
        and(
          eq(reviewComment.threadId, thread.id),
          isNull(reviewComment.deletedAt),
        ),
      )
      .orderBy(asc(reviewComment.createdAt));

    // Build nested structure
    const commentMap = new Map<number, ReviewCommentResponse>();
    const rootComments: ReviewCommentResponse[] = [];

    for (const c of comments) {
      const comment: ReviewCommentResponse = {
        id: c.id,
        uid: c.uid,
        threadId: c.threadId,
        parentCommentId: c.parentCommentId || undefined,
        author: {
          id: c.authorId,
          displayName: c.authorName || 'Unknown',
          image: c.authorImage || undefined,
        },
        authorRole: c.authorRole as any,
        type: c.type as any,
        message: c.message,
        targetField: c.targetField || undefined,
        targetEntityType: c.targetEntityType || undefined,
        targetEntityUid: c.targetEntityUid || undefined,
        severity: c.severity as any,
        isResolved: c.isResolved || false,
        resolvedAt: c.resolvedAt || undefined,
        resolvedBy: undefined,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        replies: [],
      };

      commentMap.set(c.id, comment);

      if (!c.parentCommentId) {
        rootComments.push(comment);
      }
    }

    // Link replies to parents
    for (const c of comments) {
      if (c.parentCommentId) {
        const parent = commentMap.get(c.parentCommentId);
        const child = commentMap.get(c.id);
        if (parent && child) {
          parent.replies = parent.replies || [];
          parent.replies.push(child);
        }
      }
    }

    return rootComments;
  }

  async addComment(
    threadUid: string,
    userId: number,
    authorRole: 'admin' | 'reviewer' | 'field_worker',
    dto: CreateReviewCommentDto,
  ): Promise<ReviewCommentResponse> {
    const [thread] = await this.drizzleService.db
      .select({ id: reviewThread.id })
      .from(reviewThread)
      .where(eq(reviewThread.uid, threadUid))
      .limit(1);

    if (!thread) {
      throw new NotFoundException('Review thread not found');
    }

    // Validate parent comment if provided
    if (dto.parentCommentId) {
      const [parent] = await this.drizzleService.db
        .select({ id: reviewComment.id })
        .from(reviewComment)
        .where(
          and(
            eq(reviewComment.id, dto.parentCommentId),
            eq(reviewComment.threadId, thread.id),
          ),
        )
        .limit(1);

      if (!parent) {
        throw new BadRequestException('Parent comment not found in this thread');
      }
    }

    // Validate issue comments have severity
    if (dto.type === 'issue' && !dto.severity) {
      throw new BadRequestException('Issue comments must have a severity');
    }

    const [inserted] = await this.drizzleService.db
      .insert(reviewComment)
      .values({
        uid: generateUid('rvcm'),
        threadId: thread.id,
        parentCommentId: dto.parentCommentId,
        authorId: userId,
        authorRole,
        type: dto.type,
        message: dto.message,
        targetField: dto.targetField,
        targetEntityType: dto.targetEntityType,
        targetEntityUid: dto.targetEntityUid,
        severity: dto.severity,
        isResolved: false,
      })
      .returning();

    // Get author info
    const [authorData] = await this.drizzleService.db
      .select({ displayName: user.displayName, image: user.image })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      id: inserted.id,
      uid: inserted.uid,
      threadId: inserted.threadId,
      parentCommentId: inserted.parentCommentId || undefined,
      author: {
        id: userId,
        displayName: authorData?.displayName || 'Unknown',
        image: authorData?.image || undefined,
      },
      authorRole: inserted.authorRole as any,
      type: inserted.type as any,
      message: inserted.message,
      targetField: inserted.targetField || undefined,
      targetEntityType: inserted.targetEntityType || undefined,
      targetEntityUid: inserted.targetEntityUid || undefined,
      severity: inserted.severity as any,
      isResolved: inserted.isResolved || false,
      resolvedAt: undefined,
      resolvedBy: undefined,
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
      replies: [],
    };
  }

  async markIssueAddressed(
    commentUid: string,
    userId: number,
    dto: MarkIssueAddressedDto,
  ): Promise<ReviewCommentResponse> {
    const [comment] = await this.drizzleService.db
      .select()
      .from(reviewComment)
      .where(
        and(
          eq(reviewComment.uid, commentUid),
          isNull(reviewComment.deletedAt),
        ),
      )
      .limit(1);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.type !== 'issue') {
      throw new BadRequestException('Only issue comments can be marked as addressed');
    }

    // Add a response comment
    await this.drizzleService.db.insert(reviewComment).values({
      uid: generateUid('rvcm'),
      threadId: comment.threadId,
      parentCommentId: comment.id,
      authorId: userId,
      authorRole: 'field_worker',
      type: 'response',
      message: dto.note || 'Issue has been addressed',
    });

    // Get updated comment with author info
    const [authorData] = await this.drizzleService.db
      .select({ displayName: user.displayName, image: user.image })
      .from(user)
      .where(eq(user.id, comment.authorId))
      .limit(1);

    return {
      id: comment.id,
      uid: comment.uid,
      threadId: comment.threadId,
      parentCommentId: comment.parentCommentId || undefined,
      author: {
        id: comment.authorId,
        displayName: authorData?.displayName || 'Unknown',
        image: authorData?.image || undefined,
      },
      authorRole: comment.authorRole as any,
      type: comment.type as any,
      message: comment.message,
      targetField: comment.targetField || undefined,
      targetEntityType: comment.targetEntityType || undefined,
      targetEntityUid: comment.targetEntityUid || undefined,
      severity: comment.severity as any,
      isResolved: comment.isResolved || false,
      resolvedAt: comment.resolvedAt || undefined,
      resolvedBy: undefined,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  async resolveIssue(
    commentUid: string,
    resolverId: number,
    dto: ResolveIssueDto,
  ): Promise<ReviewCommentResponse> {
    const now = new Date();

    const [comment] = await this.drizzleService.db
      .select()
      .from(reviewComment)
      .where(
        and(
          eq(reviewComment.uid, commentUid),
          isNull(reviewComment.deletedAt),
        ),
      )
      .limit(1);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.type !== 'issue') {
      throw new BadRequestException('Only issue comments can be resolved');
    }

    if (comment.isResolved) {
      throw new ConflictException('Issue is already resolved');
    }

    // Update the issue as resolved
    const [updated] = await this.drizzleService.db
      .update(reviewComment)
      .set({
        isResolved: true,
        resolvedAt: now,
        resolvedById: resolverId,
        updatedAt: now,
      })
      .where(eq(reviewComment.id, comment.id))
      .returning();

    // Add resolution comment if note provided
    if (dto.note) {
      await this.drizzleService.db.insert(reviewComment).values({
        uid: generateUid('rvcm'),
        threadId: comment.threadId,
        parentCommentId: comment.id,
        authorId: resolverId,
        authorRole: 'admin',
        type: 'resolution',
        message: dto.note,
      });
    }

    // Get author and resolver info
    const [authorData] = await this.drizzleService.db
      .select({ displayName: user.displayName, image: user.image })
      .from(user)
      .where(eq(user.id, comment.authorId))
      .limit(1);

    const [resolverData] = await this.drizzleService.db
      .select({ displayName: user.displayName })
      .from(user)
      .where(eq(user.id, resolverId))
      .limit(1);

    return {
      id: updated.id,
      uid: updated.uid,
      threadId: updated.threadId,
      parentCommentId: updated.parentCommentId || undefined,
      author: {
        id: updated.authorId,
        displayName: authorData?.displayName || 'Unknown',
        image: authorData?.image || undefined,
      },
      authorRole: updated.authorRole as any,
      type: updated.type as any,
      message: updated.message,
      targetField: updated.targetField || undefined,
      targetEntityType: updated.targetEntityType || undefined,
      targetEntityUid: updated.targetEntityUid || undefined,
      severity: updated.severity as any,
      isResolved: updated.isResolved || false,
      resolvedAt: updated.resolvedAt || undefined,
      resolvedBy: {
        id: resolverId,
        displayName: resolverData?.displayName || 'Unknown',
      },
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // ================== User Review Summary (Mobile) ==================

  async getUserReviewSummary(userId: number): Promise<UserReviewSummary> {
    // Get counts by status
    const statusCounts = await this.drizzleService.db
      .select({
        reviewStatus: intervention.reviewStatus,
        count: sql<number>`count(*)`,
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.userId, userId),
          isNull(intervention.deletedAt),
        ),
      )
      .groupBy(intervention.reviewStatus);

    const summary = {
      draft: 0,
      pending: 0,
      changes_requested: 0,
      in_revision: 0,
      resubmitted: 0,
      approved: 0,
      published: 0,
      rejected: 0,
    };

    for (const sc of statusCounts) {
      const key = sc.reviewStatus as keyof typeof summary;
      if (key in summary) {
        summary[key] = Number(sc.count);
      }
    }

    // Get interventions needing attention (changes_requested)
    const needsAttention = await this.drizzleService.db
      .select({
        interventionUid: intervention.uid,
        interventionHid: intervention.hid,
        description: intervention.description,
        currentThreadId: intervention.currentReviewThreadId,
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.userId, userId),
          eq(intervention.reviewStatus, 'changes_requested'),
          isNull(intervention.deletedAt),
        ),
      )
      .orderBy(desc(intervention.updatedAt))
      .limit(10);

    // Get unresolved issues count for each
    const threadIds = needsAttention
      .map((n) => n.currentThreadId)
      .filter((id): id is number => id !== null);

    let issuesMap: Map<number, number> = new Map();

    if (threadIds.length > 0) {
      const issuesCounts = await this.drizzleService.db
        .select({
          threadId: reviewComment.threadId,
          count: sql<number>`count(*)`,
        })
        .from(reviewComment)
        .where(
          and(
            inArray(reviewComment.threadId, threadIds),
            eq(reviewComment.type, 'issue'),
            eq(reviewComment.isResolved, false),
            isNull(reviewComment.deletedAt),
          ),
        )
        .groupBy(reviewComment.threadId);

      issuesMap = new Map(issuesCounts.map((ic) => [ic.threadId, Number(ic.count)]));
    }

    return {
      summary,
      needsAttention: needsAttention.map((n) => ({
        interventionUid: n.interventionUid,
        interventionHid: n.interventionHid,
        name: n.description || undefined,
        unresolvedIssues: n.currentThreadId ? issuesMap.get(n.currentThreadId) || 0 : 0,
        lastCommentAt: undefined, // Could add if needed
      })),
    };
  }

  // ================== Project Approval Settings ==================

  async checkProjectRequiresApproval(
    projectId: number,
  ): Promise<{ requiresApproval: boolean }> {
    // For now, all projects require approval workflow
    // This can be extended later to check a project setting
    const [proj] = await this.drizzleService.db
      .select({ id: project.id })
      .from(project)
      .where(eq(project.id, projectId))
      .limit(1);

    if (!proj) {
      throw new NotFoundException('Project not found');
    }

    // Return true for all projects - can be modified to check project.metadata
    // or a dedicated field when project-level settings are implemented
    return { requiresApproval: true };
  }

  // ================== Helper: Get Intervention Review Details ==================

  async getInterventionReviewDetails(
    interventionUid: string,
  ): Promise<InterventionReviewSummary> {
    const [result] = await this.drizzleService.db
      .select({
        interventionId: intervention.id,
        interventionUid: intervention.uid,
        interventionHid: intervention.hid,
        interventionDescription: intervention.description,
        type: intervention.type,
        reviewStatus: intervention.reviewStatus,
        submittedAt: intervention.submittedAt,
        revisionCount: intervention.revisionCount,
        currentThreadId: intervention.currentReviewThreadId,
        userId: intervention.userId,
        userName: user.displayName,
        projectId: intervention.projectId,
        projectName: project.name,
        siteId: intervention.siteId,
        siteName: site.name,
      })
      .from(intervention)
      .leftJoin(user, eq(intervention.userId, user.id))
      .leftJoin(project, eq(intervention.projectId, project.id))
      .leftJoin(site, eq(intervention.siteId, site.id))
      .where(
        and(
          eq(intervention.uid, interventionUid),
          isNull(intervention.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException('Intervention not found');
    }

    // Get unresolved issues count
    let unresolvedCount = 0;
    if (result.currentThreadId) {
      const [countResult] = await this.drizzleService.db
        .select({ count: sql<number>`count(*)` })
        .from(reviewComment)
        .where(
          and(
            eq(reviewComment.threadId, result.currentThreadId),
            eq(reviewComment.type, 'issue'),
            eq(reviewComment.isResolved, false),
            isNull(reviewComment.deletedAt),
          ),
        );
      unresolvedCount = Number(countResult?.count || 0);
    }

    return {
      interventionId: result.interventionId,
      interventionUid: result.interventionUid,
      interventionHid: result.interventionHid,
      interventionName: result.interventionDescription || undefined,
      type: result.type,
      reviewStatus: result.reviewStatus as ReviewStatus,
      submittedAt: result.submittedAt || undefined,
      userId: result.userId,
      userName: result.userName || 'Unknown',
      projectId: result.projectId,
      projectName: result.projectName || 'Unknown',
      siteId: result.siteId || undefined,
      siteName: result.siteName || undefined,
      unresolvedIssuesCount: unresolvedCount,
      revisionCount: result.revisionCount,
      currentThreadId: result.currentThreadId || undefined,
    };
  }
}
