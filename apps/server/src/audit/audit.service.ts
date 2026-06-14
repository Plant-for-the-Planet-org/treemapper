import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { auditLog, workspace, user } from '../database/schema/index'
import { DrizzleService } from '../database/drizzle.service'

export interface CreateAuditLogDto {
  action: 'create' | 'update' | 'delete' | 'soft_delete' | 'restore' | 'login' | 'logout' | 'invite' | 'accept_invite' | 'decline_invite' | 'role_change' | 'permission_change' | 'export' | 'import' | 'archive' | 'unarchive' | 'impersonation';
  entityId: number;
  entityUid?: string;
  userId?: number;
  workspaceId?: number;
  projectId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  source?: 'web' | 'mobile' | 'api' | 'system' | 'migration';
  ipAddress?: string;
}

export interface AuditLogQueryDto {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AuditService {
  private readonly tableToEntityMap: Record<string, string> = {
    'user': 'user',
    'workspace': 'workspace',
    'workspace_member': 'workspace_member',
    'project': 'project',
    'project_member': 'project_member',
    'site': 'site',
    'intervention': 'intervention',
    'tree': 'tree',
    'tree_record': 'tree_record',
    'scientific_species': 'scientific_species',
    'project_species': 'project_species',
    'species_request': 'species_request',
    'project_invite': 'project_invite',
    'bulk_invite': 'bulk_invite',
    'image': 'image',
    'notifications': 'notification',
    'migration': 'migration',
    'form': 'form'
  };

  constructor(private readonly drizzleService: DrizzleService) {}

  /**
   * Create an audit log entry
   */
  async createAuditLog(
    tableName: string,
    dto: CreateAuditLogDto
  ): Promise<any> {
    try {
      // Auto-map table name to entity type
      const entityType = this.tableToEntityMap[tableName];
      if (!entityType) {
        throw new Error(`Unsupported table for auditing: ${tableName}`);
      }

      // Calculate changed fields if both old and new values provided
      const changedFields = this.getChangedFields(dto.oldValues, dto.newValues);

      const auditData = {
        uid: this.generateUid('audit'),
        action: dto.action,
        entityType: entityType as any,
        entityId: dto.entityId,
        entityUid: dto.entityUid,
        userId: dto.userId,
        workspaceId: dto.workspaceId,
        projectId: dto.projectId,
        oldValues: dto.oldValues,
        newValues: dto.newValues,
        changedFields: changedFields,
        source: dto.source || 'web',
        ipAddress: dto.ipAddress,
        occurredAt: new Date()
      };

      const [auditLogEntry] = await this.drizzleService.db
        .insert(auditLog)
        .values(auditData)
        .returning();

      return auditLogEntry;
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error to prevent breaking main operations
      return null;
    }
  }

  /**
   * Fire-and-forget audit log — never throws, never awaited.
   * Call without `await` so it never blocks the response.
   */
  log(tableName: string, dto: CreateAuditLogDto): void {
    this.createAuditLog(tableName, dto).catch((e) =>
      console.error('Audit log failed (non-fatal):', e),
    );
  }

  /**
   * Get audit logs for an entire workspace, joined with user info
   */
  async getWorkspaceAuditLogs(
    workspaceUid: string,
    query: AuditLogQueryDto = {},
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const wsResult = await this.drizzleService.db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.uid, workspaceUid))
      .limit(1);

    if (wsResult.length === 0) throw new NotFoundException('Workspace not found');
    const workspaceId = wsResult[0].id;

    const { page = 1, limit = 25, action, entityType, startDate, endDate } = query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereConditions: any[] = [eq(auditLog.workspaceId, workspaceId)];
    if (action) whereConditions.push(eq(auditLog.action, action as any));
    if (entityType) whereConditions.push(eq(auditLog.entityType, entityType as any));
    if (startDate) whereConditions.push(gte(auditLog.occurredAt, new Date(startDate)));
    if (endDate) whereConditions.push(lte(auditLog.occurredAt, new Date(endDate)));

    const whereClause = and(...whereConditions);

