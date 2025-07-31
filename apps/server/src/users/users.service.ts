import { Injectable, ConflictException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { project, projectMember, survey, user, workspace, workspaceMember } from '../database/schema';
import { CreateSurvey } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUser, User } from './entities/user.entity';
import { eq, and, isNull } from 'drizzle-orm';
import { generateUid } from 'src/util/uidGenerator';
import { UserCacheService } from '../cache/user-cache.service';
import { CACHE_KEYS, CACHE_TTL } from '../cache/cache-keys';
import { R2Service } from 'src/common/services/r2.service';
import { CreatePresignedUrlDto } from './dto/signed-url.dto';
import { randomPastTimestamp } from 'src/util/randomTimeStamp';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        private drizzleService: DrizzleService,
        private userCacheService: UserCacheService,
        private readonly r2Service: R2Service
    ) { }

    private readonly FULL_USER_SELECT = {
        id: user.id,
        uid: user.uid,
        auth0Id: user.auth0Id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        displayName: user.displayName,
        image: user.image,
        slug: user.slug,
        type: user.type,
        country: user.country,
        website: user.website,
        isPrivate: user.isPrivate,
        bio: user.bio,
        locale: user.locale,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
        migratedAt: user.migratedAt,
        existingPlanetUser: user.existingPlanetUser,
        flag: user.flag,
        flagReason: user.flagReason,
        primaryWorkspace: user.primaryWorkspace,
        primaryProject: user.primaryProject
    } as const;

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .substring(0, 255);
    }


    async createFromAuth0(auth0Id: string, email: string, name: string): Promise<User> {
        try {
            const existingUser = await this.drizzleService.db
                .select(this.FULL_USER_SELECT)
                .from(user)
                .where(and(eq(user.auth0Id, auth0Id), isNull(user.deletedAt)))
                .limit(1);
            if (existingUser.length > 0) {
                await this.userCacheService.setUserByAuth({ ...existingUser[0] }, auth0Id);
                return existingUser[0];
            }
            const userData = await this.drizzleService.db
                .insert(user)
                .values({
                    uid: generateUid('usr'),
                    auth0Id: auth0Id,
                    email: email,
                    displayName: name || email.split('@')[0],
                    slug: this.generateSlug(email.split('@')[0] || name) + '-' + randomPastTimestamp(),
                })
                .returning(this.FULL_USER_SELECT);
            if (!userData[0]) {
                throw new ConflictException(`User not created`);
            }
            await this.userCacheService.setUserByAuth({ ...userData[0] }, auth0Id);
            return userData[0]
        } catch (error) {
            throw error;
        }
    }

    async findByAuth0Id(auth0Id: string): Promise<User | null> {
        try {
            return await this.userCacheService.getUserByAuth(auth0Id);
        } catch (error) {
            return null
        }
    }



    async onBoardUser(surveyDetails: CreateSurvey, userData: User): Promise<boolean> {
        try {
            this.validateOnboardingData(surveyDetails, userData);
            const workspaceId = this.determineWorkspaceId(surveyDetails);
            const projectSlug = this.generateUniqueProjectSlug(surveyDetails.projectName);
            const now = new Date();
            const uids = {
                survey: generateUid('srv'),
                workspaceMember: generateUid('workmem'),
                project: generateUid('proj'),
                projectMember: generateUid('projmem'),
            };

            const result = await this.drizzleService.db.transaction(async (tx) => {
                const workspaceExists = await tx
                    .select({ uid: workspace.uid })
                    .from(workspace)
                    .where(and(
                        eq(workspace.id, workspaceId)
                    ))
                    .limit(1);

                if (workspaceExists.length === 0) {
                    throw new BadRequestException(`Active workspace with ID ${workspaceId} does not exist`);
                }

                if (!surveyDetails.skip) {
                    await tx.insert(survey).values({
                        uid: uids.survey,
                        userId: userData.id,
                        organizationName: surveyDetails.organizationName,
                        primaryGoal: surveyDetails.primaryGoal,
                        role: surveyDetails.role,
                        requestedDemo: Boolean(surveyDetails.requestedDemo),
                        isCompleted: this.isSurveyComplete(surveyDetails),
                        createdAt: now,
                        updatedAt: now,
                    });
                }
                const workspaceMemberExists = await tx
                    .select({ user: workspaceMember.userId })
                    .from(workspaceMember)
                    .where(eq(workspaceMember.userId, userData.id)).limit(1);
                if (workspaceMemberExists.length === 0) {
                    await tx.insert(workspaceMember)
                        .values({
                            uid: uids.workspaceMember,
                            workspaceId,
                            userId: userData.id,
                            role: 'member',
                            status: 'active',
                            joinedAt: now,
                            createdAt: now,
                            updatedAt: now,
                        })

                }


                const [newProject] = await tx.insert(project)
                    .values({
                        uid: uids.project,
                        workspaceId,
                        createdById: userData.id,
                        slug: projectSlug,
                        projectName: surveyDetails.projectName,
                        isPrimary: true,
                        isPersonal: true,
                        isActive: true,
                        isPublic: false,
                        createdAt: now,
                        updatedAt: now,
                    })
                    .returning({
                        id: project.id,
                        uid: project.uid,
                    });

                if (!newProject) {
                    throw new InternalServerErrorException('Failed to create project');
                }

                await tx.insert(projectMember)
                    .values({
                        uid: uids.projectMember,
                        projectId: newProject.id,
                        userId: userData.id,
                        projectRole: 'owner',
                        joinedAt: now,
                        siteAccess: 'all_sites',
                        createdAt: now,
                        updatedAt: now,
                    });

                await tx.update(user)
                    .set({
                        primaryWorkspace: workspaceExists[0].uid,
                        primaryProject: newProject.uid,
                        updatedAt: now,
                    })
                    .where(eq(user.id, userData.id));

                return {
                    workspaceUid: workspaceExists[0].uid,
                    projectUid: newProject.uid,
                };
            });

            await this.userCacheService.refreshAuthUser({
                ...userData,
                primaryWorkspace: result.workspaceUid,
                primaryProject: result.projectUid,
            });
            return true;
        } catch (error) {
            console.log('Error during onboarding:', error);
            await this.userCacheService.invalidateUser(userData);
            // Re-throw known exceptions
            if (error instanceof BadRequestException ||
                error instanceof InternalServerErrorException) {
                throw error;
            }

            // Handle database constraint violations
            if (error.code === '23505') { // Unique constraint violation
                throw new ConflictException('User is already onboarded or data conflicts exist');
            }

            if (error.code === '23503') { // Foreign key constraint violation
                throw new BadRequestException('Referenced data does not exist');
            }

            // Generic error for unexpected cases
            throw new InternalServerErrorException('Failed to onboard user');
        }
    }

    private validateOnboardingData(surveyDetails: CreateSurvey, userData: User): void {
        if (!userData?.id) {
            throw new BadRequestException('Invalid user data');
        }

        if (!surveyDetails?.projectName?.trim()) {
            throw new BadRequestException('Project name is required');
        }

        if (surveyDetails.projectName.length > 100) {
            throw new BadRequestException('Project name is too long');
        }
    }

    private determineWorkspaceId(surveyDetails: CreateSurvey): number {
        if (surveyDetails.devMode) return 3;
        if (surveyDetails.forestCloud) return 1;
        return 2;
    }

    private generateUniqueProjectSlug(projectName: string): string {
        const baseSlug = this.generateSlug(projectName);
        return `${baseSlug}-${randomPastTimestamp()}`;
    }

    private isSurveyComplete(surveyDetails: CreateSurvey): boolean {
        return Boolean(
            surveyDetails.organizationName?.trim() &&
            surveyDetails.primaryGoal?.trim() &&
            surveyDetails.role?.trim()
        );
    }

    async generateR2Url(dto: CreatePresignedUrlDto): Promise<any> {
        try {
            console.log("SC", process.env.IS_PRODUCTION)
            if (!dto.fileName || !dto.fileType) {
                throw new BadRequestException('fileName and fileType are required');
            }
            const allowedTypes = ['image/'];
            if (!allowedTypes.some(type => dto.fileType.startsWith(type))) {
                throw new BadRequestException('File type not allowed');
            }
            const result = await this.r2Service.generatePresignedUrl({
                fileName: dto.fileName,
                fileType: dto.fileType,
                folder: `${process.env.IS_PRODUCTION ? "production" : "development"}/${dto.folder}`,
            });
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            return {
                success: false,
                data: null,
            }
        }
    }

    async updateUserAvatar(avatar: string, userData: User): Promise<Boolean> {
        const result = await this.drizzleService.db
            .update(user)
            .set({
                image: avatar,
                updatedAt: new Date(),
            })
            .where(eq(user.id, userData.id))
            .returning({
                id: user.id,
            })

        if (result.length === 0) {
            throw new BadRequestException(`User with ID ${userData.id} not found`);
        }
        await this.userCacheService.refreshAuthUser({ ...userData, image: avatar });
        return true;
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<any> {
        const payload = this.prepareUpdateData(updateUserDto);

        const result = await this.drizzleService.db
            .update(user)
            .set(payload) // payload already includes updatedAt
            .where(eq(user.id, id))
            .returning();

        if (result.length === 0) {
            throw new Error(`User with id ${id} not found`);
        }

        // Refresh cache with the updated user data
        await this.userCacheService.refreshAuthUser(result[0]);

        return result[0];
    }

    private prepareUpdateData(updateUserDto: UpdateUserDto): Partial<typeof user.$inferInsert> {
        // Create a clean copy of the DTO
        const updateData: any = {
            ...updateUserDto,
        };

        // Remove undefined and null values (optional - depends on your requirements)
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || updateData[key] === null) {
                delete updateData[key];
            }
        });

        // Additional validation/transformation can go here
        // For example, ensure email is lowercase
        if (updateData.email) {
            updateData.email = updateData.email.toLowerCase();
        }
        Object.keys(updateData).forEach(key => {
            const value = updateData[key];

            if (
                value === undefined ||
                value === null ||
                (typeof value === 'object' &&
                    value !== null &&
                    !Array.isArray(value) &&
                    Object.keys(value).length === 0)
            ) {
                delete updateData[key];
            }
        });

        console.log("Prepared update data:", updateData);
        return updateData;
    }


    //   async findByEmail(email: string): Promise<User | null> {
    //     const cacheKey = CACHE_KEYS.USER.BY_EMAIL(email);
    //     return await this.cacheService.getOrSet(
    //       cacheKey,
    //       async () => {
    //         const result = await this.drizzleService.db
    //           .select(this.FULL_USER_SELECT)
    //           .from(users)
    //           .where(and(eq(users.email, email), isNull(users.deletedAt)))
    //           .limit(1);

    //         return result[0] || null;
    //       },
    //       CACHE_TTL.MEDIUM
    //     );
    //   }



    //   async findById(id: number): Promise<User | null> {
    //     const cacheKey = CACHE_KEYS.USER.BY_ID(id);

    //     return await this.cacheService.get(
    //       cacheKey
    //     );
    //   }



    //   // Private helper methods
    //   private async cacheNewUser(user: User): Promise<void> {
    //     try {
    //       await this.cacheService.set(CACHE_KEYS.USER.BY_AUTH0_ID(user.auth0Id), user, CACHE_TTL.MEDIUM)
    //       this.logger.debug(`Cached user: ${user.auth0Id}`);
    //     } catch (error) {
    //       this.logger.error(`Failed to cache user: ${user.auth0Id}`, error);
    //       // Don't throw - cache failure shouldn't break user operations
    //     }
    //   }


    //   public async resetUserCache(): Promise<void> {
    //     try {
    //       await this.cacheService.reset()
    //     } catch (error) {
    //       // Don't throw - cache failure shouldn't break user operations
    //     }
    //   }


    //   async migrateSuccess(id: number): Promise<Boolean> {
    //     return await this.updateUseMigration(id);
    //   }



    //   async updateUseMigration(id: number): Promise<Boolean> {
    //     this.resetUserCache()
    //     return true;
    //   }











    // private async updateLastLoginInCache(userId: number): Promise<void> {
    //   try {
    //     // Get user from cache and update lastLoginAt
    //     const cachedUser = await this.cacheService.get<User>(CACHE_KEYS.USER.BY_ID(userId));

    //     if (cachedUser) {
    //       const updatedUser = {
    //         ...cachedUser,
    //         lastLoginAt: new Date(),
    //         updatedAt: new Date(),
    //       };

    //       // Update all cache entries with new lastLoginAt
    //       await Promise.all([
    //         this.cacheService.set(CACHE_KEYS.USER.BY_ID(userId), updatedUser, CACHE_TTL.MEDIUM),
    //         this.cacheService.set(CACHE_KEYS.USER.BY_AUTH0_ID(updatedUser.auth0Id), updatedUser, CACHE_TTL.MEDIUM),
    //         this.cacheService.set(CACHE_KEYS.USER.BY_EMAIL(updatedUser.email), updatedUser, CACHE_TTL.MEDIUM),
    //       ]);
    //     }
    //   } catch (error) {
    //     this.logger.error(`Failed to update lastLogin in cache for user ${userId}`, error);
    //     // Silently fail - cache update failure is not critical
    //   }
    // }

    // private async invalidateUserCache(user: User): Promise<void> {
    //   try {
    //     await Promise.all([
    //       this.cacheService.delete(CACHE_KEYS.USER.BY_ID(user.id)),
    //       this.cacheService.delete(CACHE_KEYS.USER.BY_AUTH0_ID(user.auth0Id)),
    //       this.cacheService.delete(CACHE_KEYS.USER.BY_EMAIL(user.email)),
    //       this.cacheService.delete(CACHE_KEYS.USER.PROFILE(user.id)),
    //     ]);

    //     this.logger.debug(`Invalidated cache for user: ${user.id}`);
    //   } catch (error) {
    //     this.logger.error(`Failed to invalidate cache for user: ${user.id}`, error);
    //   }
    // }




    //  async updateLastLogin(userId: number): Promise<void> {
    //   try {
    //     await this.drizzleService.db
    //       .update(users)
    //       .set({ 
    //         lastLoginAt: new Date(), 
    //         updatedAt: new Date() 
    //       })
    //       .where(eq(users.id, userId));

    //     // Update lastLoginAt in cache without full invalidation
    //     await this.updateLastLoginInCache(userId);

    //     this.logger.debug(`Updated last login for user ${userId}`);
    //   } catch (error) {
    //     this.logger.error(`Failed to update last login for user ${userId}`, error);
    //     // Don't throw - login tracking failure shouldn't break authentication
    //   }
    // }

    // async updateUser(id: number, updateData: Partial<User>): Promise<User> {
    //   try {
    //     const updatedUser = await this.drizzleService.db.transaction(async (tx) => {
    //       const result = await tx
    //         .update(users)
    //         .set({ 
    //           ...updateData, 
    //           updatedAt: new Date() 
    //         })
    //         .where(and(eq(users.id, id), isNull(users.deletedAt)))
    //         .returning(this.FULL_USER_SELECT);

    //       if (result.length === 0) {
    //         throw new NotFoundException(`User with ID ${id} not found`);
    //       }

    //       return result[0];
    //     });

    //     // Invalidate and refresh cache
    //     await this.invalidateUserCache(updatedUser);
    //     await this.cacheNewUser(updatedUser);

    //     this.logger.log(`Successfully updated user: ${id}`);
    //     return updatedUser;

    //   } catch (error) {
    //     this.logger.error(`Failed to update user ${id}`, error);
    //     throw error;
    //   }
    // }



    // ============================================================================
    // READ OPERATIONS
    // ============================================================================

    // async findAll(query: UserQueryDto): Promise<{ users: PublicUser[]; total: number; page: number; limit: number }> {
    //   const {
    //     page = 1,
    //     limit = 10,
    //     search,
    //     type,
    //     country,
    //     isActive,
    //     isPrivate,
    //     sortBy,
    //     sortOrder,
    //   } = query;
    //   const offset = (page - 1) * limit;

    //   // Build WHERE conditions
    //   const conditions: any[] = [];

    //   conditions.push(isNull(users.deletedAt)); // Only active users

    //   if (search) {
    //     conditions.push(
    //       or(
    //         like(users.name, `%${search}%`),
    //         like(users.email, `%${search}%`),
    //         like(users.displayName, `%${search}%`)
    //       )
    //     );
    //   }

    //   if (type) conditions.push(eq(users.type, type));
    //   if (country) conditions.push(eq(users.country, country));
    //   if (isActive !== undefined) conditions.push(eq(users.isActive, isActive));
    //   if (isPrivate !== undefined) conditions.push(eq(users.isPrivate, isPrivate));

    //   const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    //   // Get total count
    //   const totalResult = await this.drizzleService.db
    //     .select({ count: count() })
    //     .from(users)
    //     .where(whereClause);

    //   const total = totalResult[0].count;

    //   // Get users with pagination
    //   const sortField = sortBy && users.hasOwnProperty(sortBy) ? users[sortBy] : users.createdAt;
    //   const orderBy = sortOrder === 'asc' ? asc(sortField) : desc(sortField);

    //   const result = await this.drizzleService.db
    //     .select({
    //       id: users.id,
    //       uid: users.uid,
    //       email: users.email,
    //       name: users.name,
    //       firstname: users.firstname,
    //       lastname: users.lastname,
    //       displayName: users.displayName,
    //       avatar: users.avatar,
    //       avatarCdn: users.avatarCdn,
    //       slug: users.slug,
    //       authName: users.authName,
    //       type: users.type,
    //       country: users.country,
    //       url: users.url,
    //       isPrivate: users.isPrivate,
    //       bio: users.bio,
    //       locale: users.locale,
    //       isActive: users.isActive,
    //       lastLoginAt: users.lastLoginAt,
    //       createdAt: users.createdAt,
    //       updatedAt: users.updatedAt,
    //       migratedAt: users.migratedAt,
    //     })
    //     .from(users)
    //     .where(whereClause)
    //     .orderBy(orderBy)
    //     .limit(limit)
    //     .offset(offset);

    //   return {
    //     users: result,
    //     total,
    //     page,
    //     limit,
    //   };
    // }



    // async findByuid(uid: string): Promise<PublicUser> {
    //   const result = await this.drizzleService.db
    //     .select({
    //       id: users.id,
    //       uid: users.uid,
    //       email: users.email,
    //       name: users.name,
    //       firstname: users.firstname,
    //       lastname: users.lastname,
    //       displayName: users.displayName,
    //       avatar: users.avatar,
    //       avatarCdn: users.avatarCdn,
    //       slug: users.slug,
    //       type: users.type,
    //       country: users.country,
    //       url: users.url,
    //       isPrivate: users.isPrivate,
    //       bio: users.bio,
    //       locale: users.locale,
    //       isActive: users.isActive,
    //       lastLoginAt: users.lastLoginAt,
    //       createdAt: users.createdAt,
    //       updatedAt: users.updatedAt,
    //       authName: users.authName,
    //       migratedAt: users.migratedAt,
    //     })
    //     .from(users)
    //     .where(and(eq(users.uid, uid), isNull(users.deletedAt)));

    //   if (result.length === 0) {
    //     throw new NotFoundException(`User with uid ${uid} not found`);
    //   }

    //   return result[0];
    // }





    // // ============================================================================
    // // UPDATE OPERATIONS
    // // ============================================================================

    // async updateByAuth0Id(auth0Id: string, updateData: Partial<UpdateUserDto>): Promise<User> {
    //   const result = await this.drizzleService.db
    //     .update(users)
    //     .set({
    //       ...updateData,
    //       updatedAt: new Date(),
    //     })
    //     .where(eq(users.auth0Id, auth0Id))
    //     .returning();

    //   if (result.length === 0) {
    //     throw new NotFoundException(`User with Auth0 ID ${auth0Id} not found`);
    //   }

    //   return result[0];
    // }

    // async updateByEmail(email: string, updateData: Partial<UpdateUserDto & { auth0Id?: string }>): Promise<User> {
    //   const result = await this.drizzleService.db
    //     .update(users)
    //     .set({
    //       ...updateData,
    //       updatedAt: new Date(),
    //     })
    //     .where(eq(users.email, email))
    //     .returning();

    //   if (result.length === 0) {
    //     throw new NotFoundException(`User with email ${email} not found`);
    //   }

    //   return result[0];
    // }

    // async updateLastLogin(id: number): Promise<void> {
    //   await this.drizzleService.db
    //     .update(users)
    //     .set({
    //       lastLoginAt: new Date(),
    //       updatedAt: new Date(),
    //     })
    //     .where(eq(users.id, id));
    // }

    // async deactivate(id: number): Promise<PublicUser> {
    //   return await this.update(id, { isActive: false });
    // }



    // async activate(id: number): Promise<PublicUser> {
    //   return await this.update(id, { isActive: true });
    // }

    // // ============================================================================
    // // DELETE OPERATIONS
    // // ============================================================================

    // async remove(id: number): Promise<{ success: boolean; id: number }> {
    //   // Check if user exists
    //   await this.findOne(id);

    //   // Soft delete
    //   const result = await this.drizzleService.db
    //     .update(users)
    //     .set({
    //       deletedAt: new Date(),
    //       updatedAt: new Date(),
    //     })
    //     .where(eq(users.id, id))
    //     .returning({ id: users.id });

    //   return { success: true, id: result[0].id };
    // }

    // async hardDelete(id: number): Promise<{ success: boolean; id: number }> {
    //   const result = await this.drizzleService.db
    //     .delete(users)
    //     .where(eq(users.id, id))
    //     .returning({ id: users.id });

    //   if (result.length === 0) {
    //     throw new NotFoundException(`User with ID ${id} not found`);
    //   }

    //   return { success: true, id: result[0].id };
    // }

    // // ============================================================================
    // // UTILITY METHODS
    // // ============================================================================

    // // async generateUniqueSlug(baseName: string): Promise<string> {
    // //   const baseSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    // //   let slug = baseSlug;
    // //   let counter = 1;

    // //   while (await this.findBySlug(slug)) {
    // //     slug = `${baseSlug}-${counter}`;
    // //     counter++;
    // //   }

    // //   return slug;
    // // }

    // async checkEmailExists(email: string): Promise<boolean> {
    //   const user = await this.findByEmail(email);
    //   return !!user;
    // }

    // async getUserStats(): Promise<{
    //   total: number;
    //   active: number;
    //   inactive: number;
    //   byType: Record<string, number>;
    // }> {
    //   const [totalResult, activeResult, inactiveResult] = await Promise.all([
    //     this.drizzleService.db
    //       .select({ count: count() })
    //       .from(users)
    //       .where(isNull(users.deletedAt)),

    //     this.drizzleService.db
    //       .select({ count: count() })
    //       .from(users)
    //       .where(and(eq(users.isActive, true), isNull(users.deletedAt))),

    //     this.drizzleService.db
    //       .select({ count: count() })
    //       .from(users)
    //       .where(and(eq(users.isActive, false), isNull(users.deletedAt))),
    //   ]);

    //   // Get counts by type
    //   const typeResults = await this.drizzleService.db
    //     .select({
    //       type: users.type,
    //       count: count(),
    //     })
    //     .from(users)
    //     .where(isNull(users.deletedAt))
    //     .groupBy(users.type);

    //   const byType = typeResults.reduce((acc, curr) => {
    //     acc[curr.type || 'unknown'] = curr.count;
    //     return acc;
    //   }, {} as Record<string, number>);

    //   return {
    //     total: totalResult[0].count,
    //     active: activeResult[0].count,
    //     inactive: inactiveResult[0].count,
    //     byType,
    //   };
    // }
}