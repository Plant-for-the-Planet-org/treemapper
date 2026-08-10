// // src/organizations/organizations.service.ts
// import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
// import { eq, and, isNull, sql, count } from 'drizzle-orm';
// import { v4 as uuidv4 } from 'uuid';
// import { CreateOrganizationDto } from './dto/create-organization.dto';
// import { OrganizationResponseDto, SelectOrganizationDto } from './dto/organization-response.dto';
// import { workspace, workspaceMembers, users, projects, } from '../database/schema/index';
// import { DrizzleService } from 'src/database/drizzle.service';
// import { generateUid } from 'src/util/uidGenerator';
// import { CacheService } from 'src/cache/cache.service';
// import { CACHE_KEYS, CACHE_TTL } from 'src/cache/cache-keys';
// import { User } from 'src/users/entities/user.entity';

// @Injectable()
// export class OrganizationsService {
//   constructor(
//     private readonly drizzle: DrizzleService,
//     private cacheService: CacheService,
//   ) { }

//   /**
//    * Create a new organization
//    */
//   async create(createOrgDto: CreateOrganizationDto, userId: number): Promise<OrganizationResponseDto> {
//     // Generate unique slug from organization name
//     const slug = await this.generateUniqueSlug(createOrgDto.name);

//     // Check if organization name already exists (globally unique)
//     const existingOrg = await this.drizzle.db
//       .select()
//       .from(workspace)
//       .where(
//         and(
//           eq(workspace.name, createOrgDto.name),
//           isNull(workspace.deletedAt)
//         )
//       )
//       .limit(1);

//     if (existingOrg.length > 0) {
//       throw new ConflictException('Organization with this name already exists');
//     }

//     const orgUid = `org_${uuidv4().replace(/-/g, '').substring(0, 20)}`;
//     const memberUid = `orgmem_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

//     try {
//       // Start transaction to create organization and add creator as owner
//       const result = await this.drizzle.db.transaction(async (tx) => {
//         // Create organization
//         const orgInsertResult = await tx
//           .insert(workspace)
//           .values({
//             uid: orgUid,
//             name: createOrgDto.name,
//             slug,
//             description: createOrgDto.description,
//             logo: createOrgDto.logo,
//             primaryColor: createOrgDto.primaryColor,
//             secondaryColor: createOrgDto.secondaryColor,
//             email: createOrgDto.email,
//             phone: createOrgDto.phone,
//             website: createOrgDto.website,
//             address: createOrgDto.address,
//             country: createOrgDto.country,
//             timezone: createOrgDto.timezone || 'UTC',
//             createdById: userId,
//           })
//           .returning();

//         const [newOrg] = Array.isArray(orgInsertResult) ? orgInsertResult : [];

//         // Add creator as organization owner
//         await tx
//           .insert(workspaceMembers)
//           .values({
//             uid: memberUid,
//             workspaceId: newOrg.id,
//             userId: userId,
//             role: 'owner',
//             status: 'active',
//             joinedAt: new Date(),
//           });

//         return newOrg;
//       });

//       // Return the created organization with counts
//       return this.getOrganizationWithCounts(result.id);
//     } catch (error) {
//       if (error.code === '23505') { // PostgreSQL unique constraint violation
//         throw new ConflictException('Organization with this name or slug already exists');
//       }
//       throw error;
//     }
//   }


//   async selectOrg(createOrgDto: SelectOrganizationDto, userId: number, auth0Id: string, user: any): Promise<any> {
//     try {
//       await this.drizzle.db.transaction(async (tx) => {
//         const existingProject = await tx
//           .select({ id: projects.id })
//           .from(projects)
//           .where(eq(projects.uid, createOrgDto.projectUid))
//           .limit(1);
//         console.log("LKSc existingProject", existingProject)
//         const existingWorksapce = await tx
//           .select({ id: workspace.id })
//           .from(workspace)
//           .where(eq(workspace.uid, createOrgDto.workspaceUid))
//           .limit(1);
//         console.log("LKSc existingWorksapce", existingWorksapce)

//         if (existingProject.length > 0 && existingWorksapce.length > 0) {
//           await tx.update(users)
//             .set({ primaryWorkspace: existingWorksapce[0].id, primaryProject: existingProject[0].id })
//             .where(eq(users.id, userId))
//           await this.cacheService.delete(CACHE_KEYS.USER.BY_AUTH0_ID(auth0Id));
//           const updateUser = { ...user }
//           updateUser['primaryWorkspace'] = existingWorksapce[0].id
//           updateUser['primaryProject'] = existingProject[0].id
//           await this.cacheService.set(CACHE_KEYS.USER.BY_AUTH0_ID(user.auth0Id), updateUser, CACHE_TTL.MEDIUM)
//         }
//       });
//       return { success: true };
//     } catch (error) {
//       if (error.code === '23505') { // PostgreSQL unique constraint violation
//         throw new ConflictException('Organization with this name or slug already exists');
//       }
//       throw error;
//     }
//   }

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
// }