    const [data, countResult] = await Promise.all([
      this.drizzleService.db
        .select({
          id: auditLog.id,
          uid: auditLog.uid,
          action: auditLog.action,
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          entityUid: auditLog.entityUid,
          changedFields: auditLog.changedFields,
          source: auditLog.source,
          occurredAt: auditLog.occurredAt,
          userUid: user.uid,
          userDisplayName: user.displayName,
          userEmail: user.email,
          userImage: user.image,
        })
        .from(auditLog)
        .leftJoin(user, eq(auditLog.userId, user.id))
        .where(whereClause)
        .orderBy(desc(auditLog.occurredAt))
        .limit(Number(limit))
        .offset(offset),

      this.drizzleService.db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLog)
        .where(whereClause),
    ]);

    return {
      data,
      total: countResult[0]?.count ?? 0,
      page: Number(page),
      limit: Number(limit),
    };
  }

  /**
   * Get audit logs for a specific project
   */
  async getProjectAuditLogs(
    projectId: number,
    query: AuditLogQueryDto = {}
  ): Promise<{ auditLogs: any[]; total: number }> {
    try {
      const { 
        page = 1, 
        limit = 50, 
        action, 
        entityType, 
        userId,
        startDate,
        endDate 
      } = query;
      
      const offset = (page - 1) * limit;

      // Build where conditions
      let whereConditions = [eq(auditLog.projectId, projectId)];

      if (action) {
        whereConditions.push(eq(auditLog.action, action as any));
      }

      if (entityType) {
        whereConditions.push(eq(auditLog.entityType, entityType as any));
      }

      if (userId) {
        whereConditions.push(eq(auditLog.userId, userId));
      }

      if (startDate) {
        whereConditions.push(gte(auditLog.occurredAt, new Date(startDate)));
      }

      if (endDate) {
        whereConditions.push(lte(auditLog.occurredAt, new Date(endDate)));
      }

      const whereClause = and(...whereConditions);

      // Get audit logs with pagination
      const [auditLogs] = await Promise.all([
        this.drizzleService.db
          .select({
            id: auditLog.id,
            uid: auditLog.uid,
            action: auditLog.action,
            entityType: auditLog.entityType,
            entityId: auditLog.entityId,
            entityUid: auditLog.entityUid,
            userId: auditLog.userId,
            workspaceId: auditLog.workspaceId,
            projectId: auditLog.projectId,
            oldValues: auditLog.oldValues,
            newValues: auditLog.newValues,
            changedFields: auditLog.changedFields,
            source: auditLog.source,
            ipAddress: auditLog.ipAddress,
            occurredAt: auditLog.occurredAt
          })
          .from(auditLog)
          .where(whereClause)
          .orderBy(desc(auditLog.occurredAt))
          .limit(limit)
          .offset(offset),

        // this.drizzleService.db
        //   .select()
        //   .from(auditLog)
        //   .where(whereClause)
      ]);

      return {
        auditLogs,
        total: 0
      };
    } catch (error) {
      console.error('Error fetching project audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditLogs(
    entityType: string,
    entityId: number,
    query: AuditLogQueryDto = {}
  ): Promise<{ auditLogs: any[]; total: number }> {
    try {
      const { page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      const whereConditions = [
        eq(auditLog.entityType, entityType as any),
        eq(auditLog.entityId, entityId)
      ];

      const whereClause = and(...whereConditions);

      const [auditLogs] = await Promise.all([
        this.drizzleService.db
          .select()
          .from(auditLog)
          .where(whereClause)
          .orderBy(desc(auditLog.occurredAt))
          .limit(limit)
          .offset(offset),

        // this.drizzleService.db
        //   .select({ count: count() })
        //   .from(auditLog)
        //   .where(whereClause)
      ]);

      return {
        auditLogs,
        total: 0
      };
    } catch (error) {
      console.error('Error fetching entity audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: number,
    query: AuditLogQueryDto = {}
  ): Promise<{ auditLogs: any[]; total: number }> {
    try {
      const { page = 1, limit = 50 } = query;
      const offset = (page - 1) * limit;

      const whereConditions = [eq(auditLog.userId, userId)];
      const whereClause = and(...whereConditions);

      const [auditLogs] = await Promise.all([
        this.drizzleService.db
          .select()
          .from(auditLog)
          .where(whereClause)
          .orderBy(desc(auditLog.occurredAt))
          .limit(limit)
          .offset(offset),

      ]);

      return {
        auditLogs,
        total: 0
      };
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      throw error;
    }
  }

  /**
   * Helper method to calculate changed fields
   */
  private getChangedFields(
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): string[] {
    if (!oldValues || !newValues) return [];

    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of allKeys) {
      // Skip audit fields and timestamps that always change
      if (['updatedAt', 'createdAt', 'id', 'uid'].includes(key)) continue;

      const oldValue = oldValues[key];
      const newValue = newValues[key];

      // Deep comparison for objects/arrays, simple comparison for primitives
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Generate UID for audit log
   */
  private generateUid(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
