import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { AuthzService } from '../auth/authz.service';
import {
  intervention,
  interventionSpecies,
  tree,
  reviewThread,
  reviewComment,
  user,
  project,
  site,
} from '../database/schema/index';
import { eq, and, or, desc, asc, sql, isNull, inArray, ilike, isNotNull } from 'drizzle-orm';
import { generateUid } from '../util/uidGenerator';
import { CacheService } from '../cache/cache.service';
import {
  ReviewQueueQueryDto,
  MakeDecisionDto,
  AddCommentDto,
  ReviewQueueResponse,
  ReviewThreadResponse,
  ReviewCommentResponse,
  UserReviewSummary,
  InterventionReviewSummary,
  SiteReviewSummary,
  SiteReviewQueueResponse,
  ReviewStatus,
  WorkspaceReviewQueueResponse,
  WorkspaceSiteReviewQueueResponse,
  WorkspaceInterventionReviewSummary,
  WorkspaceSiteReviewSummary,
} from './dto/approval-board.dto';

@Injectable()
export class ApprovalBoardService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly authzService: AuthzService,
    private readonly cacheService: CacheService,
  ) {}

  // Drop the public/external interventions cache so a newly approved (or
  // rejected) intervention is reflected immediately on the external API.
  private async invalidateExternalInterventions(projectId: number): Promise<void> {
    try {
      const [proj] = await this.drizzleService.db
        .select({ uid: project.uid })
        .from(project)
        .where(eq(project.id, projectId))
        .limit(1);
      if (proj?.uid) {
        await this.cacheService.delete(`external:interventions:${proj.uid}`);
      }
    } catch {
      // Cache invalidation is best-effort; the entry expires on its own.
    }
  }

  // ================== Review Queue (Admin) ==================

  async getReviewQueue(
    projectId: number,
    query: ReviewQueueQueryDto,
  ): Promise<ReviewQueueResponse> {
    const { limit = 20, page = 1, status, search, sortOrder = 'desc', sortBy = 'submittedAt' } = query;
    const offset = (page - 1) * limit;

    const whereConditions: any[] = [
      eq(intervention.projectId, projectId),
      isNull(intervention.deletedAt),
      isNotNull(intervention.reviewStatus), // only interventions under approval workflow
    ];

    if (status) {
      whereConditions.push(eq(intervention.reviewStatus, status));
    } else {
      // Default: show pending and in_review first
      whereConditions.push(
        inArray(intervention.reviewStatus, ['pending', 'in_review', 'approved', 'rejected']),
      );
    }

    if (search) {
      const searchCondition = or(
        ilike(intervention.hid, `%${search}%`),
        ilike(intervention.description, `%${search}%`),
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    const sortColumn =
      sortBy === 'submittedAt' ? intervention.submittedAt : intervention.updatedAt;

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
          approvedAt: intervention.approvedAt,
          rejectedAt: intervention.rejectedAt,
          userId: intervention.userId,
          userName: user.displayName,
          projectId: intervention.projectId,
          projectName: project.name,
          siteId: intervention.siteId,
          siteName: site.name,
          totalTreeCount: intervention.totalTreeCount,
          totalSampleTreeCount: intervention.totalSampleTreeCount,
          speciesCount: sql<number>`(SELECT COUNT(*) FROM intervention_species WHERE intervention_id = ${intervention.id} AND deleted_at IS NULL)`,
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

    const formattedData: InterventionReviewSummary[] = data.map((d) => ({
      interventionId: d.interventionId,
      interventionUid: d.interventionUid,
      interventionHid: d.interventionHid,
      interventionName: d.interventionDescription || undefined,
      type: d.type,
      reviewStatus: d.reviewStatus as ReviewStatus,
      submittedAt: d.submittedAt || undefined,
      approvedAt: d.approvedAt || undefined,
      rejectedAt: d.rejectedAt || undefined,
      userId: d.userId,
      userName: d.userName || 'Unknown',
      projectId: d.projectId,
      projectName: d.projectName || 'Unknown',
      siteId: d.siteId || undefined,
      siteName: d.siteName || undefined,
      totalTreeCount: d.totalTreeCount ?? 0,
      totalSampleTreeCount: d.totalSampleTreeCount ?? 0,
      speciesCount: Number(d.speciesCount) || 0,
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

  // ================== Start Review (pending → in_review) ==================

  async startReview(
    interventionUid: string,
    adminId: number,
  ): Promise<InterventionReviewSummary> {
    return this.drizzleService.db.transaction(async (tx) => {
      const [inv] = await tx
        .select()
        .from(intervention)
        .where(and(eq(intervention.uid, interventionUid), isNull(intervention.deletedAt)))
        .limit(1);

      if (!inv) throw new NotFoundException('Intervention not found');

      if (inv.reviewStatus !== 'pending') {
        throw new BadRequestException(
          `Cannot start review: intervention is in '${inv.reviewStatus}' state (must be 'pending')`,
        );
      }

      // Reuse existing open thread (may have been auto-created when commenting in pending state)
      const [existingThread] = await tx
        .select({ id: reviewThread.id })
        .from(reviewThread)
        .where(and(eq(reviewThread.interventionId, inv.id), eq(reviewThread.status, 'open')))
        .limit(1);

      // Update status
      await tx
        .update(intervention)
        .set({ reviewStatus: 'in_review' })
        .where(eq(intervention.id, inv.id));

      // Create thread only if one doesn't already exist
      if (!existingThread) {
        await tx.insert(reviewThread).values({
          uid: generateUid('rvth'),
          interventionId: inv.id,
          status: 'open',
        });
      }

      return this.getInterventionReviewStatus(interventionUid, tx);
    });
  }

  // ================== Make Decision (in_review → approved | rejected) ==================

  async makeDecision(
    interventionUid: string,
    adminId: number,
    dto: MakeDecisionDto,
  ): Promise<InterventionReviewSummary> {
    const decisionProjectId = { value: 0 };
    const result = await this.drizzleService.db.transaction(async (tx) => {
      const [inv] = await tx
        .select()
        .from(intervention)
        .where(and(eq(intervention.uid, interventionUid), isNull(intervention.deletedAt)))
        .limit(1);

      if (!inv) throw new NotFoundException('Intervention not found');

      if (inv.reviewStatus !== 'in_review') {
        throw new BadRequestException(
          `Cannot make decision: intervention is in '${inv.reviewStatus}' state (must be 'in_review')`,
        );
      }
      decisionProjectId.value = inv.projectId;

      const now = new Date();

      // Update intervention status
      const updateData: any = { reviewStatus: dto.decision };
      if (dto.decision === 'approved') {
        updateData.approvedAt = now;
        updateData.approvedById = adminId;
      } else {
        updateData.rejectedAt = now;
        updateData.rejectedById = adminId;
      }

      await tx.update(intervention).set(updateData).where(eq(intervention.id, inv.id));

      // Close the open thread
      const [openThread] = await tx
        .select({ id: reviewThread.id })
        .from(reviewThread)
        .where(and(eq(reviewThread.interventionId, inv.id), eq(reviewThread.status, 'open')))
        .limit(1);

      if (openThread) {
        await tx
          .update(reviewThread)
          .set({ status: 'closed', closedAt: now, closedById: adminId })
          .where(eq(reviewThread.id, openThread.id));

        // Add decision note as a comment if provided
        if (dto.note) {
          await tx.insert(reviewComment).values({
            uid: generateUid('rvcm'),
            threadId: openThread.id,
            authorId: adminId,
            authorRole: 'admin',
            message: `Decision: ${dto.decision}. ${dto.note}`,
          });
        }
      }

      return this.getInterventionReviewStatus(interventionUid, tx);
    });

    if (decisionProjectId.value) {
      await this.invalidateExternalInterventions(decisionProjectId.value);
    }
    return result;
  }

  // ================== Comments ==================

  async addComment(
    interventionUid: string,
    userId: number,
    role: 'admin' | 'contributor',
    dto: AddCommentDto,
    expectedProjectId?: number,
  ): Promise<ReviewCommentResponse> {
    const [inv] = await this.drizzleService.db
      .select({ id: intervention.id, projectId: intervention.projectId, reviewStatus: intervention.reviewStatus })
      .from(intervention)
      .where(and(eq(intervention.uid, interventionUid), isNull(intervention.deletedAt)))
      .limit(1);

    if (!inv) throw new NotFoundException('Intervention not found');

    if (expectedProjectId !== undefined && inv.projectId !== expectedProjectId) {
      throw new ForbiddenException('Intervention does not belong to this project');
    }

    // The admin path arrives with expectedProjectId set and is already authorized
    // by ApprovalDecisionGuard (superadmin, workspace owner, project owner/admin,
    // or an explicit approve permission). Only the unguarded field-worker path
    // needs a direct project-membership check here.
    if (expectedProjectId === undefined) {
      await this.authzService.assertProjectMembership(userId, inv.projectId);
    }

    if (inv.reviewStatus !== 'pending' && inv.reviewStatus !== 'in_review') {
      throw new BadRequestException(
        'Comments can only be added while the intervention is pending or in_review',
      );
    }

    const [openThread] = await this.drizzleService.db
      .select({ id: reviewThread.id })
      .from(reviewThread)
      .where(and(eq(reviewThread.interventionId, inv.id), eq(reviewThread.status, 'open')))
      .limit(1);

    if (!openThread) {
      throw new BadRequestException('No open review thread found for this intervention');
    }

    const [newComment] = await this.drizzleService.db
      .insert(reviewComment)
      .values({
        uid: generateUid('rvcm'),
        threadId: openThread.id,
        authorId: userId,
        authorRole: role,
        message: dto.message,
      })
      .returning();

    const [authorData] = await this.drizzleService.db
      .select({ id: user.id, displayName: user.displayName })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      id: newComment.id,
      uid: newComment.uid,
      author: { id: authorData.id, displayName: authorData.displayName },
      authorRole: newComment.authorRole,
      message: newComment.message,
      createdAt: newComment.createdAt,
      updatedAt: newComment.updatedAt,
    };
  }

  // ================== Current Thread ==================

  async getCurrentThread(interventionUid: string): Promise<ReviewThreadResponse | null> {
    const [inv] = await this.drizzleService.db
      .select({ id: intervention.id, reviewStatus: intervention.reviewStatus })
      .from(intervention)
      .where(and(eq(intervention.uid, interventionUid), isNull(intervention.deletedAt)))
      .limit(1);

    if (!inv) throw new NotFoundException('Intervention not found');

    // Intervention must be in the review workflow to have/create a thread
    if (!inv.reviewStatus) return null;

    let [thread] = await this.drizzleService.db
      .select({
        id: reviewThread.id,
        uid: reviewThread.uid,
        interventionId: reviewThread.interventionId,
        status: reviewThread.status,
        closedAt: reviewThread.closedAt,
        closedById: reviewThread.closedById,
        closedByName: user.displayName,
        createdAt: reviewThread.createdAt,
      })
      .from(reviewThread)
      .leftJoin(user, eq(reviewThread.closedById, user.id))
      .where(and(eq(reviewThread.interventionId, inv.id), eq(reviewThread.status, 'open')))
      .limit(1);

    // No open thread: fall back to the most recent thread (e.g. a closed one
    // after the intervention was approved/rejected) so its comments stay visible.
    if (!thread) {
      [thread] = await this.drizzleService.db
        .select({
          id: reviewThread.id,
          uid: reviewThread.uid,
          interventionId: reviewThread.interventionId,
          status: reviewThread.status,
          closedAt: reviewThread.closedAt,
          closedById: reviewThread.closedById,
          closedByName: user.displayName,
          createdAt: reviewThread.createdAt,
        })
        .from(reviewThread)
        .leftJoin(user, eq(reviewThread.closedById, user.id))
        .where(eq(reviewThread.interventionId, inv.id))
        .orderBy(desc(reviewThread.createdAt))
        .limit(1);
    }

    // Auto-create an open thread only if none exists at all (supports commenting in pending state)
    if (!thread) {
      const [newThread] = await this.drizzleService.db
        .insert(reviewThread)
        .values({
          uid: generateUid('rvth'),
          interventionId: inv.id,
          status: 'open',
        })
        .returning();

      thread = {
        id: newThread.id,
        uid: newThread.uid,
        interventionId: newThread.interventionId,
        status: newThread.status,
        closedAt: null,
        closedById: null,
        closedByName: null,
        createdAt: newThread.createdAt,
      };
    }

    const comments = await this.getCommentsByInterventionId(inv.id);

    return {
      id: thread.id,
      uid: thread.uid,
      interventionId: thread.interventionId ?? undefined,
      status: thread.status as 'open' | 'closed',
      closedAt: thread.closedAt || undefined,
      closedBy: thread.closedById
        ? { id: thread.closedById, displayName: thread.closedByName || 'Unknown' }
        : undefined,
      createdAt: thread.createdAt,
      comments,
    };
  }

  // ================== Comments by Thread ==================

  async getCommentsByThreadUid(threadUid: string): Promise<ReviewCommentResponse[]> {
    const [thread] = await this.drizzleService.db
      .select({ id: reviewThread.id })
      .from(reviewThread)
      .where(eq(reviewThread.uid, threadUid))
      .limit(1);

    if (!thread) throw new NotFoundException('Thread not found');

    return this.getCommentsByThreadId(thread.id);
  }

  private async getCommentsByThreadId(threadId: number): Promise<ReviewCommentResponse[]> {
    return this.getCommentsByThreadIds([threadId]);
  }

  // Fetch comments across one or more threads, oldest first. Used to show the
  // full discussion of an entity even after it is decided and its thread closed
  // (an entity may have more than one thread over its lifetime).
  private async getCommentsByThreadIds(threadIds: number[]): Promise<ReviewCommentResponse[]> {
    if (threadIds.length === 0) return [];

    const comments = await this.drizzleService.db
      .select({
        id: reviewComment.id,
        uid: reviewComment.uid,
        authorId: reviewComment.authorId,
        authorName: user.displayName,
        authorRole: reviewComment.authorRole,
        message: reviewComment.message,
        createdAt: reviewComment.createdAt,
        updatedAt: reviewComment.updatedAt,
      })
      .from(reviewComment)
      .leftJoin(user, eq(reviewComment.authorId, user.id))
      .where(and(inArray(reviewComment.threadId, threadIds), isNull(reviewComment.deletedAt)))
      .orderBy(asc(reviewComment.createdAt));

    return comments.map((c) => ({
      id: c.id,
      uid: c.uid,
      author: { id: c.authorId, displayName: c.authorName || 'Unknown' },
      authorRole: c.authorRole,
      message: c.message,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  // All comments for an intervention, across every thread, regardless of status.
  private async getCommentsByInterventionId(interventionId: number): Promise<ReviewCommentResponse[]> {
    const threads = await this.drizzleService.db
      .select({ id: reviewThread.id })
      .from(reviewThread)
      .where(eq(reviewThread.interventionId, interventionId));
    return this.getCommentsByThreadIds(threads.map((t) => t.id));
  }

  // All comments for a site, across every thread, regardless of status.
  private async getCommentsBySiteId(siteId: number): Promise<ReviewCommentResponse[]> {
    const threads = await this.drizzleService.db
      .select({ id: reviewThread.id })
      .from(reviewThread)
      .where(eq(reviewThread.siteId, siteId));
    return this.getCommentsByThreadIds(threads.map((t) => t.id));
  }

  async addCommentByThread(
    threadUid: string,
    userId: number,
    role: 'admin' | 'contributor',
    dto: AddCommentDto,
    expectedProjectId?: number,
  ): Promise<ReviewCommentResponse> {
    const [thread] = await this.drizzleService.db
      .select({ id: reviewThread.id, status: reviewThread.status, projectId: intervention.projectId })
      .from(reviewThread)
      .innerJoin(intervention, eq(reviewThread.interventionId, intervention.id))
      .where(eq(reviewThread.uid, threadUid))
      .limit(1);

    if (!thread) throw new NotFoundException('Thread not found');

    if (expectedProjectId !== undefined && thread.projectId !== expectedProjectId) {
      throw new ForbiddenException('Thread does not belong to this project');
    }

    // The admin path arrives with expectedProjectId set and is already authorized
    // by ApprovalDecisionGuard (superadmin, workspace owner, project owner/admin,
    // or an explicit approve permission). Only the unguarded field-worker path
    // needs a direct project-membership check here.
    if (expectedProjectId === undefined) {
      await this.authzService.assertProjectMembership(userId, thread.projectId);
    }

    if (thread.status !== 'open') {
      throw new BadRequestException('Cannot comment on a closed thread');
    }

    const [newComment] = await this.drizzleService.db
      .insert(reviewComment)
      .values({
        uid: generateUid('rvcm'),
        threadId: thread.id,
        authorId: userId,
        authorRole: role,
        message: dto.message,
      })
      .returning();

    const [authorData] = await this.drizzleService.db
      .select({ id: user.id, displayName: user.displayName })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      id: newComment.id,
      uid: newComment.uid,
      author: { id: authorData.id, displayName: authorData.displayName },
      authorRole: newComment.authorRole,
      message: newComment.message,
      createdAt: newComment.createdAt,
      updatedAt: newComment.updatedAt,
    };
  }

  async getInterventionComments(interventionUid: string): Promise<ReviewCommentResponse[]> {
    const [inv] = await this.drizzleService.db
      .select({ id: intervention.id })
      .from(intervention)
      .where(and(eq(intervention.uid, interventionUid), isNull(intervention.deletedAt)))
      .limit(1);

    if (!inv) throw new NotFoundException('Intervention not found');

    const threads = await this.drizzleService.db
      .select({ id: reviewThread.id })
      .from(reviewThread)
      .where(eq(reviewThread.interventionId, inv.id));

    if (threads.length === 0) return [];

    const threadIds = threads.map((t) => t.id);

    const comments = await this.drizzleService.db
      .select({
        id: reviewComment.id,
        uid: reviewComment.uid,
        authorId: reviewComment.authorId,
        authorName: user.displayName,
        authorRole: reviewComment.authorRole,
        message: reviewComment.message,
        createdAt: reviewComment.createdAt,
        updatedAt: reviewComment.updatedAt,
      })
      .from(reviewComment)
      .leftJoin(user, eq(reviewComment.authorId, user.id))
      .where(and(inArray(reviewComment.threadId, threadIds), isNull(reviewComment.deletedAt)))
      .orderBy(asc(reviewComment.createdAt));

    return comments.map((c) => ({
      id: c.id,
      uid: c.uid,
      author: { id: c.authorId, displayName: c.authorName || 'Unknown' },
      authorRole: c.authorRole,
      message: c.message,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  // ================== Review Status ==================

  async getInterventionReviewStatus(
    interventionUid: string,
    tx?: any,
  ): Promise<InterventionReviewSummary> {
    const db = tx || this.drizzleService.db;

    const [inv] = await db
      .select({
        interventionId: intervention.id,
        interventionUid: intervention.uid,
        interventionHid: intervention.hid,
        interventionDescription: intervention.description,
        type: intervention.type,
        reviewStatus: intervention.reviewStatus,
        submittedAt: intervention.submittedAt,
        totalTreeCount: intervention.totalTreeCount,
        totalSampleTreeCount: intervention.totalSampleTreeCount,
        approvedAt: intervention.approvedAt,
        rejectedAt: intervention.rejectedAt,
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
      .where(and(eq(intervention.uid, interventionUid), isNull(intervention.deletedAt)))
      .limit(1);

    if (!inv) throw new NotFoundException('Intervention not found');

    return {
      interventionId: inv.interventionId,
      interventionUid: inv.interventionUid,
      interventionHid: inv.interventionHid,
      interventionName: inv.interventionDescription || undefined,
      type: inv.type,
      reviewStatus: inv.reviewStatus as ReviewStatus,
      submittedAt: inv.submittedAt || undefined,
      approvedAt: inv.approvedAt || undefined,
      rejectedAt: inv.rejectedAt || undefined,
      userId: inv.userId,
      userName: inv.userName || 'Unknown',
      projectId: inv.projectId,
      projectName: inv.projectName || 'Unknown',
      siteId: inv.siteId || undefined,
      siteName: inv.siteName || undefined,
      totalTreeCount: inv.totalTreeCount ?? 0,
      totalSampleTreeCount: inv.totalSampleTreeCount ?? 0,
      speciesCount: 0,
    };
  }

  /**
   * Return a richer intervention details object used by the approval modal.
   * Includes intervention fields, species distribution, a sample of trees and simple aggregates.
   */
  async getInterventionDetails(interventionUid: string): Promise<any> {
    const db = this.drizzleService.db;

    const [inv] = await db
      .select({
        id: intervention.id,
        interventionUid: intervention.uid,
        interventionHid: intervention.hid,
        interventionDescription: intervention.description,
        type: intervention.type,
        // Return GeoJSON string for the location so we can parse it into an object
        location: sql`ST_AsGeoJSON(${intervention.location})`,
        image: intervention.image,
        area: intervention.area,
        totalTreeCount: intervention.totalTreeCount,
        totalSampleTreeCount: intervention.totalSampleTreeCount,
        registrationDate: intervention.registrationDate,
        interventionStartDate: intervention.interventionStartDate,
        interventionEndDate: intervention.interventionEndDate,
        isPrivate: intervention.isPrivate,
        captureMode: intervention.captureMode,
        captureStatus: intervention.captureStatus,
        metadata: intervention.metadata,
      })
      .from(intervention)
      .where(and(eq(intervention.uid, interventionUid), isNull(intervention.deletedAt)))
      .limit(1);

    if (!inv) throw new NotFoundException('Intervention not found');

    // Parse PostGIS GeoJSON string into an object (if present)
    const parsedLocation = inv.location ? JSON.parse(inv.location as unknown as string) : null;

    // Fetch species entries for this intervention
    const speciesRows = await db
      .select({
        speciesName: interventionSpecies.speciesName,
        commonName: interventionSpecies.commonName,
        speciesCount: interventionSpecies.speciesCount,
      })
      .from(interventionSpecies)
      .where(and(eq(interventionSpecies.interventionId, inv.id), isNull(interventionSpecies.deletedAt)));

    const speciesDistribution: Record<string, number> = {};
    for (const s of speciesRows) {
      const name = s.speciesName || s.commonName || 'Unknown';
      speciesDistribution[name] = (speciesDistribution[name] || 0) + Number(s.speciesCount || 0);
    }

    // Fetch trees sample
    const treeRows = await db
      .select({
        uid: tree.uid,
        hid: tree.hid,
        tag: tree.tag,
        speciesName: tree.speciesName,
        commonName: tree.commonName,
        height: tree.height,
        width: tree.width,
        latitude: tree.latitude,
        longitude: tree.longitude,
        image: tree.image,
      })
      .from(tree)
      .where(and(eq(tree.interventionId, inv.id), isNull(tree.deletedAt)))
      .orderBy(asc(tree.id))
      .limit(500);

    // If speciesDistribution empty, compute from trees
    if (Object.keys(speciesDistribution).length === 0) {
      for (const t of treeRows) {
        const name = t.speciesName || t.commonName || 'Unknown';
        speciesDistribution[name] = (speciesDistribution[name] || 0) + 1;
      }
    }

    // Aggregates
    const heights = treeRows.map((t) => (t.height !== null && t.height !== undefined ? Number(t.height) : null)).filter((v) => v !== null) as number[];
    const widths = treeRows.map((t) => (t.width !== null && t.width !== undefined ? Number(t.width) : null)).filter((v) => v !== null) as number[];
    const avgHeight = heights.length > 0 ? heights.reduce((a, b) => a + b, 0) / heights.length : null;
    const avgDbh = widths.length > 0 ? widths.reduce((a, b) => a + b, 0) / widths.length : null;

    // canopyCover may be stored in metadata
    const canopyCover = inv.metadata && (inv.metadata as any).canopyCover ? Number((inv.metadata as any).canopyCover) : null;

    const trees = treeRows.map((t) => ({
      uid: t.uid,
      hid: t.hid,
      tag: t.tag,
      species: t.speciesName,
      commonName: t.commonName,
      height: t.height,
      width: t.width,
      latitude: t.latitude,
      longitude: t.longitude,
      image: t.image,
    }));

    return {
      interventionUid: inv.interventionUid,
      interventionHid: inv.interventionHid,
      interventionName: inv.interventionDescription || undefined,
      description: inv.interventionDescription || undefined,
      image: inv.image || null,
      location: parsedLocation || null,
      area: inv.area || null,
      registrationDate: inv.registrationDate || null,
      interventionStartDate: inv.interventionStartDate || null,
      interventionEndDate: inv.interventionEndDate || null,
      isPrivate: inv.isPrivate,
      captureMode: inv.captureMode,
      captureStatus: inv.captureStatus,
      totalTreeCount: inv.totalTreeCount,
      totalSampleTreeCount: inv.totalSampleTreeCount,
      speciesDistribution,
      trees,
      avgHeight,
      avgDbh,
      canopyCover,
    };
  }

  // ================== User Review Summary (Mobile) ==================

  async getUserReviewSummary(userId: number): Promise<UserReviewSummary> {
    const counts = await this.drizzleService.db
      .select({
        reviewStatus: intervention.reviewStatus,
        count: sql<number>`count(*)`,
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.userId, userId),
          isNull(intervention.deletedAt),
          isNotNull(intervention.reviewStatus),
        ),
      )
      .groupBy(intervention.reviewStatus);

    const summary = { pending: 0, in_review: 0, approved: 0, rejected: 0 };
    for (const row of counts) {
      if (row.reviewStatus && row.reviewStatus in summary) {
        summary[row.reviewStatus as keyof typeof summary] = Number(row.count);
      }
    }

    const pendingList = await this.drizzleService.db
      .select({
        interventionUid: intervention.uid,
        interventionHid: intervention.hid,
        description: intervention.description,
        submittedAt: intervention.submittedAt,
        reviewStatus: intervention.reviewStatus,
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.userId, userId),
          isNull(intervention.deletedAt),
          inArray(intervention.reviewStatus, ['pending', 'in_review']),
        ),
      )
      .orderBy(desc(intervention.submittedAt))
      .limit(10);

    return {
      summary,
      pendingInterventions: pendingList.map((p) => ({
        interventionUid: p.interventionUid,
        interventionHid: p.interventionHid,
        name: p.description || undefined,
        submittedAt: p.submittedAt || undefined,
        reviewStatus: p.reviewStatus as ReviewStatus,
      })),
    };
  }

  // ================== Project Approval Check ==================

  async checkProjectRequiresApproval(projectId: number): Promise<{ requiresApproval: boolean }> {
    const [proj] = await this.drizzleService.db
      .select({ approvalBoardEnabled: project.approvalBoardEnabled })
      .from(project)
      .where(eq(project.id, projectId))
      .limit(1);

    return { requiresApproval: proj?.approvalBoardEnabled ?? false };
  }

  // ================== Site Review Queue (Admin) ==================

  async getSiteReviewQueue(
    projectId: number,
    query: ReviewQueueQueryDto,
  ): Promise<SiteReviewQueueResponse> {
    const { limit = 20, page = 1, status, search, sortOrder = 'desc', sortBy = 'submittedAt' } = query;
    const offset = (page - 1) * limit;

    const whereConditions: any[] = [
      eq(site.projectId, projectId),
      isNull(site.deletedAt),
      isNotNull(site.reviewStatus),
    ];

    if (status) {
      whereConditions.push(eq(site.reviewStatus, status));
    } else {
      whereConditions.push(
        inArray(site.reviewStatus, ['pending', 'in_review', 'approved', 'rejected']),
      );
    }

    if (search) {
      const searchCondition = ilike(site.name, `%${search}%`);
      whereConditions.push(searchCondition);
    }

    const sortColumn = sortBy === 'submittedAt' ? site.createdAt : site.updatedAt;

    const [data, totalResult] = await Promise.all([
      this.drizzleService.db
        .select({
          siteId: site.id,
          siteUid: site.uid,
          siteName: site.name,
          reviewStatus: site.reviewStatus,
          approvedAt: site.approvedAt,
          rejectedAt: site.rejectedAt,
          userId: site.createdById,
          userName: user.displayName,
          projectId: site.projectId,
          projectName: project.name,
        })
        .from(site)
        .leftJoin(user, eq(site.createdById, user.id))
        .leftJoin(project, eq(site.projectId, project.id))
        .where(and(...whereConditions))
        .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
        .limit(limit)
        .offset(offset),
      this.drizzleService.db
        .select({ count: sql<number>`count(*)` })
        .from(site)
        .where(and(...whereConditions)),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: data.map((d) => ({
        siteId: d.siteId,
        siteUid: d.siteUid,
        siteName: d.siteName,
        reviewStatus: d.reviewStatus as ReviewStatus,
        approvedAt: d.approvedAt || undefined,
        rejectedAt: d.rejectedAt || undefined,
        userId: d.userId,
        userName: d.userName || 'Unknown',
        projectId: d.projectId,
        projectName: d.projectName || 'Unknown',
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ================== Workspace Review Queues ==================

  async getWorkspaceReviewQueue(
    workspaceId: number,
    query: ReviewQueueQueryDto,
  ): Promise<WorkspaceReviewQueueResponse> {
    const { limit = 20, page = 1, status, search, sortOrder = 'desc', sortBy = 'submittedAt' } = query;
    const offset = (page - 1) * limit;

    const whereConditions: any[] = [
      eq(project.workspaceId, workspaceId),
      isNull(intervention.deletedAt),
      isNotNull(intervention.reviewStatus),
    ];

    if (status) {
      whereConditions.push(eq(intervention.reviewStatus, status));
    } else {
      whereConditions.push(
        inArray(intervention.reviewStatus, ['pending', 'in_review', 'approved', 'rejected']),
      );
    }

    if (search) {
      const searchCondition = or(
        ilike(intervention.hid, `%${search}%`),
        ilike(intervention.description, `%${search}%`),
      );
      if (searchCondition) whereConditions.push(searchCondition);
    }

    const sortColumn = sortBy === 'submittedAt' ? intervention.submittedAt : intervention.updatedAt;

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
          approvedAt: intervention.approvedAt,
          rejectedAt: intervention.rejectedAt,
          userId: intervention.userId,
          userName: user.displayName,
          projectId: intervention.projectId,
          projectUid: project.uid,
          projectName: project.name,
          siteId: intervention.siteId,
          siteName: site.name,
          totalTreeCount: intervention.totalTreeCount,
          totalSampleTreeCount: intervention.totalSampleTreeCount,
          speciesCount: sql<number>`(SELECT COUNT(*) FROM intervention_species WHERE intervention_id = ${intervention.id} AND deleted_at IS NULL)`,
        })
        .from(intervention)
        .innerJoin(project, eq(intervention.projectId, project.id))
        .leftJoin(user, eq(intervention.userId, user.id))
        .leftJoin(site, eq(intervention.siteId, site.id))
        .where(and(...whereConditions))
        .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
        .limit(limit)
        .offset(offset),
      this.drizzleService.db
        .select({ count: sql<number>`count(*)` })
        .from(intervention)
        .innerJoin(project, eq(intervention.projectId, project.id))
        .where(and(...whereConditions)),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    const formattedData: WorkspaceInterventionReviewSummary[] = data.map((d) => ({
      interventionId: d.interventionId,
      interventionUid: d.interventionUid,
      interventionHid: d.interventionHid,
      interventionName: d.interventionDescription || undefined,
      type: d.type,
      reviewStatus: d.reviewStatus as ReviewStatus,
      submittedAt: d.submittedAt || undefined,
      approvedAt: d.approvedAt || undefined,
      rejectedAt: d.rejectedAt || undefined,
      userId: d.userId,
      userName: d.userName || 'Unknown',
      projectId: d.projectId,
      projectUid: d.projectUid,
      projectName: d.projectName || 'Unknown',
      siteId: d.siteId || undefined,
      siteName: d.siteName || undefined,
      totalTreeCount: d.totalTreeCount ?? 0,
      totalSampleTreeCount: d.totalSampleTreeCount ?? 0,
      speciesCount: Number(d.speciesCount) || 0,
    }));

    return {
      data: formattedData,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getWorkspaceSiteReviewQueue(
    workspaceId: number,
    query: ReviewQueueQueryDto,
  ): Promise<WorkspaceSiteReviewQueueResponse> {
    const { limit = 20, page = 1, status, search, sortOrder = 'desc', sortBy = 'submittedAt' } = query;
    const offset = (page - 1) * limit;

    const whereConditions: any[] = [
      eq(project.workspaceId, workspaceId),
      isNull(site.deletedAt),
      isNotNull(site.reviewStatus),
    ];

    if (status) {
      whereConditions.push(eq(site.reviewStatus, status));
    } else {
      whereConditions.push(
        inArray(site.reviewStatus, ['pending', 'in_review', 'approved', 'rejected']),
      );
    }

    if (search) {
      whereConditions.push(ilike(site.name, `%${search}%`));
    }

    const sortColumn = sortBy === 'submittedAt' ? site.createdAt : site.updatedAt;

    const [data, totalResult] = await Promise.all([
      this.drizzleService.db
        .select({
          siteId: site.id,
          siteUid: site.uid,
          siteName: site.name,
          reviewStatus: site.reviewStatus,
          approvedAt: site.approvedAt,
          rejectedAt: site.rejectedAt,
          userId: site.createdById,
          userName: user.displayName,
          projectId: site.projectId,
          projectUid: project.uid,
          projectName: project.name,
        })
        .from(site)
        .innerJoin(project, eq(site.projectId, project.id))
        .leftJoin(user, eq(site.createdById, user.id))
        .where(and(...whereConditions))
        .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
        .limit(limit)
        .offset(offset),
      this.drizzleService.db
        .select({ count: sql<number>`count(*)` })
        .from(site)
        .innerJoin(project, eq(site.projectId, project.id))
        .where(and(...whereConditions)),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: data.map((d) => ({
        siteId: d.siteId,
        siteUid: d.siteUid,
        siteName: d.siteName,
        reviewStatus: d.reviewStatus as ReviewStatus,
        approvedAt: d.approvedAt || undefined,
        rejectedAt: d.rejectedAt || undefined,
        userId: d.userId,
        userName: d.userName || 'Unknown',
        projectId: d.projectId,
        projectUid: d.projectUid,
        projectName: d.projectName || 'Unknown',
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ================== Start Site Review (pending → in_review) ==================

  async startSiteReview(siteUid: string, adminId: number): Promise<SiteReviewSummary> {
    return this.drizzleService.db.transaction(async (tx) => {
      const [s] = await tx
        .select()
        .from(site)
        .where(and(eq(site.uid, siteUid), isNull(site.deletedAt)))
        .limit(1);

      if (!s) throw new NotFoundException('Site not found');

      if (s.reviewStatus !== 'pending') {
        throw new BadRequestException(
          `Cannot start review: site is in '${s.reviewStatus}' state (must be 'pending')`,
        );
      }

      const [existingThread] = await tx
        .select({ id: reviewThread.id })
        .from(reviewThread)
        .where(and(eq(reviewThread.siteId, s.id), eq(reviewThread.status, 'open')))
        .limit(1);

      await tx.update(site).set({ reviewStatus: 'in_review' }).where(eq(site.id, s.id));

      if (!existingThread) {
        await tx.insert(reviewThread).values({
          uid: generateUid('rvth'),
          siteId: s.id,
          status: 'open',
        });
      }

      return this.getSiteReviewStatus(siteUid, tx);
    });
  }

  // ================== Make Site Decision (in_review → approved | rejected) ==================

  async makeSiteDecision(
    siteUid: string,
    adminId: number,
    dto: MakeDecisionDto,
  ): Promise<SiteReviewSummary> {
    return this.drizzleService.db.transaction(async (tx) => {
      const [s] = await tx
        .select()
        .from(site)
        .where(and(eq(site.uid, siteUid), isNull(site.deletedAt)))
        .limit(1);

      if (!s) throw new NotFoundException('Site not found');

      if (s.reviewStatus !== 'in_review') {
        throw new BadRequestException(
          `Cannot make decision: site is in '${s.reviewStatus}' state (must be 'in_review')`,
        );
      }

      const now = new Date();
      const updateData: any = { reviewStatus: dto.decision };
      if (dto.decision === 'approved') {
        updateData.approvedAt = now;
        updateData.approvedById = adminId;
      } else {
        updateData.rejectedAt = now;
        updateData.rejectedById = adminId;
      }

      await tx.update(site).set(updateData).where(eq(site.id, s.id));

      const [openThread] = await tx
        .select({ id: reviewThread.id })
        .from(reviewThread)
        .where(and(eq(reviewThread.siteId, s.id), eq(reviewThread.status, 'open')))
        .limit(1);

      if (openThread) {
        await tx
          .update(reviewThread)
          .set({ status: 'closed', closedAt: now, closedById: adminId })
          .where(eq(reviewThread.id, openThread.id));

        if (dto.note) {
          await tx.insert(reviewComment).values({
            uid: generateUid('rvcm'),
            threadId: openThread.id,
            authorId: adminId,
            authorRole: 'admin',
            message: `Decision: ${dto.decision}. ${dto.note}`,
          });
        }
      }

      return this.getSiteReviewStatus(siteUid, tx);
    });
  }

  // ================== Site Comments ==================

  async addSiteComment(
    siteUid: string,
    userId: number,
    role: 'admin' | 'contributor',
    dto: AddCommentDto,
  ): Promise<ReviewCommentResponse> {
    const [s] = await this.drizzleService.db
      .select({ id: site.id, reviewStatus: site.reviewStatus })
      .from(site)
      .where(and(eq(site.uid, siteUid), isNull(site.deletedAt)))
      .limit(1);

    if (!s) throw new NotFoundException('Site not found');

    if (s.reviewStatus !== 'pending' && s.reviewStatus !== 'in_review') {
      throw new BadRequestException('Comments can only be added while the site is pending or in_review');
    }

    const [openThread] = await this.drizzleService.db
      .select({ id: reviewThread.id })
      .from(reviewThread)
      .where(and(eq(reviewThread.siteId, s.id), eq(reviewThread.status, 'open')))
      .limit(1);

    if (!openThread) {
      throw new BadRequestException('No open review thread found for this site');
    }

    const [newComment] = await this.drizzleService.db
      .insert(reviewComment)
      .values({
        uid: generateUid('rvcm'),
        threadId: openThread.id,
        authorId: userId,
        authorRole: role,
        message: dto.message,
      })
      .returning();

    const [authorData] = await this.drizzleService.db
      .select({ id: user.id, displayName: user.displayName })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      id: newComment.id,
      uid: newComment.uid,
      author: { id: authorData.id, displayName: authorData.displayName },
      authorRole: newComment.authorRole,
      message: newComment.message,
      createdAt: newComment.createdAt,
      updatedAt: newComment.updatedAt,
    };
  }

  // ================== Current Site Thread ==================

  async getCurrentSiteThread(siteUid: string): Promise<ReviewThreadResponse | null> {
    const [s] = await this.drizzleService.db
      .select({ id: site.id, reviewStatus: site.reviewStatus })
      .from(site)
      .where(and(eq(site.uid, siteUid), isNull(site.deletedAt)))
      .limit(1);

    if (!s) throw new NotFoundException('Site not found');

    if (!s.reviewStatus) return null;

    let [thread] = await this.drizzleService.db
      .select({
        id: reviewThread.id,
        uid: reviewThread.uid,
        status: reviewThread.status,
        closedAt: reviewThread.closedAt,
        closedById: reviewThread.closedById,
        closedByName: user.displayName,
        createdAt: reviewThread.createdAt,
      })
      .from(reviewThread)
      .leftJoin(user, eq(reviewThread.closedById, user.id))
      .where(and(eq(reviewThread.siteId, s.id), eq(reviewThread.status, 'open')))
      .limit(1);

    // No open thread: fall back to the most recent thread (e.g. a closed one
    // after the site was approved/rejected) so its comments stay visible.
    if (!thread) {
      [thread] = await this.drizzleService.db
        .select({
          id: reviewThread.id,
          uid: reviewThread.uid,
          status: reviewThread.status,
          closedAt: reviewThread.closedAt,
          closedById: reviewThread.closedById,
          closedByName: user.displayName,
          createdAt: reviewThread.createdAt,
        })
        .from(reviewThread)
        .leftJoin(user, eq(reviewThread.closedById, user.id))
        .where(eq(reviewThread.siteId, s.id))
        .orderBy(desc(reviewThread.createdAt))
        .limit(1);
    }

    if (!thread) {
      const [newThread] = await this.drizzleService.db
        .insert(reviewThread)
        .values({
          uid: generateUid('rvth'),
          siteId: s.id,
          status: 'open',
        })
        .returning();

      thread = {
        id: newThread.id,
        uid: newThread.uid,
        status: newThread.status,
        closedAt: null,
        closedById: null,
        closedByName: null,
        createdAt: newThread.createdAt,
      };
    }

    const comments = await this.getCommentsBySiteId(s.id);

    return {
      id: thread.id,
      uid: thread.uid,
      siteId: s.id,
      status: thread.status as 'open' | 'closed',
      closedAt: thread.closedAt || undefined,
      closedBy: thread.closedById
        ? { id: thread.closedById, displayName: thread.closedByName || 'Unknown' }
        : undefined,
      createdAt: thread.createdAt,
      comments,
    };
  }

  // ================== Site Review Status ==================

  async getSiteReviewStatus(siteUid: string, tx?: any): Promise<SiteReviewSummary> {
    const db = tx || this.drizzleService.db;

    const [s] = await db
      .select({
        siteId: site.id,
        siteUid: site.uid,
        siteName: site.name,
        reviewStatus: site.reviewStatus,
        approvedAt: site.approvedAt,
        rejectedAt: site.rejectedAt,
        userId: site.createdById,
        userName: user.displayName,
        projectId: site.projectId,
        projectName: project.name,
      })
      .from(site)
      .leftJoin(user, eq(site.createdById, user.id))
      .leftJoin(project, eq(site.projectId, project.id))
      .where(and(eq(site.uid, siteUid), isNull(site.deletedAt)))
      .limit(1);

    if (!s) throw new NotFoundException('Site not found');

    return {
      siteId: s.siteId,
      siteUid: s.siteUid,
      siteName: s.siteName,
      reviewStatus: s.reviewStatus as ReviewStatus,
      approvedAt: s.approvedAt || undefined,
      rejectedAt: s.rejectedAt || undefined,
      userId: s.userId,
      userName: s.userName || 'Unknown',
      projectId: s.projectId,
      projectName: s.projectName || 'Unknown',
    };
  }
}
