// src/organizations/organizations.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, sql, count } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { CreateNewWorkspaceDto } from './dto/create-organization.dto';
import { OrganizationResponseDto, SelectOrganizationDto } from './dto/organization-response.dto';
import { project, user, workspace, workspaceMember } from '../database/schema/index';
import { DrizzleService } from 'src/database/drizzle.service';
import { generateUid } from 'src/util/uidGenerator';
import { UserCacheService } from 'src/cache/user-cache.service';
import { CACHE_KEYS, CACHE_TTL } from 'src/cache/cache-keys';
import { User } from 'src/users/entities/user.entity';
import { ProjectCacheService } from 'src/cache/project-cache.service';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly drizzle: DrizzleService,
    private userCacheService: UserCacheService,
    private projectCacheService: ProjectCacheService, // Assuming this is the correct service for project caching
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
            type: createWorkspaceDto.type
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
            .set({ primaryWorkspace: createOrgDto.workspaceUid, primaryProject: createOrgDto.projectUid })
            .where(eq(user.id, userData.id))
          await this.userCacheService.refreshAuthUser({
            ...userData,
            primaryWorkspace: createOrgDto.workspaceUid,
            primaryProject: createOrgDto.projectUid
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


  async cacheWorkspace(userData: User) {
    try {
      const workspacesResult = await this.drizzle.db
        .select({
          uid: workspace.uid,
          id: workspace.id,
        })
        .from(workspace)
        .where(eq(workspace.createdById, userData.id));

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
}