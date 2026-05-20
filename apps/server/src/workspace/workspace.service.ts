// src/organizations/organizations.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, asc, isNull, inArray, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { CreateNewWorkspaceDto } from './dto/create-organization.dto';
import { OrganizationResponseDto, SelectOrganizationDto } from './dto/organization-response.dto';
import { project, projectMember, site, user, workspace, workspaceMember, DEFAULT_WORKSPACE_SETTINGS, WorkspaceSettings } from '../database/schema/index';
import { DrizzleService } from 'src/database/drizzle.service';
import { generateUid } from 'src/util/uidGenerator';
import { UserCacheService } from 'src/cache/user-cache.service';
import { CACHE_KEYS, CACHE_TTL } from 'src/cache/cache-keys';
import { User } from 'src/users/entities/user.entity';
import { ProjectCacheService } from 'src/cache/project-cache.service';
import { AuditService } from 'src/audit/audit.service';

type WorkspaceSettingsPatch = Omit<Partial<WorkspaceSettings>, 'notifications'> & {
  notifications?: Partial<WorkspaceSettings['notifications']>;
};

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly drizzle: DrizzleService,
    private userCacheService: UserCacheService,
    private projectCacheService: ProjectCacheService,
    private readonly auditService: AuditService,
  ) { }


  async createNewWorkspace(createWorkspaceDto: CreateNewWorkspaceDto, userId: number): Promise<Boolean> {
    const slug = await this.generateUniqueSlug(createWorkspaceDto.name)
    try {
      const result = await this.drizzle.db.transaction(async (tx) => {
        const workspaceInsResult = await tx
          .insert(workspace)
          .values({
            uid: generateUid('work'),
            name: createWorkspaceDto.name,
            slug: slug,
            createdById: userId,
            type: (['platform', 'private', 'development', 'premium'].includes(createWorkspaceDto.type)
              ? createWorkspaceDto.type
              : 'private') as 'platform' | 'private' | 'development' | 'premium'
          })
          .returning();

        if (!Array.isArray(workspaceInsResult) || workspaceInsResult.length === 0) {
          throw new BadRequestException('Failed to create organization');
        }
        await tx
          .insert(workspaceMember)
          .values({
            uid: generateUid('workmem'),
            workspaceId: workspaceInsResult[0].id,
            userId: userId,
            role: 'owner',
            status: 'active',
            joinedAt: new Date(),
          });

        this.auditService.log('workspace', {
          action: 'create',
          entityId: workspaceInsResult[0].id,
          entityUid: workspaceInsResult[0].uid,
          userId,
          workspaceId: workspaceInsResult[0].id,
          newValues: { name: workspaceInsResult[0].name, slug: workspaceInsResult[0].slug, type: workspaceInsResult[0].type },
          source: 'web',
        });

        return true;
      });
      return result;
    } catch (error) {
      return error
    }
  }


  async setPrimaryWorkspaceAndProject(createOrgDto: SelectOrganizationDto, userData: User): Promise<any> {
    try {
      await this.drizzle.db.transaction(async (tx) => {
        const existingProject = await tx
          .select({ id: project.id })
          .from(project)
          .where(eq(project.uid, createOrgDto.projectUid))
          .limit(1);
        const existingWorksapce = await tx
          .select({ id: workspace.id })
          .from(workspace)
          .where(eq(workspace.uid, createOrgDto.workspaceUid))
          .limit(1);
        if (existingProject.length > 0 && existingWorksapce.length > 0) {
          await tx.update(user)
            .set({ primaryWorkspaceUid: createOrgDto.workspaceUid, primaryProjectUid: createOrgDto.projectUid })
            .where(eq(user.id, userData.id))
          await this.userCacheService.refreshAuthUser({
            ...userData,
            primaryWorkspaceUid: createOrgDto.workspaceUid,
            primaryProjectUid: createOrgDto.projectUid
          });
        }
      });
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    if (!baseSlug) {
      throw new BadRequestException('Organization name must contain valid characters for slug generation');
    }
    return baseSlug;
  }


  async cacheWorkspace() {
    try {
      const workspacesResult = await this.drizzle.db
        .select({
          uid: workspace.uid,
          id: workspace.id,
        })
        .from(workspace)

      if (workspacesResult.length === 0) {
        return "no workspaces found";
      }

      workspacesResult.forEach(async (workspaceData) => {
        await this.projectCacheService.refreshWorspaceId(workspaceData.uid, workspaceData.id);
      })
      return "success"
    } catch (error) {
      console.error('Error fetching user projects and workspaces:', error);
      return {
        message: 'Failed to fetch user projects and workspaces',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'user_projects_workspaces_fetch_failed',
      };
    }
  }


  async clearServerCache(userData: User) {
    try {
      await this.projectCacheService.clearServerCache();
      return "success"
    } catch (error) {
      console.error('Error fetching user projects and workspaces:', error);
      return {
        message: 'Failed to fetch user projects and workspaces',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'user_projects_workspaces_fetch_failed',
      };
    }
  }


  async getMyAdminWorkspaces(userId: number) {
    const results = await this.drizzle.db
      .select({
        uid: workspace.uid,
        name: workspace.name,
        slug: workspace.slug,
        role: workspaceMember.role,
      })
      .from(workspaceMember)
      .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
      .where(
        and(
          eq(workspaceMember.userId, userId),
          eq(workspaceMember.status, 'active'),
        )
      );

    return results.filter(w => w.role === 'admin' || w.role === 'owner');
  }

  async findByUid(uid: string) {
    const result = await this.drizzle.db
      .select({
        id: workspace.id,
        uid: workspace.uid,
        name: workspace.name,
        slug: workspace.slug,
        type: workspace.type,
        description: workspace.description,
        image: workspace.image,
        primaryColor: workspace.primaryColor,
        secondaryColor: workspace.secondaryColor,
        email: workspace.email,
        phone: workspace.phone,
        website: workspace.website,
        address: workspace.address,
        isActive: workspace.isActive,
      })
      .from(workspace)
      .where(eq(workspace.uid, uid))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException('Workspace not found');
    }
    return result[0];
  }

  async updateWorkspace(uid: string, data: Partial<{
    name: string;
    slug: string;
    description: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    primaryColor: string;
    secondaryColor: string;
    type: 'platform' | 'private' | 'development' | 'premium';
  }>, userId?: number) {
    const result = await this.drizzle.db
      .update(workspace)
      .set(data)
      .where(eq(workspace.uid, uid))
      .returning({
        id: workspace.id,
        uid: workspace.uid,
        name: workspace.name,
        slug: workspace.slug,
        type: workspace.type,
        description: workspace.description,
        image: workspace.image,
        primaryColor: workspace.primaryColor,
        secondaryColor: workspace.secondaryColor,
        email: workspace.email,
        phone: workspace.phone,
        website: workspace.website,
        address: workspace.address,
        isActive: workspace.isActive,
      });

    if (result.length === 0) {
      throw new NotFoundException('Workspace not found');
    }

    this.auditService.log('workspace', {
      action: 'update',
      entityId: result[0].id,
      entityUid: result[0].uid,
      userId,
      workspaceId: result[0].id,
      newValues: { ...data },
      source: 'web',
    });

    return result[0];
  }

  async getWorkspaceMembers(uid: string) {
    const ws = await this.drizzle.db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.uid, uid))
      .limit(1);

    if (ws.length === 0) {
      throw new NotFoundException('Workspace not found');
    }

    const members = await this.drizzle.db
      .select({
        memberUid: workspaceMember.uid,
        role: workspaceMember.role,
        status: workspaceMember.status,
        joinedAt: workspaceMember.joinedAt,
        lastActiveAt: workspaceMember.lastActiveAt,
        userUid: user.uid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        image: user.image,
        slug: user.slug,
        type: user.type,
        country: user.country,
        isActive: user.isActive,
        primaryProjectUid: user.primaryProjectUid,
        primaryProjectName: project.name,
      })
      .from(workspaceMember)
      .innerJoin(user, eq(workspaceMember.userId, user.id))
      .leftJoin(project, eq(user.primaryProjectUid, project.uid))
      .where(eq(workspaceMember.workspaceId, ws[0].id));

    return members;
  }

  async findUsers() {
    try {
      const users = await this.drizzle.db
        .select({
          userUid: user.uid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          image: user.image,
          slug: user.slug,
          type: user.type,
          country: user.country,
          isActive: user.isActive,
          locale: user.locale,
          primaryWorkspaceUid: user.primaryWorkspaceUid,
          primaryProjectUid: user.primaryProjectUid,
          workspaceName: workspace.name,
          primaryProjectName: project.name,
        })
        .from(user)
        .leftJoin(workspace, eq(user.primaryWorkspaceUid, workspace.uid))
        .leftJoin(project, eq(user.primaryProjectUid, project.uid));

      return users;

    } catch (error) {
      console.error('Error finding users:', error);
      throw error;
    }
  }

  async startImpersonation(person: string, userData: User) {
    try {
      if (!userData.primaryWorkspaceUid) {
        throw new Error('No workspace set');
      }


      const workspaceId = await this.projectCacheService.getWorkspaceId(userData.primaryWorkspaceUid);
      if (!workspaceId) {
        throw new Error('No workspace found');
      }

      const personDetails = await this.drizzle.db
        .select()
        .from(user)
        .where(eq(user.uid, person))
        .limit(1)

      if (personDetails.length === 0) {
        throw 'no person found'
      }

      this.auditService.log('user', {
        action: 'impersonation',
        entityId: personDetails[0].id,
        entityUid: personDetails[0].uid,
        userId: userData.id,
        workspaceId: workspaceId,
        newValues: { impersonatedEmail: personDetails[0].email, impersonatedBy: userData.email },
        source: 'web',
      });

      return await this.userCacheService.refreshAuthUser({ ...personDetails[0], auth0Id: userData.auth0Id, impersonated: true })
    } catch (error) {
      return false
    }
  }

  async impersonationexit(userData: any) {
    try {
      await this.userCacheService.invalidateUser(userData)
      return true
    } catch (error) {
      return false
    }
  }

  async getWorkspaceSettings(uid: string): Promise<WorkspaceSettings> {
    const result = await this.drizzle.db
      .select({ settings: workspace.settings })
      .from(workspace)
      .where(eq(workspace.uid, uid))
      .limit(1);

    if (result.length === 0) throw new NotFoundException('Workspace not found');

    return { ...DEFAULT_WORKSPACE_SETTINGS, ...result[0].settings } as WorkspaceSettings;
  }

  async updateWorkspaceSettings(uid: string, patch: WorkspaceSettingsPatch, userId?: number): Promise<WorkspaceSettings> {
    const current = await this.getWorkspaceSettings(uid);

    const updated: WorkspaceSettings = {
      ...current,
      ...patch,
      notifications: {
        ...current.notifications,
        ...(patch.notifications ?? {}),
      },
    };

    const result = await this.drizzle.db
      .update(workspace)
      .set({ settings: updated })
      .where(eq(workspace.uid, uid))
      .returning({ id: workspace.id, settings: workspace.settings });

    if (result.length === 0) throw new NotFoundException('Workspace not found');

    this.auditService.log('workspace', {
      action: 'update',
      entityId: result[0].id,
      userId,
      oldValues: current as any,
      newValues: updated as any,
      source: 'web',
    });

    return result[0].settings as WorkspaceSettings;
  }

  async updateProjectStatus(workspaceUid: string, projectUid: string, status: 'active' | 'in_review' | 'suspended' | 'disabled', userId?: number) {
    const ws = await this.drizzle.db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.uid, workspaceUid))
      .limit(1);

    if (ws.length === 0) throw new NotFoundException('Workspace not found');

    const result = await this.drizzle.db
      .update(project)
      .set({ status })
      .where(and(eq(project.uid, projectUid), eq(project.workspaceId, ws[0].id), isNull(project.deletedAt)))
      .returning({ id: project.id, uid: project.uid, status: project.status });

    if (result.length === 0) throw new NotFoundException('Project not found in this workspace');

    this.auditService.log('project', {
      action: 'update',
      entityId: result[0].id,
      entityUid: result[0].uid,
      userId,
      workspaceId: ws[0].id,
      newValues: { status },
      source: 'web',
    });

    return result[0];
  }

  async getWorkspaceProjects(uid: string) {
    const ws = await this.drizzle.db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.uid, uid))
      .limit(1);

    if (ws.length === 0) throw new NotFoundException('Workspace not found');

    const workspaceId = ws[0].id;

    const projects = await this.drizzle.db
      .select({
        id: project.id,
        uid: project.uid,
        name: project.name,
        slug: project.slug,
        description: project.description,
        purpose: project.purpose,
        type: project.type,
        ecosystem: project.ecosystem,
        country: project.country,
        isPublic: project.isPublic,
        isActive: project.isActive,
        isPrimary: project.isPrimary,
        isPersonal: project.isPersonal,
        website: project.website,
        image: project.image,
        target: project.target,
        approvalBoardEnabled: project.approvalBoardEnabled,
        flag: project.flag,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        ownerUid: user.uid,
        ownerDisplayName: user.displayName,
        ownerEmail: user.email,
        ownerImage: user.image,
        ownerSlug: user.slug,
      })
      .from(project)
      .leftJoin(user, eq(project.createdById, user.id))
      .where(and(eq(project.workspaceId, workspaceId), isNull(project.deletedAt)))
      .orderBy(desc(project.createdAt));

    if (projects.length === 0) return [];

    const projectIds = projects.map((p) => p.id);

    const memberCounts = await this.drizzle.db
      .select({
        projectId: projectMember.projectId,
        count: sql<number>`count(*)::int`,
      })
      .from(projectMember)
      .where(
        and(
          inArray(projectMember.projectId, projectIds),
          isNull(projectMember.deletedAt),
          eq(projectMember.status, 'active'),
        ),
      )
      .groupBy(projectMember.projectId);

    const sites = await this.drizzle.db
      .select({
        uid: site.uid,
        projectId: site.projectId,
        name: site.name,
        description: site.description,
        status: site.status,
        area: site.area,
        soilType: site.soilType,
        elevation: site.elevation,
        waterAccess: site.waterAccess,
        accessibility: site.accessibility,
        expectedTreeCount: site.expectedTreeCount,
        image: site.image,
        reviewStatus: site.reviewStatus,
        plannedPlantingDate: site.plannedPlantingDate,
        actualPlantingDate: site.actualPlantingDate,
        flag: site.flag,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
      })
      .from(site)
      .where(and(inArray(site.projectId, projectIds), isNull(site.deletedAt)))
      .orderBy(asc(site.createdAt));

    const memberCountMap = new Map(memberCounts.map((m) => [m.projectId, m.count]));
    const sitesMap = new Map<number, typeof sites>();
    for (const s of sites) {
      const existing = sitesMap.get(s.projectId) ?? [];
      existing.push(s);
      sitesMap.set(s.projectId, existing);
    }

    return projects.map(({ ownerUid, ownerDisplayName, ownerEmail, ownerImage, ownerSlug, ...p }) => ({
      ...p,
      owner: ownerUid ? { uid: ownerUid, displayName: ownerDisplayName, email: ownerEmail, image: ownerImage, slug: ownerSlug } : null,
      memberCount: memberCountMap.get(p.id) ?? 0,
      siteCount: (sitesMap.get(p.id) ?? []).length,
      sites: sitesMap.get(p.id) ?? [],
    }));
  }


  //   /**
  //    * Get all organizations that a user belongs to
  //    */
  //   async findAllByUser(userId: number): Promise<any[]> {
  //     const userOrganizations = await this.drizzle.db
  //       .select({
  //         uid: workspace.uid,
  //         name: workspace.name,
  //         slug: workspace.slug,
  //         description: workspace.description,
  //         logo: workspace.logo,
  //         primaryColor: workspace.primaryColor,
  //         secondaryColor: workspace.secondaryColor,
  //         email: workspace.email,
  //         phone: workspace.phone,
  //         website: workspace.website,
  //         address: workspace.address,
  //         country: workspace.country,
  //         timezone: workspace.timezone,
  //         isActive: workspace.isActive,
  //         createdAt: workspace.createdAt,
  //         updatedAt: workspace.updatedAt,
  //         deletedAt: workspace.deletedAt,
  //         // User's membership details
  //         userRole: workspaceMembers.role,
  //         userStatus: workspaceMembers.status,
  //         joinedAt: workspaceMembers.joinedAt,
  //       })
  //       .from(workspaceMembers)
  //       .innerJoin(workspace, eq(workspaceMembers.workspaceId, workspace.id))
  //       .where(and(
  //         eq(workspaceMembers.userId, userId),
  //         eq(workspace.type, 'private'),
  //       ))
  //       .orderBy(workspace.name);



  //     return userOrganizations;
  //   }

  //   /**
  //    * Get organization by ID with member and project counts
  //    */
  //   async findById(orgId: number): Promise<OrganizationResponseDto> {
  //     return this.getOrganizationWithCounts(orgId);
  //   }

  //   /**
  //    * Get organization by UID with member and project counts
  //    */
  //   async findByUid(orgUid: string): Promise<OrganizationResponseDto> {
  //     const org = await this.drizzle.db
  //       .select()
  //       .from(workspace)
  //       .where(eq(workspace.uid, orgUid))
  //       .limit(1);

  //     if (org.length === 0) {
  //       throw new NotFoundException('Organization not found');
  //     }

  //     return this.getOrganizationWithCounts(org[0].id);
  //   }

  //   /**
  //    * Generate unique slug from organization name
  //    */
  //   private async generateUniqueSlug(name: string): Promise<string> {
  //     // Convert name to slug format (lowercase, replace spaces with hyphens, remove special chars)
  //     let baseSlug = name
  //       .toLowerCase()
  //       .trim()
  //       .replace(/[^\w\s-]/g, '') // Remove special characters
  //       .replace(/\s+/g, '-') // Replace spaces with hyphens
  //       .replace(/--+/g, '-') // Replace multiple hyphens with single
  //       .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  //     if (!baseSlug) {
  //       throw new BadRequestException('Organization name must contain valid characters for slug generation');
  //     }

  //     let slug = baseSlug;
  //     let counter = 1;

  //     // Keep trying until we find a unique slug
  //     while (true) {
  //       const existing = await this.drizzle.db
  //         .select()
  //         .from(workspace)
  //         .where(
  //           and(
  //             eq(workspace.slug, slug),
  //             isNull(workspace.deletedAt)
  //           )
  //         )
  //         .limit(1);

  //       if (existing.length === 0) {
  //         return slug;
  //       }

  //       // If slug exists, append counter
  //       slug = `${baseSlug}-${counter}`;
  //       counter++;

  //       // Prevent infinite loop
  //       if (counter > 1000) {
  //         throw new ConflictException('Unable to generate unique slug for organization');
  //       }
  //     }
  //   }

  //   /**
  //    * Get organization with member and project counts
  //    */
  //   private async getOrganizationWithCounts(orgId: number): Promise<any> {
  //     const [org] = await this.drizzle.db
  //       .select()
  //       .from(workspace)
  //       .where(eq(workspace.id, orgId))
  //       .limit(1);

  //     if (!org) {
  //       throw new NotFoundException('Organization not found');
  //     }

  //     const counts = await this.getOrganizationCounts(orgId);

  //     return {
  //       ...org,
  //       ...counts,
  //     };
  //   }

  //   /**
  //    * Get member and project counts for an organization
  //    */
  //   private async getOrganizationCounts(orgId: number): Promise<{ memberCount: number; projectCount: number }> {
  //     // Get member count
  //     const [memberCountResult] = await this.drizzle.db
  //       .select({ count: count() })
  //       .from(workspaceMembers)
  //       .where(eq(workspaceMembers.workspaceId, orgId));

  //     // Get project count (including soft-deleted projects in count as per your requirement)
  //     const [projectCountResult] = await this.drizzle.db
  //       .select({ count: count() })
  //       .from(projects)
  //       .where(eq(projects.workspaceId, orgId));

  //     return {
  //       memberCount: memberCountResult.count || 0,
  //       projectCount: projectCountResult.count || 0,
  //     };
  //   }

  async getAllWorkspaces() {
    return await this.drizzle.db
      .select({
        uid: workspace.uid,
        name: workspace.name,
        slug: workspace.slug,
        type: workspace.type,
      })
      .from(workspace)
      .where(isNull(workspace.deletedAt))
      .orderBy(asc(workspace.name));
  }

  async transferProject(workspaceUid: string, projectUid: string, targetWorkspaceUid: string, userId: number) {
    if (workspaceUid === targetWorkspaceUid) {
      throw new BadRequestException('Project is already in this workspace');
    }

    const [sourceWs] = await this.drizzle.db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.uid, workspaceUid))
      .limit(1);
    if (!sourceWs) throw new NotFoundException('Source workspace not found');

    const [targetWs] = await this.drizzle.db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.uid, targetWorkspaceUid))
      .limit(1);
    if (!targetWs) throw new NotFoundException('Target workspace not found');

    const result = await this.drizzle.db
      .update(project)
      .set({ workspaceId: targetWs.id })
      .where(and(eq(project.uid, projectUid), eq(project.workspaceId, sourceWs.id), isNull(project.deletedAt)))
      .returning({ id: project.id, uid: project.uid });

    if (result.length === 0) throw new NotFoundException('Project not found in source workspace');

    this.auditService.log('project', {
      action: 'update',
      entityId: result[0].id,
      entityUid: result[0].uid,
      userId,
      workspaceId: targetWs.id,
      oldValues: { workspaceId: sourceWs.id },
      newValues: { workspaceId: targetWs.id },
      source: 'web',
    });

    return { success: true, projectUid, targetWorkspaceUid };
  }
}