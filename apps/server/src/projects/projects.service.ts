// src/projects/projects.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { projects, projectMembers, users, projectInvites, bulkInvites } from '../database/schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
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

export interface ProjectGuardResponse { projectId: number, role: string, userId: number, projectName: string }

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

  async create(createProjectDto: CreateProjectDto, userId: number): Promise<any> {
    try {
      let locationValue: any = null;
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

      // Generate slug if not provided
      const slug = createProjectDto.slug || this.generateSlug(createProjectDto.projectName);

      // Check if slug is unique
      const existingProject = await this.drizzleService.db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, slug))
        .limit(1);

      if (existingProject.length > 0) {
        // Generate unique slug by appending timestamp
        const uniqueSlug = `${slug}-${Date.now()}`;
        createProjectDto.slug = uniqueSlug;
      } else {
        createProjectDto.slug = slug;
      }

      // Use transaction to ensure data consistency
      const result = await this.drizzleService.db.transaction(async (tx) => {
        // Create project with updated schema fields
        const [project] = await tx
          .insert(projects)
          .values({
            uid: createProjectDto.uid ?? generateUid('prj'),
            createdById: userId,
            slug: createProjectDto.slug ?? this.generateSlug(createProjectDto.projectName),
            projectName: createProjectDto.projectName ?? '',
            projectType: createProjectDto.projectType ?? '',
            projectWebsite: createProjectDto.projectWebsite ?? '',
            description: createProjectDto.description ?? '',
            location: locationValue,
            isPrimary: false,
            isPersonal: false,
            originalGeometry: createProjectDto.location
          })
          .returning();

        await tx
          .insert(projectMembers)
          .values({
            projectId: project.id,
            uid: generateUid('mem'),
            userId: userId,
            projectRole: 'owner',
            joinedAt: new Date(),
          });

        return project;
      });
      console.log("IOSCJD", result)
      this.notificationService.createNotification({
        userId: userId,
        type: NotificationType.PROJECT_UPDATE,
        title: 'New Project created',
        message: `New Project with name ${createProjectDto.projectName} created.`
      })
      return {
        message: 'Project created successfully',
        statusCode: 201,
        error: null,
        data: result,
        code: 'project_created',
      };
    } catch (error) {
      console.error('Error creating project:', error);
      return {
        message: 'Failed to create project',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'project_creation_failed',
      };
    }
  }

  async createPersonalProject(createProjectDto: CreateProjectDto, userId: number): Promise<any> {
    try {
      const slug = createProjectDto.slug || this.generateSlug(createProjectDto.projectName);
      const existingProject = await this.drizzleService.db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, slug))
        .limit(1);

      if (existingProject.length > 0) {
        const uniqueSlug = `${slug}-${Date.now()}`;
        createProjectDto.slug = uniqueSlug;
      } else {
        createProjectDto.slug = slug;
      }

      const result = await this.drizzleService.db.transaction(async (tx) => {
        const project = await tx
          .insert(projects)
          .values({
            uid: createProjectDto.uid ?? generateUid('proj'),
            createdById: userId,
            slug: createProjectDto.slug ?? this.generateSlug(createProjectDto.projectName),
            projectName: createProjectDto.projectName ?? '',
            projectType: createProjectDto.projectType ?? '',
            description: createProjectDto.description ?? '',
            isPersonal: true,
          })
          .returning();

        await tx
          .insert(projectMembers)
          .values({
            uid: generateUid('mem'),
            projectId: project[0].id,
            userId: userId,
            projectRole: 'owner',
            joinedAt: new Date(),
            invitedAt: new Date()
          });
        this.notificationService.createNotification({
          userId: userId,
          type: NotificationType.PROJECT_UPDATE,
          title: 'New Personal Project created',
          message: `New Personal Project with name ${createProjectDto.projectName} created.`
        })
        return project;
      });

      return {
        message: 'Project created successfully',
        statusCode: 201,
        error: null,
        data: result,
        code: 'project_created',
      };
    } catch (error) {
      console.error('Error creating project:', error);
      return {
        message: 'Failed to create project',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'project_creation_failed',
      };
    }
  }

  async findAll(userId: number) {
    try {
      const result = await this.drizzleService.db
        .select({
          project: {
            uid: projects.uid,
            slug: projects.slug,
            projectName: projects.projectName,
            projectType: projects.projectType,
            target: projects.target,
            description: projects.description,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
            location: sql`ST_AsGeoJSON(${projects.location})::json`.as('location')
          },
          role: projectMembers.projectRole,
        })
        .from(projectMembers)
        .innerJoin(projects, eq(projectMembers.projectId, projects.id))
        .where(eq(projectMembers.userId, userId));

      return {
        message: 'User projects fetched successfully',
        statusCode: 200,
        error: null,
        data: result.map(({ project, role }) => ({
          ...project,
          userRole: role,
        })),
        code: 'user_projects_fetched',
      };
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return {
        message: 'Failed to fetch user projects',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'user_projects_fetch_failed',
      };
    }
  }

  async getProjectMembersAndInvitations(membership: ProjectGuardResponse): Promise<ProjectMembersAndInvitesResponse> {
    // Get all members with user detailsgetProjectInviteStatus
    const members = await this.drizzleService.db
      .select({
        role: projectMembers.projectRole,
        joinedAt: projectMembers.joinedAt,
        invitedAt: projectMembers.invitedAt,
        user: {
          name: users.displayName,
          email: users.email,
          image: users.image,
          isActive: users.isActive,
          uid: users.uid,
        }
      })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, membership.projectId))
      .orderBy(desc(projectMembers.joinedAt));

    // Get all invitations with inviter details
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
          uid: users.uid,
          email: users.email,
          name: users.displayName,
        }
      })
      .from(projectInvites)
      .innerJoin(users, eq(projectInvites.invitedById, users.id))
      .where(
        and(
          eq(projectInvites.projectId, membership.projectId),
          eq(projectInvites.status, 'pending')
        )
      )
      .orderBy(desc(projectInvites.createdAt));

    // Calculate summary statistics
    return {
      members,
      invitations
    };
  }

  async getMemberRoleFromUid(projectUid: string, userId: number): Promise<ProjectGuardResponse | null> {
    try {
      const project = await this.drizzleService.db
        .select()
        .from(projects)
        .where(eq(projects.uid, projectUid))
        .then(results => {
          if (results.length === 0) throw new NotFoundException('Project not found');
          return results[0];
        });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      const membershipQuery = await this.drizzleService.db
        .select({ role: projectMembers.projectRole, userId: projectMembers.userId })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, project.id),
            eq(projectMembers.userId, userId)
          )
        )
        .limit(1);

      return membershipQuery.length > 0 ? { projectName: project.projectName, projectId: project.id, role: membershipQuery[0].role, userId: membershipQuery[0].userId } : null;
    } catch (error) {
      console.error('Error fetching member role:', error);
      return null;
    }
  }

  async inviteMember(email: string, role: string, membership: ProjectGuardResponse, currentUser: User, message?: string): Promise<any> {
    try {
      const existingUser = await this.drizzleService.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .then(results => results[0] || null);

      if (existingUser) {
        const existingMembership = await this.drizzleService.db
          .select()
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, membership.projectId),
              eq(projectMembers.userId, existingUser.id)
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

      // Check for existing pending invitation
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

      // Create invitation
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiry

      const [invitation] = await this.drizzleService.db
        .insert(projectInvites)
        .values({
          projectId: membership.projectId,
          uid: generateUid('inv'),
          email,
          // Only allow roles supported by your schema
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



  async createInviteLink(membership: ProjectGuardResponse, data: any): Promise<any> {
    try {

      const validateRestriction = isValidEmailDomain(data.restriction)
      if (!validateRestriction) {
        return {
          message: 'Failed to validate domain',
          statusCode: 500,
          error: "restriction",
          data: null,
          code: 'restriction',
        };
      }
      // Create invitation
      const expiryDate = new Date(data.expiry);


      const result = await this.drizzleService.db
        .insert(bulkInvites)
        .values({
          projectId: membership.projectId,
          invitedById: membership.userId,
          token: uuidv4(),
          uid: generateUid('inv'),
          projectRole: 'contributor',
          expiresAt: expiryDate,
          message: '',
          restriction: data.restriction
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

  async getProjectInviteStatus(token: string, email: string): Promise<ProjectInviteStatusResponse> {
    console.log("SDCC", token, email,)
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
            uid: projects.uid,
            name: projects.projectName,
            description: projects.description,
            slug: projects.slug,
            country: projects.country,
            image: projects.image,
          },
          invitedBy: {
            uid: users.uid,
            name: users.displayName,
            email: users.email,
            displayName: users.displayName,
            image: users.image,
          }
        })
        .from(projectInvites)
        .innerJoin(projects, eq(projectInvites.projectId, projects.id))
        .innerJoin(users, eq(projectInvites.invitedById, users.id))
        .where(eq(projectInvites.token, token))
        .orderBy(desc(projectInvites.createdAt))
        .limit(1);
      console.log("SDC", inviteResult)
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

  async getProjectSingleLinkStatus(token: string): Promise<ProjectInviteStatusResponse> {
    try {
      const inviteResult = await this.drizzleService.db
        .select({
          invite: {
            uid: bulkInvites.uid,
            email: bulkInvites.restriction,
            role: bulkInvites.projectRole,
            message: bulkInvites.message,
            status: bulkInvites.status,
            expiresAt: bulkInvites.expiresAt,
            createdAt: bulkInvites.createdAt,
            projectId: bulkInvites.projectId,
          },
          project: {
            uid: projects.uid,
            name: projects.projectName,
            description: projects.description,
            slug: projects.slug,
            country: projects.country,
            image: projects.image,
          },
          invitedBy: {
            uid: users.uid,
            name: users.displayName,
            email: users.email,
            displayName: users.displayName,
            image: users.image,
          }
        })
        .from(bulkInvites)
        .innerJoin(projects, eq(bulkInvites.projectId, projects.id))
        .innerJoin(users, eq(bulkInvites.invitedById, users.id))
        .where(eq(bulkInvites.token, token))

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


  async getProjectInviteLink(memerShip: ProjectGuardResponse): Promise<any> {
    try {
      const inviteResult = await this.drizzleService.db
        .select({
          id: bulkInvites.uid,
          invitationlink: bulkInvites.token,
          domain_restriction: bulkInvites.restriction,
          created_at: bulkInvites.createdAt,
          created_by: users.displayName,
        })
        .from(bulkInvites)
        .innerJoin(users, eq(bulkInvites.invitedById, users.id))
        .where(
          and(
            eq(bulkInvites.projectId, memerShip.projectId),
            isNull(bulkInvites.deletedAt)
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

  async acceptInvite(token: string, userId: number, email: string) {
    try {
      const invite = await this.drizzleService.db
        .select({
          invite: projectInvites,
          project: projects,
          inviter: users,
        })
        .from(projectInvites)
        .innerJoin(projects, eq(projectInvites.projectId, projects.id))
        .innerJoin(users, eq(projectInvites.invitedById, users.id))
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

      if (new Date(invite.invite.expiresAt) < new Date()) {
        return {
          message: 'Invitation has expired',
          statusCode: 400,
          error: "expired",
          data: null,
          code: 'invitation_expired',
        };
      }


      // Check if already a member
      const existingMember = await this.drizzleService.db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, invite.invite.projectId),
            eq(projectMembers.userId, userId),
          )
        )
        .then(results => results[0] || null);

      if (existingMember) {
        return {
          message: 'You are already a member of this project',
          statusCode: 409,
          error: "conflict",
          data: null,
          code: 'already_member',
        };
      }

      // Use a transaction to ensure data consistency
      const result = await this.drizzleService.db.transaction(async (tx) => {
        // Update invite status
        await tx
          .update(projectInvites)
          .set({
            status: 'accepted',
            acceptedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(projectInvites.id, invite.invite.id));

        // Add user as project member
        const [membership] = await tx
          .insert(projectMembers)
          .values({
            projectId: invite.invite.projectId,
            userId: userId,
            uid: generateUid('mem'),
            projectRole: invite.invite.projectRole,
            joinedAt: new Date(),
          })
          .returning();

        return membership;
      });

      // // Send notifications
      // await this.notificationService.sendInviteAcceptedEmail({
      //   inviterEmail: invite.inviter.email,
      //   inviterName: invite.inviter.name || invite.inviter.authName || '',
      //   memberName: user.name || user.authName || user.email,
      //   memberEmail: user.email,
      //   projectName: invite.project.projectName,
      //   projectId: invite.project.id,
      // });

      // await this.notificationService.sendNewMemberWelcomeEmail({
      //   email: user.email,
      //   name: user.name || user.authName || 'there',
      //   projectName: invite.project.projectName,
      //   projectId: invite.project.id,
      // });

      return {
        message: `You have successfully joined ${invite.project.projectName}`,
        statusCode: 200,
        error: null,
        data: {
          projectId: invite.project.id,
          role: result.projectRole,
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

  async acceptLinkInvite(token: string, userId: number, email: string) {
    try {
      const invite = await this.drizzleService.db
        .select({
          invite: bulkInvites,
          project: projects,
          inviter: users,
        })
        .from(bulkInvites)
        .innerJoin(projects, eq(bulkInvites.projectId, projects.id))
        .innerJoin(users, eq(bulkInvites.invitedById, users.id))
        .where(eq(bulkInvites.token, token))
        .then(results => results[0] || null);

      if (!invite) {
        return {
          message: 'Invitation link is invalid',
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


      try {
        const emailDomain = email.substring(email.indexOf('@'));
        const targetDomain = invite.invite.restriction?.map(el=>el.startsWith('@') ? el: '@' + el)
        if (!targetDomain?.includes(emailDomain)) {
          return {
            message: 'Please login with the email you have been invited with',
            statusCode: 401,
            error: "expired",
            data: null,
            code: 'invitation_expired',
          };
        }
      } catch (error) {
        return {
          message: 'Please login with the email you have been invited with',
          statusCode: 401,
          error: "expired",
          data: null,
          code: 'invitation_expired',
        };
      }


      // Check if already a member
      const existingMember = await this.drizzleService.db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, invite.invite.projectId),
            eq(projectMembers.userId, userId),
          )
        )
        .then(results => results[0] || null);

      if (existingMember) {
        return {
          message: 'You are already a member of this project',
          statusCode: 409,
          error: "conflict",
          data: null,
          code: 'already_member',
        };
      }
      await this.drizzleService.db
        .insert(projectMembers)
        .values({
          projectId: invite.invite.projectId,
          userId: userId,
          uid: generateUid('mem'),
          projectRole: 'contributor',
          joinedAt: new Date(),
          bulkInviteId: invite.invite.id,
        })
        .returning();
      // // Send notifications
      // await this.notificationService.sendInviteAcceptedEmail({
      //   inviterEmail: invite.inviter.email,
      //   inviterName: invite.inviter.name || invite.inviter.authName || '',
      //   memberName: user.name || user.authName || user.email,
      //   memberEmail: user.email,
      //   projectName: invite.project.projectName,
      //   projectId: invite.project.id,
      // });

      // await this.notificationService.sendNewMemberWelcomeEmail({
      //   email: user.email,
      //   name: user.name || user.authName || 'there',
      //   projectName: invite.project.projectName,
      //   projectId: invite.project.id,
      // });

      return {
        message: `You have successfully joined ${invite.project.projectName}`,
        statusCode: 200,
        error: null,
        data: {
          projectId: invite.project.id,
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

  async expireInvite(token: string) {
    try {
      // Find the invitation
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

      // Update invite status
      await this.drizzleService.db
        .update(projectInvites)
        .set({
          status: 'expired',
          updatedAt: new Date()
        })
        .where(eq(projectInvites.id, invite.invite.id));

      // // Send notification
      // await this.notificationService.sendInviteDeclinedEmail({
      //   inviterEmail: invite.inviter.email,
      //   inviterName: invite.inviter.name || invite.inviter.authName || '',
      //   memberEmail: invite.invite.email,
      //   projectName: invite.project.projectName,
      // });

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

  async declineInvite(token: string, email: string) {
    try {
      // Find the invitation
      const invite = await this.drizzleService.db
        .select({
          invite: projectInvites,
          project: projects,
          inviter: users,
        })
        .from(projectInvites)
        .innerJoin(projects, eq(projectInvites.projectId, projects.id))
        .innerJoin(users, eq(projectInvites.invitedById, users.id))
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

      // Update invite status
      await this.drizzleService.db
        .update(projectInvites)
        .set({
          status: 'declined',
          updatedAt: new Date()
        })
        .where(eq(projectInvites.id, invite.invite.id));

      // // Send notification
      // await this.notificationService.sendInviteDeclinedEmail({
      //   inviterEmail: invite.inviter.email,
      //   inviterName: invite.inviter.name || invite.inviter.authName || '',
      //   memberEmail: invite.invite.email,
      //   projectName: invite.project.projectName,
      // });

      return {
        message: `You have declined the invitation to join ${invite.project.projectName}`,
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

  async removeMember(projectId: string, memberId: string, myMembership: ProjectGuardResponse, currentUserId: number) {
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
        .from(projectMembers)
        .innerJoin(users, eq(users.uid, memberId))
        .where(
          and(
            eq(projectMembers.projectId, myMembership.projectId),
            eq(projectMembers.userId, users.id),
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
      if (memberToRemove.project_members.projectRole === 'owner') {
        return {
          message: 'Cannot remove the project owner',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'cannot_remove_owner',
        };
      }

      // Admin cannot remove another admin (only owner can)
      if (memberToRemove.project_members.projectRole === 'admin' && myMembership.role === 'admin') {
        return {
          message: 'Admin cannot remove another admin',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'admin_cannot_remove_admin',
        };
      }

      // Remove member
      await this.drizzleService.db
        .delete(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, myMembership.projectId),
            eq(projectMembers.userId, memberToRemove.users.id)
          )
        );

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

      // Remove member
      await this.drizzleService.db
        .update(bulkInvites)
        .set({ deletedAt: new Date(), expiresAt: new Date() })
        .where(
          and(
            eq(bulkInvites.uid, uid)
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

  async updateMemberRole(
    memberId: string,
    myMembership: ProjectGuardResponse,
    updateRoleDto: UpdateProjectRoleDto,
  ) {
    try {
      // Only owner/admin can update roles

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
          member: projectMembers,
          user: users,
        })
        .from(projectMembers)
        .innerJoin(users, eq(users.uid, memberId))
        .where(
          and(
            eq(projectMembers.projectId, myMembership.projectId),
            eq(projectMembers.userId, users.id)
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
        .update(projectMembers)
        .set({
          projectRole: updateRoleDto.role,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectMembers.projectId, myMembership.projectId),
            eq(projectMembers.userId, memberToUpdate.user.id)
          )
        )
        .returning();

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

  async findOne(projectId: number) {
    try {
      const projectQuery = await this.drizzleService.db
        .select({
          id: projects.id,
          slug: projects.slug,
          projectName: projects.projectName,
          projectType: projects.projectType,
          ecosystem: projects.ecosystem,
          projectScale: projects.projectScale,
          target: projects.target,
          projectWebsite: projects.projectWebsite,
          description: projects.description,
          classification: projects.classification,
          image: projects.image,
          videoUrl: projects.videoUrl,
          country: projects.country,
          originalGeometry: projects.originalGeometry,
          url: projects.url,
          isActive: projects.isActive,
          isPublic: projects.isPublic,
          intensity: projects.intensity,
          revisionPeriodicityLevel: projects.revisionPeriodicityLevel,
          metadata: projects.metadata,
          createdById: projects.createdById,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          // Convert PostGIS location to GeoJSON
          location: sql`ST_AsGeoJSON(${projects.location})::json`.as('location')
        })
        .from(projects)
        .where(eq(projects.id, projectId));

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

  async update(projectId: number, updateProjectDto: UpdateProjectDto, userId: number): Promise<any> {
    try {
      // Check if user has permission (only owner/admin can update project details)
      const membership = await this.getMemberRole(projectId, userId);

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return {
          message: 'You do not have permission to update this project',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'update_permission_denied',
        };
      }

      let locationValue: any = undefined;
      if (updateProjectDto.location) {
        try {
          const geometry = this.getGeoJSONForPostGIS(updateProjectDto.location);
          locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
        } catch (error) {
          return {
            message: 'Invalid GeoJSON provided',
            statusCode: 400,
            error: "invalid_geojson",
            data: null,
            code: 'invalid_update_geojson',
          };
        }
      }

      // Prepare update data
      const updateData: any = {
        ...updateProjectDto,
        updatedAt: new Date(),
      };

      if (locationValue !== undefined) {
        updateData.location = locationValue;
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key =>
        updateData[key] === undefined && delete updateData[key]
      );

      // Update project
      const [result] = await this.drizzleService.db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, projectId))
        .returning();

      return {
        message: 'Project updated successfully',
        statusCode: 200,
        error: null,
        data: result,
        code: 'project_updated',
      };
    } catch (error) {
      console.error('Error updating project:', error);
      return {
        message: 'Failed to update project',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'project_update_failed',
      };
    }
  }

  async remove(projectId: number, userId: number) {
    try {
      // Only owner can delete a project
      const membership = await this.getMemberRole(projectId, userId);

      if (!membership || membership.role !== 'owner') {
        return {
          message: 'Only the project owner can delete the project',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'delete_permission_denied',
        };
      }

      // Soft delete the project
      await this.drizzleService.db
        .update(projects)
        .set({
          isActive: false
        })
        .where(eq(projects.id, projectId));

      return {
        message: 'Project deleted successfully',
        statusCode: 200,
        error: null,
        data: { success: true },
        code: 'project_deleted',
      };
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

  async getMembers(projectId: number) {
    try {
      const result = await this.drizzleService.db
        .select({
          id: users.id,
          name: users.displayName,
          email: users.email,
          avatar: users.image,
          role: projectMembers.projectRole,
          joinedAt: projectMembers.joinedAt,
          invitedAt: projectMembers.invitedAt,
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, projectId));

      return {
        message: 'Project members fetched successfully',
        statusCode: 200,
        error: null,
        data: result,
        code: 'project_members_fetched',
      };
    } catch (error) {
      console.error('Error fetching project members:', error);
      return {
        message: 'Failed to fetch project members',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'project_members_fetch_failed',
      };
    }
  }

  async addMember(projectId: number, addMemberDto: AddProjectMemberDto, currentUserId: number): Promise<any> {
    try {
      // Only owner/admin can add members
      const membership = await this.getMemberRole(projectId, currentUserId);

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return {
          message: 'You do not have permission to add members to this project',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'add_member_permission_denied',
        };
      }

      // Check if project exists
      const projectQuery = await this.drizzleService.db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId));

      if (projectQuery.length === 0) {
        return {
          message: 'Project not found',
          statusCode: 404,
          error: "not_found",
          data: null,
          code: 'project_not_found',
        };
      }

      // Find user by email
      const userQuery = await this.drizzleService.db
        .select()
        .from(users)
        .where(eq(users.email, addMemberDto.email));

      if (userQuery.length === 0) {
        return {
          message: 'User not found',
          statusCode: 404,
          error: "not_found",
          data: null,
          code: 'user_not_found',
        };
      }

      const userToAdd = userQuery[0];

      // Check if user is already a member
      const existingMemberQuery = await this.drizzleService.db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.userId, userToAdd.id)
          )
        );

      if (existingMemberQuery.length > 0) {
        return {
          message: 'User is already a member of this project',
          statusCode: 409,
          error: "conflict",
          data: null,
          code: 'user_already_member',
        };
      }

      // Add member
      const [result] = await this.drizzleService.db
        .insert(projectMembers)
        .values({
          projectId: projectId,
          uid: uuidv4(),
          userId: userToAdd.id,
          projectRole: addMemberDto.role as 'owner' | 'admin' | 'contributor' | 'observer',
          joinedAt: new Date(),
        })
        .returning();

      return {
        message: 'Member added successfully',
        statusCode: 201,
        error: null,
        data: {
          ...userToAdd,
          role: result.projectRole,
          joinedAt: result.joinedAt,
        },
        code: 'member_added',
      };
    } catch (error) {
      console.error('Error adding member:', error);
      return {
        message: 'Failed to add member',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'add_member_failed',
      };
    }
  }







  async getMemberRole(projectId: number, userId: number): Promise<{ role: string } | null> {
    try {
      // const membershipQuery = await this.drizzleService.db
      //   .select({ role: projectMembers.role })
      //   .from(projectMembers)
      //   .where(
      //     and(
      //       eq(projectMembers.projectId, projectId),
      //       eq(projectMembers.userId, userId)
      //     )
      //   )
      //   .limit(1);

      // return membershipQuery.length > 0 ? membershipQuery[0] : null;
      return null
    } catch (error) {
      console.error('Error fetching member role:', error);
      return null;
    }
  }









  // Get project invites (pending invitations)
  async getProjectInvites(projectId: number, currentUserId: number) {
    try {
      // Only owner/admin can view invites
      const membership = await this.getMemberRole(projectId, currentUserId);

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return {
          message: 'You do not have permission to view invitations',
          statusCode: 403,
          error: "forbidden",
          data: null,
          code: 'view_invites_permission_denied',
        };
      }

      const invites = await this.drizzleService.db
        .select({
          id: projectInvites.id,
          email: projectInvites.email,
          role: projectInvites.projectRole,
          message: projectInvites.message,
          status: projectInvites.status,
          expiresAt: projectInvites.expiresAt,
          createdAt: projectInvites.createdAt,
          inviterName: users.displayName,
        })
        .from(projectInvites)
        .innerJoin(users, eq(projectInvites.invitedById, users.id))
        .where(eq(projectInvites.projectId, projectId));

      return {
        message: 'Project invitations fetched successfully',
        statusCode: 200,
        error: null,
        data: invites,
        code: 'project_invites_fetched',
      };
    } catch (error) {
      console.error('Error fetching project invites:', error);
      return {
        message: 'Failed to fetch project invitations',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'project_invites_fetch_failed',
      };
    }
  }






  /**
   * Calculate summary statistics for members and invitations
   */
  private calculateSummary(
    members: ProjectMemberResponse[],
    invitations: ProjectInviteResponse[]
  ) {
    const now = new Date();

    // Count invitations by status
    const pendingInvitations = invitations.filter(inv => inv.status === 'pending').length;
    const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted').length;
    const expiredInvitations = invitations.filter(inv =>
      inv.status === 'pending' && inv.expiresAt < now
    ).length;

    // Count members by role
    const roleDistribution: Record<string, number> = {};
    members.forEach(member => {
      roleDistribution[member.role] = (roleDistribution[member.role] || 0) + 1;
    });

    return {
      totalMembers: members.length,
      totalPendingInvitations: pendingInvitations,
      totalAcceptedInvitations: acceptedInvitations,
      totalExpiredInvitations: expiredInvitations,
      roleDistribution
    };
  }
}
