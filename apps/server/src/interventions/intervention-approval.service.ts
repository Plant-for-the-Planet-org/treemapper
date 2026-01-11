import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  intervention,
  project,
  projectMember,
  user,
  ApprovalComment,
  ApprovalHistoryEntry,
} from '../database/schema';
import { v4 as uuidv4 } from 'uuid';

export interface ApprovalBoardFilters {
  projectId: number;
  status?: 'new_request' | 'in_review' | 'approved' | 'rejected' | 'needs_revision';
  userId?: number;
}

export interface InterventionApprovalStatus {
  interventionId: number;
  interventionUid: string;
  interventionHid: string;
  type: string;
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  approvalStatus: string;
  submittedForReviewAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  approvedBy: {
    id: number;
    name: string;
  } | null;
  comments: ApprovalComment[];
  history: ApprovalHistoryEntry[];
  interventionData: any;
}

export interface MoveInterventionStatusDto {
  interventionId: number;
  newStatus: 'new_request' | 'in_review' | 'approved' | 'rejected' | 'needs_revision';
  comment?: string;
  isInternal?: boolean;
  userId: number;
  userName: string;
  userRole: 'owner' | 'admin' | 'contributor' | 'observer';
}

export interface AddCommentDto {
  interventionId: number;
  comment: string;
  isInternal?: boolean;
  userId: number;
  userName: string;
  userRole: 'owner' | 'admin' | 'contributor' | 'observer';
}

export interface EditInterventionDataDto {
  interventionId: number;
  userId: number;
  userName: string;
  updates: Partial<{
    description: string;
    type: string;
    totalTreeCount: number;
    location: any;
    area: number;
  }>;
}

@Injectable()
export class InterventionApprovalService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getApprovalBoard(filters: ApprovalBoardFilters): Promise<InterventionApprovalStatus[]> {
    const db = this.databaseService.db;

    const conditions = [
      eq(intervention.projectId, filters.projectId),
      isNotNull(intervention.approvalStatus),
      isNull(intervention.deletedAt),
    ];

    if (filters.status) {
      conditions.push(eq(intervention.approvalStatus, filters.status));
    }

    if (filters.userId) {
      conditions.push(eq(intervention.userId, filters.userId));
    }

