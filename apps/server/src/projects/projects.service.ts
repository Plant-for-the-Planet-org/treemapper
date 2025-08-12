// src/projects/projects.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { project, projectMember, user, workspace, workspaceMember, projectInvites, bulkInvite } from '../database/schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectMembership, ServiceResponse, UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectRoleDto } from './dto/update-project-role.dto';
import { eq, and, desc, ne, asc, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { EmailService } from '../email/email.service';
import { v4 as uuidv4 } from 'uuid';
import { generateUid } from 'src/util/uidGenerator';
import { User } from 'src/users/entities/user.entity';
import { NotificationType } from 'src/notification/dto/notification.dto';
import { NotificationService } from 'src/notification/notification.service';
import { isValidEmailDomain } from 'src/util/domainValidationHelper';
import { CACHE_KEYS, CACHE_TTL } from 'src/cache/cache-keys';
import { CacheService } from 'src/cache/cache.service';
import { ProjectCacheService } from 'src/cache/project-cache.service';
import { UserCacheService } from 'src/cache/user-cache.service';
import { AuditService } from 'src/audit/audit.service';

export interface ProjectGuardResponse { projectId: number, role: string, userId: number, projectName: string, siteAccess: string, restrictedSites: string[] | null }

export interface ProjectMemberResponse {
  role: string;
  joinedAt: Date | null;
  invitedAt: Date | null;
  user: {
    uid: string;
    name: string | null;
    email: string;
    image: string | null;
    isActive: boolean;
  };
}

export interface ProjectInviteResponse {
  email: string;
  role: string;
  status: string;
  message: string | null;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  token: string;
  invitedBy: {
    uid: string;
    name: string | null;
    email: string;
  };
}

export interface ProjectInviteStatusResponse {
  uid: string;
  email: string;
  role: string;
  message: string | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  isExpired: boolean;
  project: {
    uid: string;
    name: string;
    description: string | null;
    slug: string;
    country: string | null;
    image: string | null;
  };
  invitedBy: {
    uid: string;
    name: string | null;
    email: string;
    displayName: string | null;
    image: string | null;
  };
}

export interface ProjectMembersAndInvitesResponse {
  members: ProjectMemberResponse[];
  invitations: ProjectInviteResponse[];
}

@Injectable()
export class ProjectsService {
  constructor(
    private drizzleService: DrizzleService,
    private emailService: EmailService,
    private notificationService: NotificationService,
    private projectCacheService: ProjectCacheService,
    private userCacheService: UserCacheService,
    private auditLogsService: AuditService
  ) { }


  private getGeoJSONForPostGIS(locationInput: any): any {
    if (!locationInput) {
      return null;
    }

    // If it's a Feature, extract the geometry
    if (locationInput.type === 'Feature' && locationInput.geometry) {
      return locationInput.geometry;
    }

    // If it's a FeatureCollection, extract the first geometry
    if (locationInput.type === 'FeatureCollection' &&
      locationInput.features &&
      locationInput.features.length > 0 &&
      locationInput.features[0].geometry) {
      return locationInput.features[0].geometry;
    }


    // If it's already a geometry object, use it directly
    if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'].includes(locationInput.type)) {
      return locationInput;
    }
    throw new BadRequestException('Invalid GeoJSON format');
  }




  private generateSlug(projectName: string): string {
    return projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens with single
      .trim()
      .substring(0, 255); // Ensure it fits in varchar(255)
  }


  async createPersonalProject(userData: User): Promise<any> {
    if (!userData.primaryWorkspaceUid) {
      throw 'No workspace set'
    }
    const workspaceId = await this.projectCacheService.getWorkspaceId(userData.primaryWorkspaceUid)
    if (!workspaceId) {
      throw 'No workspace found'
    }
    try {
      const existingProject = await this.drizzleService.db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.isPersonal, true),
            eq(project.createdById, userData.id),
            eq(project.workspaceId, workspaceId)
          )
        )
        .limit(1);

      if (existingProject.length > 0) {
        await this.userCacheService.invalidateUser(userData)
        return {
          message: 'Personal project already exists in this workspace',
          statusCode: 201,
          error: 'personal_project_exists',
          data: null,
          code: 'personal_project_exists',
        };
      }

      const result = await this.drizzleService.db.transaction(async (tx) => {
        const [projectData] = await tx
          .insert(project)
          .values({
            uid: generateUid('proj'),
            createdById: userData.id,
            workspaceId: workspaceId,
            slug: `${this.generateSlug(userData.displayName)}-${Date.now()}`,
            name: `${userData.displayName}'s personal project`,
            isPersonal: true,
          })
          .returning();

        await tx
          .insert(projectMember)
          .values({
            uid: generateUid('projmem'),
            projectId: projectData.id,
            userId: userData.id,
            projectRole: 'owner',
            joinedAt: new Date(),
          });
        await tx.update(user)
          .set({ primaryWorkspaceUid: userData.primaryWorkspaceUid, primaryProjectUid: projectData.uid })
          .where(eq(user.id, userData.id)),
          await this.userCacheService.refreshAuthUser({ ...userData, primaryWorkspaceUid: userData.primaryWorkspaceUid, primaryProjectUid: projectData.uid })
        this.notificationService.createNotification({
          userId: userData.id,
          type: NotificationType.MEMBER,
          title: 'New Project Created',
          message: `Your project ${name} has been created successfully.`
        }).catch(err => console.error('Notification failed:', err));
        return project;
      });
      return {
        message: 'Personal project created successfully',
        statusCode: 201,
        error: null,
        data: result,
        code: 'personal_project_created',
      };

    } catch (error) {
      console.error('Error creating personal project:', error);
      return {
        message: 'Failed to create personal project',
        statusCode: 500,
        error: error.message || 'internal_server_error',
        data: null,
        code: 'personal_project_creation_failed',
      };
    }
  }


  async createMigrationProject(userData: User): Promise<any> {
    const workspaceId = 1
    try {
      const result = await this.drizzleService.db.transaction(async (tx) => {
        const [projectData] = await tx
          .insert(project)
          .values({
            uid: generateUid('proj'),
            createdById: userData.id,
            workspaceId: workspaceId,
            slug: `${this.generateSlug(userData.displayName)}-${Date.now()}`,
            name: `${userData.displayName}'s personal project`,
            isPersonal: true,
          })
          .returning();

        await tx
          .insert(projectMember)
          .values({
            uid: generateUid('projmem'),
            projectId: projectData.id,
            userId: userData.id,
            projectRole: 'owner',
            joinedAt: new Date(),
          });
        await tx.update(user)
          .set({ primaryWorkspaceUid: userData.primaryWorkspaceUid, primaryProjectUid: projectData.uid })
          .where(eq(user.id, userData.id)),
          await this.userCacheService.refreshAuthUser({ ...userData, primaryWorkspaceUid: userData.primaryWorkspaceUid, primaryProjectUid: projectData.uid })
        this.notificationService.createNotification({
          userId: userData.id,
          type: NotificationType.MEMBER,
          title: 'New Project Created',
          message: `Your personal project has been created successfully.`
        }).catch(err => console.error('Notification failed:', err));
        return project;
      });
      return {
        message: 'Personal project created successfully',
        statusCode: 201,
        error: null,
        data: result,
        code: 'personal_project_created',
      };

    } catch (error) {
      console.error('Error creating personal project:', error);
      return {
        message: 'Failed to create personal project',
        statusCode: 500,
        error: error.message || 'internal_server_error',
        data: null,
        code: 'personal_project_creation_failed',
      };
    }
  }


  async findProjectsAndWorkspace(userData: User) {
    try {
      const projectsResult = await this.drizzleService.db
        .select({
          project: {
            uid: project.uid,
            slug: project.slug,
            name: project.name,
            type: project.type,
            target: project.target,
            description: project.description,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            location: project.originalGeometry,
            deletedAt: project.deletedAt
          },
          projectRole: projectMember.projectRole,
          workspace: {
            uid: workspace.uid,
            name: workspace.name,
            slug: workspace.slug,
            type: workspace.type
          }
        })
        .from(projectMember)
        .innerJoin(project, eq(projectMember.projectId, project.id))
        .innerJoin(workspace, eq(project.workspaceId, workspace.id))
        .where(eq(projectMember.userId, userData.id));

      const workspacesResult = await this.drizzleService.db
        .select({
          workspace: {
            uid: workspace.uid,
            name: workspace.name,
            slug: workspace.slug,
            type: workspace.type,
            description: workspace.description,
            isActive: workspace.isActive,
            createdAt: workspace.createdAt
          },
          workspaceRole: workspaceMember.role,
          memberStatus: workspaceMember.status
        })
        .from(workspaceMember)
        .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
        .where(eq(workspaceMember.userId, userData.id));

      return {
        message: 'User projects and workspaces fetched successfully',
        statusCode: 200,
        error: null,
        data: {
          projects: projectsResult.filter(el => el.project.deletedAt === null).map(({ project, projectRole, workspace }) => ({
            ...project,
            userRole: projectRole,
            workspace: workspace
          })),
          workspaces: workspacesResult.map(({ workspace, workspaceRole, memberStatus }) => ({
            ...workspace,
            userRole: workspaceRole,
            memberStatus: memberStatus
          }))
        },
        code: 'user_projects_workspaces_fetched',
      };
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

  async getMemberRoleFromUid(projectUid: string, userId: number): Promise<ProjectGuardResponse | null> {
    try {
      const projectData = await this.drizzleService.db
        .select()
        .from(project)
        .where(eq(project.uid, projectUid))
        .then(results => {
          if (results.length === 0) throw new NotFoundException('Project not found');
          return results[0];
        });

      if (!projectData) {
        throw new NotFoundException('Project not found');
      }

      const membershipQuery = await this.drizzleService.db
        .select({ role: projectMember.projectRole, userId: projectMember.userId, siteAccess: projectMember.siteAccess, restrictedSites: projectMember.restrictedSites })
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, projectData.id),
            eq(projectMember.userId, userId)
          )
        )
        .limit(1);
      if (!membershipQuery) {
        throw new NotFoundException('Role not found');
      }
      const payload = membershipQuery.length > 0 ? { projectName: projectData.name, projectId: projectData.id, role: membershipQuery[0].role, userId: membershipQuery[0].userId, siteAccess: membershipQuery[0].siteAccess, restrictedSites: membershipQuery[0].restrictedSites } : null
      if (payload) {
        await this.projectCacheService.setUserProject(projectData.uid, userId, payload)
      }
      return payload
    } catch (error) {
      return null;
    }
  }

  async updateNewProject(createProjectDto: CreateProjectDto, membership: ProjectGuardResponse, userData: User): Promise<any> {
    try {
      let locationValue: any = null;
      if (!userData.primaryWorkspaceUid) {
        throw new ForbiddenException('User does not have a primary workspace set');
      }
      const workspaceId = await this.projectCacheService.getWorkspaceId(userData.primaryWorkspaceUid);
      if (!workspaceId) {
        throw new NotFoundException('Workspace not found');
      }
      if (createProjectDto.location) {
        try {
          const geometry = this.getGeoJSONForPostGIS(createProjectDto.location);
          locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
        } catch (error) {
          return {
            message: 'Invalid GeoJSON provided',
            statusCode: 400,
            error: "invalid_geojson",
            data: null,
            code: 'invalid_project_geojson',
          };
        }
      }

      const result = await this.drizzleService.db
        .update(project)
        .set({
          createdById: userData.id,
          name: createProjectDto.projectName ?? '',
          type: createProjectDto.projectType ?? 'private',
          website: createProjectDto.projectWebsite ?? null,
          description: createProjectDto.description ?? null,
          target: createProjectDto.target ? Number(createProjectDto.target) : null,
          location: locationValue,
          originalGeometry: createProjectDto.location
        })
        .where(eq(project.id, membership.projectId))

      this.notificationService.createNotification({
        userId: userData.id,
        type: NotificationType.MEMBER,
        title: 'New Project Created',
        message: `Your project ${createProjectDto.projectName} has been created successfully.`
      }).catch(err => console.error('Notification failed:', err));
      return {
        message: 'Project updated successfully',
        statusCode: 201,
        error: null,
        data: result,
        code: 'project_created',
      };
    } catch (error) {
      console.error('Error updating project:', error);
      return {
        message: 'Failed to update project',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'project_creation_failed',
      };
    }
  }

  async inviteMember(email: string, role: string, membership: ProjectGuardResponse, currentUser: User, message?: string): Promise<any> {
    try {
      const existingUser = await this.drizzleService.db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .then(results => results[0] || null);

      if (existingUser) {
        const existingMembership = await this.drizzleService.db
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.projectId, membership.projectId),
              eq(projectMember.userId, existingUser.id)
            )
          )
          .then(results => results[0] || null);

        if (existingMembership) {
          return {
            message: 'User is already a member of this project',
            statusCode: 409,
            error: "conflict",
            data: null,
            code: 'user_already_member',
          };
        }
      }

      const existingInvite = await this.drizzleService.db
        .select()
        .from(projectInvites)
        .where(
          and(
            eq(projectInvites.projectId, membership.projectId),
            eq(projectInvites.email, email),
            eq(projectInvites.status, 'pending')
          )
        )
        .then(results => results[0] || null);

      if (existingInvite) {
        return {
          message: 'An invite has already been sent to this email',
          statusCode: 409,
          error: "conflict",
          data: null,
          code: 'invite_already_sent',
        };
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      const [invitation] = await this.drizzleService.db
        .insert(projectInvites)
        .values({
          projectId: membership.projectId,
          uid: generateUid('invi'),
          email,
          projectRole: role as 'owner' | 'admin' | 'contributor' | 'observer',
          invitedById: membership.userId,
          expiresAt: expiryDate,
          message: message || '',
          token: uuidv4(),
        })
        .returning();

      await this.emailService.sendProjectInviteEmail({
        email,
        projectName: membership.projectName,
        role,
        inviterName: currentUser.displayName || '',
        token: invitation.token,
        expiresAt: expiryDate,
      });
      this.notificationService.createNotification(
        {
          userId: membership.userId,
          type: NotificationType.INVITE,
          title: 'Invite Sent',
          message: `Project Invites sent to ${email}.`

        })
      return {
        message: 'Invitation sent successfully',
        statusCode: 201,
        error: null,
        data: invitation,
        code: 'invitation_sent',
      };
    } catch (error) {
      console.error('Error sending invitation:', error);
      return {
        message: 'Failed to send invitation',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'invitation_send_failed',
      };
    }
  }

  async getProjectMembersAndInvitations(membership: ProjectGuardResponse): Promise<ProjectMembersAndInvitesResponse> {
    const members = await this.drizzleService.db
      .select({
        role: projectMember.projectRole,
        joinedAt: projectMember.joinedAt,
        invitedAt: projectMember.invitedAt,
        user: {
          name: user.displayName,
          email: user.email,
          image: user.image,
          isActive: user.isActive,
          uid: user.uid,
        }
      })
      .from(projectMember)
      .innerJoin(user, eq(user.id, projectMember.userId))
      .where(eq(projectMember.projectId, membership.projectId))
      .orderBy(desc(projectMember.joinedAt));

    const invitations = await this.drizzleService.db
      .select({
        uid: projectInvites.uid,
        email: projectInvites.email,
        role: projectInvites.projectRole,
        status: projectInvites.status,
        message: projectInvites.message,
        expiresAt: projectInvites.expiresAt,
        acceptedAt: projectInvites.acceptedAt,
        createdAt: projectInvites.createdAt,
        token: projectInvites.token,
        invitedBy: {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
        }
      })
      .from(projectInvites)
      .innerJoin(user, eq(projectInvites.invitedById, user.id))
      .where(
        and(
          eq(projectInvites.projectId, membership.projectId),
          eq(projectInvites.status, 'pending')
        )
      )
      .orderBy(desc(projectInvites.createdAt));

    return {
      members,
      invitations
    };
  }

  async expireInvite(token: string, userData: User) {
    try {
      const invite = await this.drizzleService.db
        .select({
          invite: projectInvites,
        })
        .from(projectInvites)
        .where(
          and(
            eq(projectInvites.token, token),
            eq(projectInvites.status, 'pending'),
          )
        )
        .then(results => results[0] || null);

      if (!invite) {
        return {
          message: 'Invitation not found or already processed',
          statusCode: 404,
          error: "not_found",
          data: null,
          code: 'invitation_not_found',
        };
      }

      await this.drizzleService.db
        .update(projectInvites)
        .set({
          status: 'discarded',
          discardedAt: new Date(),
          discardedById: userData.id,
          updatedAt: new Date()
        })
        .where(eq(projectInvites.id, invite.invite.id));
      await this.auditLogsService.createAuditLog('project_invite', {
        action: 'invite',
        entityId: invite.invite.id,


      })
      return {
        message: `Invitation discarded`,
        statusCode: 200,
        error: null,
        data: null,
        code: 'invite_declined',
      };
    } catch (error) {
      console.error('Error declining invite:', error);
      return {
        message: 'Failed to decline invitation',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'decline_invite_failed',
      };
    }
  }

  async getProjectInviteLink(memerShip: ProjectGuardResponse): Promise<any> {
    try {
      const inviteResult = await this.drizzleService.db
        .select({
          id: bulkInvite.uid,
          invitationlink: bulkInvite.token,
          domain_restriction: bulkInvite.emailDomainRestrictions,
          created_at: bulkInvite.createdAt,
          created_by: user.displayName,
        })
        .from(bulkInvite)
        .innerJoin(user, eq(bulkInvite.invitedById, user.id))
        .where(
          and(
            eq(bulkInvite.projectId, memerShip.projectId),
            isNull(bulkInvite.deletedAt)
          )
        )

      if (!inviteResult) {
        throw new NotFoundException('Invitation not found');
      }


      return inviteResult ? inviteResult : [];

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching project invite status:', error);
      throw new Error('Failed to fetch invitation details');
    }
  }

  async createInviteLink(membership: ProjectGuardResponse, data: any): Promise<any> {
    try {

      data.restriction.forEach((el: string, index: number) => {
        if (!isValidEmailDomain(el)) {
          throw new BadRequestException(`Invalid email domain: ${el}`);
        }
        if (!el.startsWith('@')) {
          data.restriction[index] = '@' + el;
        }
      })

      // Create invitation
      const expiryDate = new Date(data.expiry);


      const result = await this.drizzleService.db
        .insert(bulkInvite)
        .values({
          projectId: membership.projectId,
          invitedById: membership.userId,
          token: uuidv4(),
          uid: generateUid('invi'),
          projectRole: 'contributor',
          expiresAt: expiryDate,
          message: '',
          emailDomainRestrictions: data.restriction
        })
        .returning();

      if (!result) {
        throw ''
      }

      return {
        message: 'Invitation Link Created',
        statusCode: 201,
        error: null,
        data: {
          link: result[0].token
        },
        code: 'invitation_link_created',
      };
    } catch (error) {
      return {
        message: 'Failed to created invitation link',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'invitation_send_failed',
      };
    }
  }

  async removeInviteLink(myMembership: ProjectGuardResponse, uid: string) {
    try {
      if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
        return {
          message: 'You do not have permission to remove members',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'remove_member_permission_denied',
        };
      }

      await this.drizzleService.db
        .update(bulkInvite)
        .set({ deletedAt: new Date(), expiresAt: new Date(), discardedAt: new Date(), discardedById: myMembership.userId })
        .where(
          and(
            eq(bulkInvite.uid, uid)
          )
        );

      return {
        message: 'Link removed successfully',
        statusCode: 200,
        error: null,
        data: { success: true },
        code: 'member_removed',
      };
    } catch (error) {
      return {
        message: 'Failed to remove link',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'remove_member_failed',
      };
    }
  }

  async getProjectInviteStatus(token: string, email: string): Promise<ProjectInviteStatusResponse> {
    try {
      const inviteResult = await this.drizzleService.db
        .select({
          invite: {
            uid: projectInvites.uid,
            email: projectInvites.email,
            role: projectInvites.projectRole,
            message: projectInvites.message,
            status: projectInvites.status,
            expiresAt: projectInvites.expiresAt,
            createdAt: projectInvites.createdAt,
            projectId: projectInvites.projectId,
          },
          project: {
            uid: project.uid,
            name: project.name,
            description: project.description,
            slug: project.slug,
            country: project.country,
            image: project.image,
          },
          invitedBy: {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            displayName: user.displayName,
            image: user.image,
          }
        })
        .from(projectInvites)
        .innerJoin(project, eq(projectInvites.projectId, project.id))
        .innerJoin(user, eq(projectInvites.invitedById, user.id))
        .where(eq(projectInvites.token, token))
        .orderBy(desc(projectInvites.createdAt))
        .limit(1);
      if (!inviteResult.length) {
        throw new NotFoundException('Invitation not found');
      }

      const result = inviteResult[0];

      // Verify email matches
      if (result.invite.email.toLowerCase() !== email.toLowerCase()) {
        throw new UnauthorizedException('Email does not match invitation');
      }

      // Check if invite is expired
      const now = new Date();
      const isExpired = result.invite.expiresAt < now;

      // Prepare and return response data
      return {
        uid: result.invite.uid,
        email: result.invite.email,
        role: result.invite.role,
        message: result.invite.message,
        status: result.invite.status,
        expiresAt: result.invite.expiresAt,
        createdAt: result.invite.createdAt,
        isExpired,
        project: {
          uid: result.project.uid,
          name: result.project.name,
          description: result.project.description,
          slug: result.project.slug,
          country: result.project.country,
          image: result.project.image,
        },
        invitedBy: {
          uid: result.invitedBy.uid,
          name: result.invitedBy.name,
          email: result.invitedBy.email,
          displayName: result.invitedBy.displayName,
          image: result.invitedBy.image,
        }
      };

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error fetching project invite status:', error);
      throw new Error('Failed to fetch invitation details');
    }
  }




  async acceptInvite(token: string, userId: number, email: string, userData: User) {
    try {
      const invite = await this.drizzleService.db
        .select({
          invite: projectInvites,
          project: project,
          inviter: user,
          workspace: workspace,
        })
        .from(projectInvites)
        .innerJoin(project, eq(projectInvites.projectId, project.id))
        .innerJoin(workspace, eq(project.workspaceId, workspace.id))
        .innerJoin(user, eq(projectInvites.invitedById, user.id))
        .where(
          and(
            eq(projectInvites.token, token),
            eq(projectInvites.email, email),
            eq(projectInvites.status, 'pending'),
          )
        )
        .then(results => results[0] || null);

      if (!invite) {
        return {
          message: 'Invitation not found or already processed',
          statusCode: 404,
          error: "not_found",
          data: null,
          code: 'invitation_not_found',
        };
      }

      await this.drizzleService.db.update(user).set({
        primaryProjectUid: invite.project.uid,
        primaryWorkspaceUid: invite.workspace.uid
      }).where(eq(user.id, userId))


      if (new Date(invite.invite.expiresAt) < new Date()) {
        // await this.drizzleService.db TODO: Expire invite here
        //   .update(projectInvites)
        //   .set({status:new Date(),})
        //   .innerJoin(project, eq(projectInvites.projectId, project.id))
        //   .innerJoin(workspace, eq(project.workspaceId, workspace.id))
        //   .innerJoin(user, eq(projectInvites.invitedById, user.id))
        //   .where(
        //     and(
        //       eq(projectInvites.token, token),
        //       eq(projectInvites.email, email),
        //       eq(projectInvites.status, 'pending'),
        //     )
        //   )
        return {
          message: 'Invitation has expired',
          statusCode: 400,
          error: "expired",
          data: null,
          code: 'invitation_expired',
        };
      }

      // Check existing memberships in parallel
      const [existingProjectMember, existingWorkspaceMember] = await Promise.all([
        this.drizzleService.db
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.projectId, invite.invite.projectId),
              eq(projectMember.userId, userId),
            )
          )
          .then(results => results[0] || null),

        this.drizzleService.db
          .select()
          .from(workspaceMember)
          .where(
            and(
              eq(workspaceMember.workspaceId, invite.workspace.id),
              eq(workspaceMember.userId, userId),
            )
          )
          .then(results => results[0] || null)
      ]);

      if (existingProjectMember) {
        return {
          message: 'You are already a member of this project',
          statusCode: 409,
          error: "conflict",
          data: null,
          code: 'already_member',
        };
      }

      const result = await this.drizzleService.db.transaction(async (tx) => {
        if (!existingWorkspaceMember) {
          await tx
            .insert(workspaceMember)
            .values({
              uid: generateUid('workmem'),
              workspaceId: invite.workspace.id,
              userId: userId,
              role: 'member',
              status: 'active',
              joinedAt: new Date(),
            });
        }

        const [membership] = await tx
          .insert(projectMember)
          .values({
            projectId: invite.invite.projectId,
            userId: userId,
            uid: generateUid('projmem'),
            projectRole: invite.invite.projectRole,
            joinedAt: new Date(),
          })
          .returning();

        await tx
          .update(projectInvites)
          .set({
            status: 'accepted',
            acceptedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(projectInvites.id, invite.invite.id));

        return membership;
      });
      await this.userCacheService.invalidateUser(userData)
      return {
        message: `You have successfully joined ${invite.project.name}`,
        statusCode: 200,
        error: null,
        data: {
          projectId: invite.project.id,
          workspaceId: invite.workspace.id,
          projectRole: result.projectRole,
          addedToWorkspace: !existingWorkspaceMember,
        },
        code: 'invite_accepted',
      };
    } catch (error) {
      console.error('Error accepting invite:', error);
      return {
        message: 'Failed to accept invitation',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'accept_invite_failed',
      };
    }
  }

  async declineInvite(token: string, email: string, userData: User) {
    try {
      const invite = await this.drizzleService.db
        .select({
          invite: projectInvites,
          project: project,
          inviter: user,
        })
        .from(projectInvites)
        .innerJoin(project, eq(projectInvites.projectId, project.id))
        .innerJoin(user, eq(projectInvites.invitedById, user.id))
        .where(
          and(
            eq(projectInvites.token, token),
            eq(projectInvites.email, email),
            eq(projectInvites.status, 'pending'),
          )
        )
        .then(results => results[0] || null);

      if (!invite) {
        return {
          message: 'Invitation not found or already processed',
          statusCode: 404,
          error: "not_found",
          data: null,
          code: 'invitation_not_found',
        };
      }

      await this.drizzleService.db
        .update(projectInvites)
        .set({
          status: 'declined',
          updatedAt: new Date()
        })
        .where(eq(projectInvites.id, invite.invite.id));
      this.notificationService.createNotification(
        {
          userId: invite.inviter.id,
          type: NotificationType.INVITE,
          title: 'Invitation Decline',
          message: `Project Invites declined by ${email}.`

        })
      return {
        message: `You have declined the invitation to join ${invite.project.name}`,
        statusCode: 200,
        error: null,
        data: null,
        code: 'invite_declined',
      };
    } catch (error) {
      console.error('Error declining invite:', error);
      return {
        message: 'Failed to decline invitation',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'decline_invite_failed',
      };
    }
  }

  async updateMemberRole(
    memberId: string,
    myMembership: ProjectGuardResponse,
    updateRoleDto: UpdateProjectRoleDto,
  ) {
    try {
      if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
        return {
          message: 'You do not have permission to update member roles',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'update_role_permission_denied',
        };
      }

      // Find the member to update
      const memberQuery = await this.drizzleService.db
        .select({
          member: projectMember,
          user: user,
        })
        .from(projectMember)
        .innerJoin(user, eq(user.uid, memberId))
        .where(
          and(
            eq(projectMember.projectId, myMembership.projectId),
            eq(projectMember.userId, user.id)
          )
        );

      if (memberQuery.length === 0) {
        return {
          message: 'Member not found in this project',
          statusCode: 404,
          error: "not_found",
          data: null,
          code: 'member_not_found',
        };
      }

      const memberToUpdate = memberQuery[0];

      // Cannot change owner's role
      if (memberToUpdate.member.projectRole === 'owner') {
        return {
          message: 'Cannot change the role of the project owner',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'cannot_change_owner_role',
        };
      }

      // Admin cannot change another admin's role (only owner can)
      if (myMembership.role === 'admin' && memberToUpdate.member.projectRole === 'admin') {
        return {
          message: 'Admin cannot change another admin\'s role',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'admin_cannot_change_admin_role',
        };
      }

      // Update role
      const [result] = await this.drizzleService.db
        .update(projectMember)
        .set({
          projectRole: updateRoleDto.role,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectMember.projectId, myMembership.projectId),
            eq(projectMember.userId, memberToUpdate.user.id)
          )
        )
        .returning();

      await this.drizzleService.db.update(user).set({
        primaryProjectUid: null,
        primaryWorkspaceUid: null
      }).where(eq(user.id, memberQuery[0].user.id))


      return {
        message: 'Member role updated successfully',
        statusCode: 200,
        error: null,
        data: {
          userId: memberId,
          name: memberToUpdate.user.displayName,
          email: memberToUpdate.user.email,
          role: result.projectRole,
        },
        code: 'member_role_updated',
      };
    } catch (error) {
      console.error('Error updating member role:', error);
      return {
        message: 'Failed to update member role',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'update_member_role_failed',
      };
    }
  }

  async removeMember(memberId: string, myMembership: ProjectGuardResponse, currentUser: User) {
    try {


      if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
        return {
          message: 'You do not have permission to remove members',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'remove_member_permission_denied',
        };
      }


      // Find the member to remove
      const memberQuery = await this.drizzleService.db
        .select()
        .from(projectMember)
        .innerJoin(user, eq(user.uid, memberId))
        .where(
          and(
            eq(projectMember.projectId, myMembership.projectId),
            eq(projectMember.userId, user.id),
          )
        );

      if (memberQuery.length === 0) {
        return {
          message: 'Member not found in this project',
          statusCode: 404,
          error: "not_found",
          data: null,
          code: 'member_not_found',
        };
      }

      const memberToRemove = memberQuery[0];

      // Cannot remove the owner
      if (memberToRemove.project_member.projectRole === 'owner') {
        return {
          message: 'Cannot remove the project owner',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'cannot_remove_owner',
        };
      }

      // Admin cannot remove another admin (only owner can)
      if (memberToRemove.project_member.projectRole === 'admin' && myMembership.role === 'admin') {
        return {
          message: 'Admin cannot remove another admin',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'admin_cannot_remove_admin',
        };
      }

      await this.drizzleService.db
        .delete(projectMember)
        .where(
          and(
            eq(projectMember.projectId, myMembership.projectId),
            eq(projectMember.userId, memberToRemove.user.id)
          )
        );

      const otherProjects = await this.drizzleService.db
        .select({
          projectUid: project.uid,
          workspaceUid: workspace.uid,
          isPrimary: project.isPrimary,
          isPersonal: project.isPersonal,
          updatedAt: project.updatedAt,
          projectId: project.id
        })
        .from(projectMember)
        .innerJoin(project, eq(project.id, projectMember.projectId))
        .innerJoin(workspace, eq(workspace.id, project.workspaceId))
        .where(
          and(
            eq(projectMember.userId, currentUser.id),
            eq(project.isActive, true), // Only active projects
            eq(projectMember.status, 'active'), // Only active memberships
            isNull(project.deletedAt), // Not soft deleted
            ne(project.id, myMembership.projectId) // Exclude the project being removed
          )
        )
        .orderBy(
          // Prioritize: primary projects first, then personal, then most recent
          desc(project.isPrimary),
          desc(project.isPersonal),
          desc(project.updatedAt)
        );

      if (!otherProjects || otherProjects.length === 0) {
        // No other projects, clear primary references
        await this.drizzleService.db
          .update(user)
          .set({
            primaryProjectUid: null,
            primaryWorkspaceUid: null
          })
          .where(eq(user.id, currentUser.id));
      } else {
        // Set the highest priority project as primary
        const newPrimaryProject = otherProjects[0];
        await this.drizzleService.db
          .update(user)
          .set({
            primaryWorkspaceUid: newPrimaryProject.workspaceUid,
            primaryProjectUid: newPrimaryProject.projectUid
          })
          .where(eq(user.id, currentUser.id));
      }
      await this.userCacheService.invalidateUser({ auth0Id: memberToRemove.user.auth0Id })
      return {
        message: 'Member removed successfully',
        statusCode: 200,
        error: null,
        data: { success: true },
        code: 'member_removed',
      };
    } catch (error) {
      console.error('Error removing member:', error);
      return {
        message: 'Failed to remove member',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'remove_member_failed',
      };
    }
  }

  async getProjectSingleLinkStatus(token: string): Promise<ProjectInviteStatusResponse> {
    try {
      const inviteResult = await this.drizzleService.db
        .select({
          invite: {
            uid: bulkInvite.uid,
            email: bulkInvite.emailDomainRestrictions,
            role: bulkInvite.projectRole,
            message: bulkInvite.message,
            status: bulkInvite.status,
            expiresAt: bulkInvite.expiresAt,
            createdAt: bulkInvite.createdAt,
            projectId: bulkInvite.projectId,
          },
          project: {
            uid: project.uid,
            name: project.name,
            description: project.description,
            slug: project.slug,
            country: project.country,
            image: project.image,
          },
          invitedBy: {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            displayName: user.displayName,
            image: user.image,
          }
        })
        .from(bulkInvite)
        .innerJoin(project, eq(bulkInvite.projectId, project.id))
        .innerJoin(user, eq(bulkInvite.invitedById, user.id))
        .where(eq(bulkInvite.token, token))

      if (!inviteResult.length) {
        throw new NotFoundException('Invitation not found');
      }

      const result = inviteResult[0];


      // Check if invite is expired
      const now = new Date();
      const isExpired = result.invite.expiresAt < now;

      // Prepare and return response data
      return {
        uid: result.invite.uid,
        email: '',
        role: result.invite.role,
        message: result.invite.message,
        status: result.invite.status || '',
        expiresAt: result.invite.expiresAt,
        createdAt: result.invite.createdAt || new Date(),
        isExpired,
        project: {
          uid: result.project.uid,
          name: result.project.name,
          description: result.project.description,
          slug: result.project.slug,
          country: result.project.country,
          image: result.project.image,
        },
        invitedBy: {
          uid: result.invitedBy.uid,
          name: result.invitedBy.name,
          email: result.invitedBy.email,
          displayName: result.invitedBy.displayName,
          image: result.invitedBy.image,
        }
      };

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error fetching project invite status:', error);
      throw new Error('Failed to fetch invitation details');
    }
  }

  async acceptLinkInvite(token: string, userId: number, email: string, userData: User) {
    try {
      // Get bulk invite with project and workspace details in single query
      const invite = await this.drizzleService.db
        .select({
          invite: bulkInvite,
          project: project,
          inviter: user,
          workspace: workspace,
        })
        .from(bulkInvite)
        .innerJoin(project, eq(bulkInvite.projectId, project.id))
        .innerJoin(workspace, eq(project.workspaceId, workspace.id))
        .innerJoin(user, eq(bulkInvite.invitedById, user.id))
        .where(
          and(
            eq(bulkInvite.token, token),
            eq(bulkInvite.status, 'pending') // Add status check
          )
        )
        .then(results => results[0] || null);

      if (!invite) {
        return {
          message: 'Invitation link is invalid or has been processed',
          statusCode: 404,
          error: "not_found",
          data: null,
          code: 'invitation_not_found',
        };
      }

      if (new Date(invite.invite.expiresAt) < new Date()) {
        return {
          message: 'Invitation has expired',
          statusCode: 400,
          error: "expired",
          data: null,
          code: 'invitation_expired',
        };
      }

      // Check domain restriction if exists
      if (invite.invite.emailDomainRestrictions && invite.invite.emailDomainRestrictions.length > 0) {
        try {
          const emailDomain = email.substring(email.indexOf('@'));
          if (!invite.invite.emailDomainRestrictions.includes(emailDomain)) {
            return {
              message: 'Your email domain is not authorized for this invitation',
              statusCode: 403,
              error: "forbidden",
              data: null,
              code: 'domain_not_authorized',
            };
          }
        } catch (error) {
          return {
            message: 'Invalid email format',
            statusCode: 400,
            error: "bad_request",
            data: null,
            code: 'invalid_email',
          };
        }
      }

      // Check existing memberships in parallel
      const [existingProjectMember, existingWorkspaceMember] = await Promise.all([
        this.drizzleService.db
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.projectId, invite.invite.projectId),
              eq(projectMember.userId, userId),
            )
          )
          .then(results => results[0] || null),
        this.drizzleService.db
          .select()
          .from(workspaceMember)
          .where(
            and(
              eq(workspaceMember.workspaceId, invite.workspace.id),
              eq(workspaceMember.userId, userId),
            )
          )
          .then(results => results[0] || null)
      ]);

      if (existingProjectMember) {
        return {
          message: 'You are already a member of this project',
          statusCode: 409,
          error: "conflict",
          data: null,
          code: 'already_member',
        };
      }


      // Use transaction to ensure data consistency
      const result = await this.drizzleService.db.transaction(async (tx) => {
        // Add to workspace if not already a member
        if (!existingWorkspaceMember) {
          await tx
            .insert(workspaceMember)
            .values({
              uid: generateUid('workmem'),
              workspaceId: invite.workspace.id,
              userId: userId,
              role: 'member', // default workspace role
              status: 'active',
              joinedAt: new Date(),
            });
        }

        // Add user as project member
        const [membership] = await tx
          .insert(projectMember)
          .values({
            projectId: invite.invite.projectId,
            userId: userId,
            uid: generateUid('projmem'),
            projectRole: invite.invite.projectRole,
            joinedAt: new Date(),
            bulkInviteId: invite.invite.id,
            siteAccess: 'limited_access',
            restrictedSites: []
          })
          .returning();

        return membership;
      });

      await this.drizzleService.db.update(user).set({
        primaryProjectUid: invite.project.uid,
        primaryWorkspaceUid: invite.workspace.uid
      }).where(eq(user.id, userId))

      const existingInvite = await this.drizzleService.db.select().from(projectInvites).where(eq(projectInvites.email, email))
      if (existingInvite) {
        await this.drizzleService.db.update(projectInvites).set({
          status: 'discarded',
          discardedAt: new Date(),
          discardedById: invite.inviter.id,
          updatedAt: new Date()
        })
      }
      await this.userCacheService.invalidateUser(userData)
      return {
        message: `You have successfully joined ${invite.project.name}`,
        statusCode: 200,
        error: null,
        data: {
          projectId: invite.project.id,
          workspaceId: invite.workspace.id,
          projectRole: result.projectRole,
          addedToWorkspace: !existingWorkspaceMember,
          inviteType: 'bulk_link',
        },
        code: 'invite_accepted',
      };
    } catch (error) {
      console.error('Error accepting link invite:', error);
      return {
        message: 'Failed to accept invitation',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'accept_invite_failed',
      };
    }
  }



  async findOne(projectId: number) {
    try {
      const projectQuery = await this.drizzleService.db
        .select({
          uid: project.uid,
          slug: project.slug,
          name: project.name,
          type: project.type,
          ecosystem: project.ecosystem,
          scale: project.scale,
          target: project.target,
          website: project.website,
          description: project.description,
          classification: project.classification,
          image: project.image,
          videoUrl: project.videoUrl,
          country: project.country,
          originalGeometry: project.originalGeometry,
          isActive: project.isActive,
          isPublic: project.isPublic,
          isPersonal: project.isPersonal,
          intensity: project.intensity,
          revisionPeriodicity: project.revisionPeriodicity,
          metadata: project.metadata,
          createdById: project.createdById,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          location: project.originalGeometry
        })
        .from(project)
        .where(eq(project.id, projectId));

      if (projectQuery.length === 0) {
        return {
          message: 'Project not found',
          statusCode: 404,
          error: "not_found",
          data: null,
          code: 'project_not_found',
        };
      }

      return {
        message: 'Project details fetched successfully',
        statusCode: 200,
        error: null,
        data: projectQuery[0],
        code: 'project_details_fetched',
      };
    } catch (error) {
      console.error('Error fetching project details:', error);
      return {
        message: 'Failed to fetch project details',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'project_details_fetch_failed',
      };
    }
  }

  async updateProject(
    projectId: number,
    updateProjectDto: UpdateProjectDto,
    userId: number
  ): Promise<ServiceResponse> {
    try {
      // Prepare update data with proper cleaning
      const updateData = await this.prepareUpdateData(updateProjectDto);

      // If no valid data to update after cleaning, return early
      if (Object.keys(updateData).length === 0) {
        return {
          message: 'No valid data provided for update',
          statusCode: 400,
          error: 'bad_request',
          data: null,
          code: 'no_update_data',
        };
      }

      // Perform the update
      const [updatedProject] = await this.drizzleService.db
        .update(project)
        .set(updateData)
        .where(eq(project.id, projectId))
        .returning();

      if (!updatedProject) {
        return {
          message: 'Failed to update project',
          statusCode: 500,
          error: 'internal_server_error',
          data: null,
          code: 'project_update_failed',
        };
      }

      return {
        message: 'Project updated successfully',
        statusCode: 200,
        error: null,
        data: updatedProject,
        code: 'project_updated',
      };
    } catch (error) {
      console.error('Error updating project:', error);
      return {
        message: 'Failed to update project',
        statusCode: 500,
        error: error.message || 'internal_server_error',
        data: null,
        code: 'project_update_failed',
      };
    }
  }

  /**
   * Prepare update data by cleaning and transforming the DTO
   * @param updateProjectDto - The update DTO
   * @returns Promise<object>
   */
  private async prepareUpdateData(updateProjectDto: UpdateProjectDto): Promise<any> {
    const updateData: any = {};

    // Define field mappings and their expected types/handlers
    const fieldHandlers = {
      // String fields
      name: (value: any) => this.cleanStringValue(value),
      slug: (value: any) => this.cleanStringValue(value),
      description: (value: any) => this.cleanStringValue(value),
      purpose: (value: any) => this.cleanStringValue(value),
      type: (value: any) => this.cleanStringValue(value),
      ecosystem: (value: any) => this.cleanStringValue(value),
      scale: (value: any) => this.cleanStringValue(value),
      classification: (value: any) => this.cleanStringValue(value),
      website: (value: any) => this.cleanUrlValue(value),
      videoUrl: (value: any) => this.cleanUrlValue(value),
      image: (value: any) => this.cleanStringValue(value),
      intensity: (value: any) => this.cleanStringValue(value),
      revisionPeriodicity: (value: any) => this.cleanStringValue(value),

      // Integer fields
      target: (value: any) => this.cleanIntegerValue(value),

      // Country code (3 character string)
      country: (value: any) => this.cleanCountryCode(value),

      // Boolean fields
      isActive: (value: any) => this.cleanBooleanValue(value),
      isPublic: (value: any) => this.cleanBooleanValue(value),
      isPersonal: (value: any) => this.cleanBooleanValue(value),
      isPrimary: (value: any) => this.cleanBooleanValue(value),

      // JSON fields
      metadata: (value: any) => this.cleanJsonValue(value),
      originalGeometry: (value: any) => this.cleanJsonValue(value),

      // Special handling for location (PostGIS geometry)
      location: (value: any) => this.handleLocationValue(value),
    };

    // Process each field in the DTO
    Object.keys(updateProjectDto).forEach(key => {
      if (fieldHandlers[key]) {
        const cleanedValue = fieldHandlers[key](updateProjectDto[key]);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          updateData[key] = cleanedValue;
        }
      }
    });

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    return updateData;
  }

  /**
   * Clean string values - remove empty objects, null, undefined, empty strings
   */
  private cleanStringValue(value: any): string | null {
    if (value === null || value === undefined || value === '' ||
      (typeof value === 'object' && Object.keys(value).length === 0)) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    return null;
  }

  /**
   * Clean URL values with basic validation
   */
  private cleanUrlValue(value: any): string | null {
    const cleanedString = this.cleanStringValue(value);
    if (!cleanedString) return null;

    // Basic URL validation
    try {
      new URL(cleanedString);
      return cleanedString;
    } catch {
      // If it's not a valid URL but starts with http/https, return as is
      if (cleanedString.startsWith('http://') || cleanedString.startsWith('https://')) {
        return cleanedString;
      }
      return null;
    }
  }

  /**
   * Clean integer values
   */
  private cleanIntegerValue(value: any): number | null {
    if (value === null || value === undefined ||
      (typeof value === 'object' && Object.keys(value).length === 0)) {
      return null;
    }

    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < 0) {
      return null;
    }

    return num;
  }

  /**
   * Clean country code (3 character string)
   */
  private cleanCountryCode(value: any): string | null {
    const cleanedString = this.cleanStringValue(value);
    if (!cleanedString) return null;

    // Country codes should be 3 characters
    if (cleanedString.length === 3) {
      return cleanedString.toUpperCase();
    }

    return null;
  }

  /**
   * Clean boolean values
   */
  private cleanBooleanValue(value: any): boolean | null {
    if (value === null || value === undefined ||
      (typeof value === 'object' && Object.keys(value).length === 0)) {
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    // Handle string representations
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }

    // Handle numeric representations
    if (typeof value === 'number') {
      return value !== 0;
    }

    return null;
  }

  /**
   * Clean JSON values
   */
  private cleanJsonValue(value: any): any | null {
    if (value === null || value === undefined) {
      return null;
    }

    // If it's an empty object, return null
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return null;
    }

    // If it's a valid object with data, return it
    if (typeof value === 'object') {
      return value;
    }

    return null;
  }

  /**
   * Handle location/geometry data for PostGIS
   */
  private handleLocationValue(value: any): any | null {
    if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
      return null;
    }

    try {
      // Validate GeoJSON structure
      if (value.type === 'Feature' && value.geometry) {
        const geometry = this.getGeoJSONForPostGIS(value);
        return sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
      } else if (value.type && value.coordinates) {
        // Direct geometry object
        const geometry = this.getGeoJSONForPostGIS(value);
        return sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
      }

      return null;
    } catch (error) {
      console.error('Invalid GeoJSON provided:', error);
      return null;
    }
  }


  /**
   * Validate project data before update
   * @param projectId - The project ID
   * @param updateProjectDto - The update data
   * @returns Promise<ServiceResponse>
   */
  async validateUpdateData(
    projectId: number,
    updateProjectDto: UpdateProjectDto
  ): Promise<ServiceResponse> {
    try {
      const validationErrors = [];

      // Check for duplicate project names (if updating projectName)


      // Add more validation rules as needed

      if (validationErrors.length > 0) {
        return {
          message: 'Validation failed',
          statusCode: 400,
          error: 'validation_failed',
          data: { validationErrors },
          code: 'validation_failed',
        };
      }

      return {
        message: 'Validation passed',
        statusCode: 200,
        error: null,
        data: null,
        code: 'validation_passed',
      };

    } catch (error) {
      console.error('Error validating update data:', error);
      return {
        message: 'Validation error',
        statusCode: 500,
        error: error.message || 'internal_server_error',
        data: null,
        code: 'validation_error',
      };
    }
  }

  async remove(membership: ProjectGuardResponse, userData: User) {
    try {
      return await this.drizzleService.db.transaction(async (tx) => {
        await tx
          .update(project)
          .set({
            isActive: false,
            deletedAt: new Date()
          })
          .where(eq(project.id, membership.projectId));

        // Find other active projects where user is a member
        const otherProjects = await tx
          .select({
            projectUid: project.uid,
            workspaceUid: workspace.uid,
            isPrimary: project.isPrimary,
            isPersonal: project.isPersonal,
            updatedAt: project.updatedAt
          })
          .from(project)
          .innerJoin(projectMember, eq(projectMember.projectId, project.id))
          .innerJoin(workspace, eq(workspace.id, project.workspaceId))
          .where(
            and(
              eq(projectMember.userId, membership.userId),
              eq(project.isActive, true),
              ne(project.id, membership.projectId) // Exclude the deleted project
            )
          )
          .orderBy(
            // Priority order: primary projects first, then personal, then by most recent
            desc(project.isPrimary),
            desc(project.isPersonal),
            desc(project.updatedAt)
          );

        if (!otherProjects || otherProjects.length === 0) {
          // No other projects, clear primary references
          await tx
            .update(user)
            .set({
              primaryProjectUid: null,
              primaryWorkspaceUid: null
            })
            .where(eq(user.id, membership.userId));
        } else {
          // Set the highest priority project as primary
          const newPrimaryProject = otherProjects[0];
          await tx
            .update(user)
            .set({
              primaryWorkspaceUid: newPrimaryProject.workspaceUid,
              primaryProjectUid: newPrimaryProject.projectUid
            })
            .where(eq(user.id, membership.userId));
        }

        // Always invalidate cache after transaction
        await this.userCacheService.invalidateUser(userData);

        return {
          message: 'Project deleted successfully',
          statusCode: 200,
          error: null,
          data: { success: true },
          code: 'project_deleted',
        };
      });

    } catch (error) {
      console.error('Error deleting project:', error);
      return {
        message: 'Failed to delete project',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'project_delete_failed',
      };
    }
  }








  // // async findAll(userId: number, primaryOrg: number) {
  // //   try {
  // //     const result = await this.drizzleService.db
  // //       .select({
  // //         project: {
  // //           uid: projects.uid,
  // //           slug: projects.slug,
  // //           projectName: projects.projectName,
  // //           projectType: projects.projectType,
  // //           target: projects.target,
  // //           description: projects.description,
  // //           createdAt: projects.createdAt,
  // //           updatedAt: projects.updatedAt,
  // //           location: sql`ST_AsGeoJSON(${projects.location})::json`.as('location')
  // //         },
  // //         role: projectMembers.projectRole,
  // //       })
  // //       .from(projectMembers)
  // //       .innerJoin(projects, eq(projectMembers.projectId, projects.id))
  // //       .where(and(eq(projectMembers.userId, userId), eq(projectMembers.workspaceId, primaryOrg)));

  // //     return {
  // //       message: 'User projects fetched successfully',
  // //       statusCode: 200,
  // //       error: null,
  // //       data: result.map(({ project, role }) => ({
  // //         ...project,
  // //         userRole: role,
  // //       })),
  // //       code: 'user_projects_fetched',
  // //     };
  // //   } catch (error) {
  // //     console.error('Error fetching user projects:', error);
  // //     return {
  // //       message: 'Failed to fetch user projects',
  // //       statusCode: 500,
  // //       error: error.message || "internal_server_error",
  // //       data: null,
  // //       code: 'user_projects_fetch_failed',
  // //     };
  // //   }
  // // }




























  // // async getMembers(projectId: number) {
  // //   try {
  // //     const result = await this.drizzleService.db
  // //       .select({
  // //         id: users.id,
  // //         name: users.displayName,
  // //         email: users.email,
  // //         avatar: users.image,
  // //         role: projectMembers.projectRole,
  // //         joinedAt: projectMembers.joinedAt,
  // //         invitedAt: projectMembers.invitedAt,
  // //       })
  // //       .from(projectMembers)
  // //       .innerJoin(users, eq(projectMembers.userId, users.id))
  // //       .where(eq(projectMembers.projectId, projectId));

  // //     return {
  // //       message: 'Project members fetched successfully',
  // //       statusCode: 200,
  // //       error: null,
  // //       data: result,
  // //       code: 'project_members_fetched',
  // //     };
  // //   } catch (error) {
  // //     console.error('Error fetching project members:', error);
  // //     return {
  // //       message: 'Failed to fetch project members',
  // //       statusCode: 500,
  // //       error: error.message || "internal_server_error",
  // //       data: null,
  // //       code: 'project_members_fetch_failed',
  // //     };
  // //   }
  // // }

  // // async addMember(projectId: number, addMemberDto: AddProjectMemberDto, currentUserId: number): Promise<any> {
  // //   try {
  // //     // Only owner/admin can add members
  // //     const membership = await this.getMemberRole(projectId, currentUserId);

  // //     if (!membership || !['owner', 'admin'].includes(membership.role)) {
  // //       return {
  // //         message: 'You do not have permission to add members to this project',
  // //         statusCode: 403,
  // //         error: "forbidden",
  // //         data: null,
  // //         code: 'add_member_permission_denied',
  // //       };
  // //     }

  // //     // Check if project exists
  // //     const projectQuery = await this.drizzleService.db
  // //       .select({ id: projects.id })
  // //       .from(projects)
  // //       .where(eq(projects.id, projectId));

  // //     if (projectQuery.length === 0) {
  // //       return {
  // //         message: 'Project not found',
  // //         statusCode: 404,
  // //         error: "not_found",
  // //         data: null,
  // //         code: 'project_not_found',
  // //       };
  // //     }

  // //     // Find user by email
  // //     const userQuery = await this.drizzleService.db
  // //       .select()
  // //       .from(users)
  // //       .where(eq(users.email, addMemberDto.email));

  // //     if (userQuery.length === 0) {
  // //       return {
  // //         message: 'User not found',
  // //         statusCode: 404,
  // //         error: "not_found",
  // //         data: null,
  // //         code: 'user_not_found',
  // //       };
  // //     }

  // //     const userToAdd = userQuery[0];

  // //     // Check if user is already a member
  // //     const existingMemberQuery = await this.drizzleService.db
  // //       .select()
  // //       .from(projectMembers)
  // //       .where(
  // //         and(
  // //           eq(projectMembers.projectId, projectId),
  // //           eq(projectMembers.userId, userToAdd.id)
  // //         )
  // //       );

  // //     if (existingMemberQuery.length > 0) {
  // //       return {
  // //         message: 'User is already a member of this project',
  // //         statusCode: 409,
  // //         error: "conflict",
  // //         data: null,
  // //         code: 'user_already_member',
  // //       };
  // //     }

  // //     // Add member
  // //     const [result] = await this.drizzleService.db
  // //       .insert(projectMembers)
  // //       .values({
  // //         projectId: projectId,
  // //         workspaceId: 1,
  // //         uid: uuidv4(),
  // //         userId: userToAdd.id,
  // //         projectRole: addMemberDto.role as 'owner' | 'admin' | 'contributor' | 'observer',
  // //         joinedAt: new Date(),
  // //       })
  // //       .returning();

  // //     return {
  // //       message: 'Member added successfully',
  // //       statusCode: 201,
  // //       error: null,
  // //       data: {
  // //         ...userToAdd,
  // //         role: result.projectRole,
  // //         joinedAt: result.joinedAt,
  // //       },
  // //       code: 'member_added',
  // //     };
  // //   } catch (error) {
  // //     console.error('Error adding member:', error);
  // //     return {
  // //       message: 'Failed to add member',
  // //       statusCode: 500,
  // //       error: error.message || "internal_server_error",
  // //       data: null,
  // //       code: 'add_member_failed',
  // //     };
  // //   }
  // // }







  // // async getMemberRole(projectId: number, userId: number): Promise<{ role: string } | null> {
  // //   try {
  // //     // const membershipQuery = await this.drizzleService.db
  // //     //   .select({ role: projectMembers.role })
  // //     //   .from(projectMembers)
  // //     //   .where(
  // //     //     and(
  // //     //       eq(projectMembers.projectId, projectId),
  // //     //       eq(projectMembers.userId, userId)
  // //     //     )
  // //     //   )
  // //     //   .limit(1);

  // //     // return membershipQuery.length > 0 ? membershipQuery[0] : null;
  // //     return null
  // //   } catch (error) {
  // //     console.error('Error fetching member role:', error);
  // //     return null;
  // //   }
  // // }









  // // // Get project invites (pending invitations)
  // // async getProjectInvites(projectId: number, currentUserId: number) {
  // //   try {
  // //     // Only owner/admin can view invites
  // //     const membership = await this.getMemberRole(projectId, currentUserId);

  // //     if (!membership || !['owner', 'admin'].includes(membership.role)) {
  // //       return {
  // //         message: 'You do not have permission to view invitations',
  // //         statusCode: 403,
  // //         error: "forbidden",
  // //         data: null,
  // //         code: 'view_invites_permission_denied',
  // //       };
  // //     }

  // //     const invites = await this.drizzleService.db
  // //       .select({
  // //         id: projectInvites.id,
  // //         email: projectInvites.email,
  // //         role: projectInvites.projectRole,
  // //         message: projectInvites.message,
  // //         status: projectInvites.status,
  // //         expiresAt: projectInvites.expiresAt,
  // //         createdAt: projectInvites.createdAt,
  // //         inviterName: users.displayName,
  // //       })
  // //       .from(projectInvites)
  // //       .innerJoin(users, eq(projectInvites.invitedById, users.id))
  // //       .where(eq(projectInvites.projectId, projectId));

  // //     return {
  // //       message: 'Project invitations fetched successfully',
  // //       statusCode: 200,
  // //       error: null,
  // //       data: invites,
  // //       code: 'project_invites_fetched',
  // //     };
  // //   } catch (error) {
  // //     console.error('Error fetching project invites:', error);
  // //     return {
  // //       message: 'Failed to fetch project invitations',
  // //       statusCode: 500,
  // //       error: error.message || "internal_server_error",
  // //       data: null,
  // //       code: 'project_invites_fetch_failed',
  // //     };
  // //   }
  // // }






  // // /**
  // //  * Calculate summary statistics for members and invitations
  // //  */
  // // private calculateSummary(
  // //   members: ProjectMemberResponse[],
  // //   invitations: ProjectInviteResponse[]
  // // ) {
  // //   const now = new Date();

  // //   // Count invitations by status
  // //   const pendingInvitations = invitations.filter(inv => inv.status === 'pending').length;
  // //   const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted').length;
  // //   const expiredInvitations = invitations.filter(inv =>
  // //     inv.status === 'pending' && inv.expiresAt < now
  // //   ).length;

  // //   // Count members by role
  // //   const roleDistribution: Record<string, number> = {};
  // //   members.forEach(member => {
  // //     roleDistribution[member.role] = (roleDistribution[member.role] || 0) + 1;
  // //   });

  // //   return {
  // //     totalMembers: members.length,
  // //     totalPendingInvitations: pendingInvitations,
  // //     totalAcceptedInvitations: acceptedInvitations,
  // //     totalExpiredInvitations: expiredInvitations,
  // //     roleDistribution
  // //   };
  // // }
}