    const interventions = await db
      .select({
        intervention: intervention,
        creator: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          image: user.image,
        },
        approver: {
          id: user.id,
          displayName: user.displayName,
        },
      })
      .from(intervention)
      .innerJoin(user, eq(intervention.userId, user.id))
      .leftJoin(
        sql`${user} AS approver`,
        sql`${intervention.approvedById} = approver.id`,
      )
      .where(and(...conditions))
      .orderBy(sql`COALESCE(${intervention.submittedForReviewAt}, ${intervention.createdAt}) DESC`);

    return interventions.map((row) => ({
      interventionId: row.intervention.id,
      interventionUid: row.intervention.uid,
      interventionHid: row.intervention.hid,
      type: row.intervention.type,
      createdBy: {
        id: row.creator.id,
        name: row.creator.displayName,
        email: row.creator.email,
      },
      approvalStatus: row.intervention.approvalStatus!,
      submittedForReviewAt: row.intervention.submittedForReviewAt,
      approvedAt: row.intervention.approvedAt,
      rejectedAt: row.intervention.rejectedAt,
      approvedBy: row.approver?.id
        ? {
            id: row.approver.id,
            name: row.approver.displayName!,
          }
        : null,
      comments: (row.intervention.approvalComments as ApprovalComment[]) || [],
      history: (row.intervention.approvalHistory as ApprovalHistoryEntry[]) || [],
      interventionData: {
        description: row.intervention.description,
        location: row.intervention.location,
        area: row.intervention.area,
        totalTreeCount: row.intervention.totalTreeCount,
        registrationDate: row.intervention.registrationDate,
        interventionStartDate: row.intervention.interventionStartDate,
        interventionEndDate: row.intervention.interventionEndDate,
        image: row.intervention.image,
      },
    }));
  }

  async moveInterventionStatus(dto: MoveInterventionStatusDto): Promise<InterventionApprovalStatus> {
    const db = this.databaseService.db;

    const existingIntervention = await db.query.intervention.findFirst({
      where: and(eq(intervention.id, dto.interventionId), isNull(intervention.deletedAt)),
    });

    if (!existingIntervention) {
      throw new NotFoundException('Intervention not found');
    }

    const currentStatus = existingIntervention.approvalStatus;

    const historyEntry: ApprovalHistoryEntry = {
      uid: uuidv4(),
      userId: dto.userId,
      userName: dto.userName,
      action: this.getActionFromStatusTransition(currentStatus, dto.newStatus),
      fromStatus: currentStatus || undefined,
      toStatus: dto.newStatus,
      comment: dto.comment,
      timestamp: new Date().toISOString(),
    };

    const existingHistory = (existingIntervention.approvalHistory as ApprovalHistoryEntry[]) || [];
    const newHistory = [...existingHistory, historyEntry];

    let commentToAdd: ApprovalComment | null = null;
    const existingComments = (existingIntervention.approvalComments as ApprovalComment[]) || [];

    if (dto.comment) {
      commentToAdd = {
        uid: uuidv4(),
        userId: dto.userId,
        userName: dto.userName,
        userRole: dto.userRole,
        comment: dto.comment,
        isInternal: dto.isInternal || false,
        createdAt: new Date().toISOString(),
      };
    }

    const newComments = commentToAdd ? [...existingComments, commentToAdd] : existingComments;

    const updates: any = {
      approvalStatus: dto.newStatus,
      approvalHistory: newHistory,
      approvalComments: newComments,
      updatedAt: new Date(),
    };

    if (dto.newStatus === 'in_review') {
      updates.submittedForReviewAt = new Date();
    }

    if (dto.newStatus === 'approved') {
      updates.approvedAt = new Date();
      updates.approvedById = dto.userId;
      updates.rejectedAt = null;
    }

    if (dto.newStatus === 'rejected') {
      updates.rejectedAt = new Date();
      updates.approvedAt = null;
      updates.approvedById = null;
    }

    if (dto.newStatus === 'needs_revision') {
      updates.rejectedAt = null;
      updates.approvedAt = null;
    }

    await db.update(intervention).set(updates).where(eq(intervention.id, dto.interventionId));

    const filters: ApprovalBoardFilters = {
      projectId: existingIntervention.projectId,
    };

    const allInterventions = await this.getApprovalBoard(filters);
    return allInterventions.find((i) => i.interventionId === dto.interventionId)!;
  }

  async addComment(dto: AddCommentDto): Promise<InterventionApprovalStatus> {
    const db = this.databaseService.db;

    const existingIntervention = await db.query.intervention.findFirst({
      where: and(eq(intervention.id, dto.interventionId), isNull(intervention.deletedAt)),
    });

    if (!existingIntervention) {
      throw new NotFoundException('Intervention not found');
    }

    const newComment: ApprovalComment = {
      uid: uuidv4(),
      userId: dto.userId,
      userName: dto.userName,
      userRole: dto.userRole,
      comment: dto.comment,
      isInternal: dto.isInternal || false,
      createdAt: new Date().toISOString(),
    };

    const existingComments = (existingIntervention.approvalComments as ApprovalComment[]) || [];
    const newComments = [...existingComments, newComment];

    await db
      .update(intervention)
      .set({
        approvalComments: newComments,
        updatedAt: new Date(),
      })
      .where(eq(intervention.id, dto.interventionId));

    const filters: ApprovalBoardFilters = {
      projectId: existingIntervention.projectId,
    };

    const allInterventions = await this.getApprovalBoard(filters);
    return allInterventions.find((i) => i.interventionId === dto.interventionId)!;
  }

  async editInterventionData(dto: EditInterventionDataDto): Promise<InterventionApprovalStatus> {
    const db = this.databaseService.db;

    const existingIntervention = await db.query.intervention.findFirst({
      where: and(eq(intervention.id, dto.interventionId), isNull(intervention.deletedAt)),
    });

    if (!existingIntervention) {
      throw new NotFoundException('Intervention not found');
    }

    const changedFields = Object.keys(dto.updates);

    const historyEntry: ApprovalHistoryEntry = {
      uid: uuidv4(),
      userId: dto.userId,
      userName: dto.userName,
      action: 'data_edited',
      toStatus: existingIntervention.approvalStatus || 'new_request',
      changedFields,
      timestamp: new Date().toISOString(),
    };

    const existingHistory = (existingIntervention.approvalHistory as ApprovalHistoryEntry[]) || [];
    const newHistory = [...existingHistory, historyEntry];

    await db
      .update(intervention)
      .set({
        ...dto.updates,
        approvalHistory: newHistory,
        editedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(intervention.id, dto.interventionId));

    const filters: ApprovalBoardFilters = {
      projectId: existingIntervention.projectId,
    };

    const allInterventions = await this.getApprovalBoard(filters);
    return allInterventions.find((i) => i.interventionId === dto.interventionId)!;
  }

  async checkProjectRequiresApproval(projectId: number): Promise<boolean> {
    const db = this.databaseService.db;

    const projectData = await db.query.project.findFirst({
      where: eq(project.id, projectId),
    });

    if (!projectData) {
      throw new NotFoundException('Project not found');
    }

    return projectData.requiresInterventionApproval || false;
  }

  async setInitialApprovalStatus(
    interventionId: number,
    userId: number,
    projectId: number,
    userRole: 'owner' | 'admin' | 'contributor' | 'observer',
  ): Promise<void> {
    const db = this.databaseService.db;

    const requiresApproval = await this.checkProjectRequiresApproval(projectId);

    if (!requiresApproval) {
      return;
    }

    const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';

    if (isAdminOrOwner) {
      await db
        .update(intervention)
        .set({
          approvalStatus: 'approved',
          approvedAt: new Date(),
          approvedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(intervention.id, interventionId));
    } else {
      await db
        .update(intervention)
        .set({
          approvalStatus: 'new_request',
          updatedAt: new Date(),
        })
        .where(eq(intervention.id, interventionId));
    }
  }

  private getActionFromStatusTransition(
    from: string | null,
    to: string,
  ): ApprovalHistoryEntry['action'] {
    if (!from) return 'submitted';
    if (to === 'in_review') return 'moved_to_review';
    if (to === 'approved') return 'approved';
    if (to === 'rejected') return 'rejected';
    if (to === 'needs_revision') return 'requested_revision';
    if (from === 'needs_revision' && to === 'in_review') return 'resubmitted';
    return 'submitted';
  }
}
