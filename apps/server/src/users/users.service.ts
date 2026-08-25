import { Injectable, ConflictException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { image, intervention, project, projectMember, survey, user, userDevice, workspace, workspaceMember } from '../database/schema';
import { AvatarDTO, CreateSurvey } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { isMigrationPlaceholderAuth0Id, LinkAuth0Result, User } from './entities/user.entity';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { generateUid } from 'src/util/uidGenerator';
import { UserCacheService } from '../cache/user-cache.service';
import { R2Service, ALLOWED_IMAGE_MIME_TYPES } from 'src/common/services/r2.service';
import { CreatePresignedUrlDto } from './dto/signed-url.dto';
import { randomPastTimestamp } from 'src/util/randomTimeStamp';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        private drizzleService: DrizzleService,
        private userCacheService: UserCacheService,
        private readonly r2Service: R2Service,
        private readonly auditService: AuditService
    ) { }

    private readonly FULL_USER_SELECT = {
        id: user.id,
        uid: user.uid,
        auth0Id: user.auth0Id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
        migratedAt: user.migratedAt,
        existingPlanetUser: user.existingPlanetUser,
        flag: user.flag,
        flagReason: user.flagReason,
        primaryWorkspaceUid: user.primaryWorkspaceUid,
        primaryProjectUid: user.primaryProjectUid,
        workspaceRole: user.workspaceRole,
        v3ApprovedAt: user.v3ApprovedAt,
        lastActiveAt: user.lastActiveAt
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
        const existingUser = await this.findInDbByAuth0Id(auth0Id);
        if (existingUser) {
            await this.cacheUserByAuth(existingUser, auth0Id);
            return existingUser;
        }
        try {
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
            await this.cacheUserByAuth(userData[0], auth0Id);
            return userData[0]
        } catch (error) {
            // Two concurrent first-time requests race here: the dashboard fires
            // /users/me repeatedly, so both can miss the lookup above and both
            // insert. Whoever loses gets 23505 -- re-read instead of failing the
            // login, since the row the winner wrote is the one we wanted.
            // drizzle-orm >=0.44 wraps driver errors in DrizzleQueryError, so the
            // original pg error (with .code) may be under .cause instead of on
            // the error itself -- check both.
            if ((error?.cause?.code ?? error?.code) === '23505') {
                const raced = await this.findInDbByAuth0Id(auth0Id);
                if (raced) {
                    await this.cacheUserByAuth(raced, auth0Id);
                    return raced;
                }
                // The winner may have inserted under a different sub: the same
                // person racing their own first login across two connections.
                // The unique index that rejected us was on email, so claim that
                // row by email rather than failing the login.
                const linked = await this.linkAuth0IdByEmail(email, auth0Id);
                if (linked.status === 'linked') {
                    return linked.user;
                }
            }
            throw error;
        }
    }

    async findByAuth0Id(auth0Id: string): Promise<User | null> {
        try {
            const cached = await this.userCacheService.getUserByAuth(auth0Id);
            if (cached) {
                return cached;
            }
        } catch (error) {
            // A failing cache must not lock everyone out -- fall through
            // to the database and serve the request uncached.
            this.logger.warn(`User cache read failed for ${auth0Id}: ${error?.message ?? error}`);
        }
        const userData = await this.findInDbByAuth0Id(auth0Id);
        if (!userData) {
            return null;
        }
        await this.cacheUserByAuth(userData, auth0Id);
        return userData;
    }

    /**
     * Points the row that owns `email` at the Auth0 sub of the current login.
     *
     * Two kinds of caller land here. A migrated user whose row still holds the
     * `email:<email>` placeholder the migration wrote, and an existing user
     * signing in through a different Auth0 connection than last time: email and
     * password one day, Google, Facebook or Apple the next. Auth0 mints a
     * separate sub per connection, so the sub alone cannot recognise them. The
     * verified email can, and it is the only thing tying the two logins to one
     * person.
     *
     * The caller must have checked `email_verified` on the incoming token first.
     * That check is what makes the claim safe: whoever proves control of the
     * address owns the account. Never call this on an unverified email.
     */
    async linkAuth0IdByEmail(email: string, newAuth0Id: string): Promise<LinkAuth0Result> {
        const existing = await this.findInDbByEmail(email);
        if (!existing) {
            return { status: 'not_found' };
        }
        if (existing.auth0Id === newAuth0Id) {
            // Already linked (concurrent request won the race, or the cache was
            // simply cold). Nothing to write.
            await this.cacheUserByAuth(existing, newAuth0Id);
            return { status: 'linked', user: existing, previousAuth0Id: null };
        }
        const previousAuth0Id = existing.auth0Id;
        const [updated] = await this.drizzleService.db
            .update(user)
            // Only the sub changes. `migratedAt` belongs to the data migration and
            // `existingPlanetUser` still describes where this account came from.
            .set({ auth0Id: newAuth0Id })
            // Re-check the previous sub in the WHERE clause so two concurrent
            // logins cannot both claim the row.
            .where(and(
                eq(user.id, existing.id),
                eq(user.auth0Id, previousAuth0Id),
            ))
            .returning(this.FULL_USER_SELECT);

        if (!updated) {
            // Another login claimed the row between the read and the write. It
            // was the same person either way, so hand back what the row holds
            // now, and only cache it if the key matches the sub stored on it.
            const reread = await this.findInDbByEmail(email);
            if (!reread) {
                return { status: 'not_found' };
            }
            if (reread.auth0Id === newAuth0Id) {
                await this.cacheUserByAuth(reread, newAuth0Id);
            }
            return { status: 'linked', user: reread, previousAuth0Id: null };
        }

        // Drop whatever is cached under the sub we just replaced. Leaving it
        // would serve a record whose auth0Id no longer matches its own key, and
        // every invalidation elsewhere keys off the row's current sub, so that
        // stale copy would survive until its TTL expired.
        await this.userCacheService.invalidateUser({ auth0Id: previousAuth0Id });

        if (isMigrationPlaceholderAuth0Id(previousAuth0Id)) {
            this.logger.log(`Linked migrated user ${updated.uid} to auth0Id ${newAuth0Id}`);
        } else {
            this.logger.log(
                `User ${updated.uid} signed in through a different Auth0 connection: ${previousAuth0Id} -> ${newAuth0Id}`,
            );
        }
        await this.cacheUserByAuth(updated, newAuth0Id);
        return { status: 'linked', user: updated, previousAuth0Id };
    }

    private async findInDbByAuth0Id(auth0Id: string): Promise<User | null> {
        const result = await this.drizzleService.db
            .select(this.FULL_USER_SELECT)
            .from(user)
            .where(and(eq(user.auth0Id, auth0Id), isNull(user.deletedAt)))
            .limit(1);
        return result[0] ?? null;
    }

    private async findInDbByEmail(email: string): Promise<User | null> {
        // Exact match first so the `user_email_unique` index does the work.
        const exact = await this.drizzleService.db
            .select(this.FULL_USER_SELECT)
            .from(user)
            .where(and(eq(user.email, email), isNull(user.deletedAt)))
            .limit(1);
        if (exact[0]) {
            return exact[0];
        }
        // Old-backend emails may differ in case from the Auth0 claim. This branch
        // only runs for genuinely new signups and case mismatches.
        const insensitive = await this.drizzleService.db
            .select(this.FULL_USER_SELECT)
            .from(user)
            .where(and(
                sql`lower(${user.email}) = lower(${email})`,
                isNull(user.deletedAt),
            ))
            .limit(1);
        return insensitive[0] ?? null;
    }

    private async cacheUserByAuth(userData: User, auth0Id: string): Promise<void> {
        try {
            await this.userCacheService.setUserByAuth({ ...userData }, auth0Id);
        } catch (error) {
            // A cache write failure costs a DB read next request, nothing more.
            this.logger.warn(`User cache write failed for ${auth0Id}: ${error?.message ?? error}`);
        }
    }



    async onBoardUser(surveyDetails: CreateSurvey, userData: User): Promise<boolean> {
        try {
            this.validateOnboardingData(surveyDetails, userData);
            const workspaceSlug = this.determineWorkspaceId(surveyDetails);
            const workspaceData = await this.drizzleService.db.select({ id: workspace.id, settings: workspace.settings }).from(workspace).where(eq(workspace.slug, workspaceSlug)).limit(1)
            if (!workspaceData || workspaceData.length === 0) {
                throw 'Server side workspace issue'
            }
            const workspaceId = workspaceData[0].id;
            const workspaceSettings = workspaceData[0].settings;
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
                        name: surveyDetails.projectName,
                        isPrimary: false,
                        isPersonal: false,
                        isPublic: false,
                        status: workspaceSettings?.requireApprovalForNewProjects ? 'in_review' : 'active',
                        approvalBoardEnabled: workspaceSettings?.approvalBoardEnabled ?? false,
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
                        primaryWorkspaceUid: workspaceExists[0].uid,
                        primaryProjectUid: newProject.uid,
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
                primaryWorkspaceUid: result.workspaceUid,
                primaryProjectUid: result.projectUid,
            });
            return true;
        } catch (error) {
            await this.userCacheService.invalidateUser(userData);
            if (error instanceof BadRequestException ||
                error instanceof InternalServerErrorException) {
                throw error;
            }

            // Handle database constraint violations
            // drizzle-orm >=0.44 wraps driver errors in DrizzleQueryError; the
            // original pg error (with .code) may be under .cause -- check both.
            const pgErrorCode = error?.cause?.code ?? error?.code;
            if (pgErrorCode === '23505') { // Unique constraint violation
                throw new ConflictException('User is already onboarded or data conflicts exist');
            }

            if (pgErrorCode === '23503') { // Foreign key constraint violation
                throw new BadRequestException('Referenced data does not exist');
            }

            // Generic error for unexpected cases
            this.logger.error('Onboarding failed with unexpected error:', error);
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

    private determineWorkspaceId(surveyDetails: CreateSurvey): string {
        if (surveyDetails.devMode) return 'development-projects';
        if (surveyDetails.forestCloud) return 'platform-projects';
        return 'private-projects';
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
            if (!dto.fileName || !dto.fileType) {
                throw new BadRequestException('fileName and fileType are required');
            }
            if (!ALLOWED_IMAGE_MIME_TYPES.includes(dto.fileType.toLowerCase())) {
                throw new BadRequestException('File type not allowed');
            }
            const result = await this.r2Service.generatePresignedUrl({
                fileName: dto.fileName,
                fileType: dto.fileType,
                folder: dto.folder,
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

    async updateUserAvatar(userPayload: AvatarDTO, userData: User): Promise<Boolean> {
        // Get current user data for audit log
        const currentUser = await this.drizzleService.db
            .select()
            .from(user)
            .where(eq(user.id, userData.id))
            .limit(1);

        if (currentUser.length === 0) {
            throw new BadRequestException(`User with ID ${userData.id} not found`);
        }

        const oldValues = {
            image: currentUser[0].image,
            firstName: currentUser[0].firstName,
            lastName: currentUser[0].lastName,
        };

        let payload: { firstName?: string, lastName?: string } = {};
        if (userPayload.firstName) payload.firstName = userPayload.firstName;
        if (userPayload.lastName) payload.lastName = userPayload.lastName;
        
        const result = await this.drizzleService.db
            .update(user)
            .set({
                image: userPayload.avatarUrl,
                ...payload,
                updatedAt: new Date(),
            })
            .where(eq(user.id, userData.id))
            .returning({
                id: user.id,
                image: user.image,
                firstName: user.firstName,
                lastName: user.lastName,
                uid: user.uid,
            });

        if (result.length === 0) {
            throw new BadRequestException(`User with ID ${userData.id} not found`);
        }

        const newValues = {
            image: result[0].image,
            firstName: result[0].firstName,
            lastName: result[0].lastName,
        };

        // Create audit log
        await this.auditService.createAuditLog('user', {
            action: 'update',
            entityId: userData.id,
            entityUid: result[0].uid,
            userId: userData.id,
            oldValues: oldValues,
            newValues: newValues,
            source: 'web',
        });

        await this.userCacheService.refreshAuthUser({ ...userData, image: userPayload.avatarUrl });
        return true;
    }



    async update(id: number, updateUserDto: UpdateProfileDto): Promise<any> {
        // Get current user data for audit log
        const currentUser = await this.drizzleService.db
            .select()
            .from(user)
            .where(eq(user.id, id))
            .limit(1);

        if (currentUser.length === 0) {
            throw new Error(`User with id ${id} not found`);
        }

        const oldValues: any = { ...currentUser[0] };
        // Remove fields that shouldn't be in audit log
        delete oldValues.id;
        delete oldValues.createdAt;
        delete oldValues.updatedAt;

        const payload = this.prepareUpdateData(updateUserDto);

        const result = await this.drizzleService.db
            .update(user)
            .set(payload) // payload already includes updatedAt
            .where(eq(user.id, id))
            .returning();

        if (result.length === 0) {
            throw new Error(`User with id ${id} not found`);
        }

        const newValues: any = { ...result[0] };
        // Remove fields that shouldn't be in audit log
        delete newValues.id;
        delete newValues.createdAt;
        delete newValues.updatedAt;

        // Create audit log
        await this.auditService.createAuditLog('user', {
            action: 'update',
            entityId: id,
            entityUid: result[0].uid,
            userId: id,
            oldValues: oldValues,
            newValues: newValues,
            source: 'web',
        });

        // Refresh cache with the updated user data
        await this.userCacheService.refreshAuthUser(result[0]);

        return result[0];
    }

    private prepareUpdateData(dto: any): Partial<typeof user.$inferInsert> {
        // `type` is deliberately NOT here: it gates SuperAdminGuard, so a user
        // must never be able to change it on their own account. Keep this list
        // limited to non-privileged profile fields.
        const ALLOWED: (keyof typeof user.$inferInsert)[] = [
            'firstName', 'lastName', 'displayName', 'bio', 'isPrivate', 'locale', 'country',
        ];

        const updateData: any = {};

        for (const key of ALLOWED) {
            const value = dto[key];
            if (value !== undefined && value !== null) {
                updateData[key] = value;
            }
        }

        // Frontend sends `url`; DB column is `website`
        if (dto.url !== undefined && dto.url !== null && dto.url !== '') {
            updateData.website = dto.url;
        } else if (dto.url === '') {
            updateData.website = null;
        }

        return updateData;
    }

    async invalidateMyCache(user: User,) {
        return await this.userCacheService.invalidateUser(user);
    }

    // Upsert the device row for this user and stamp last-active on both the
    // device and the user. Called on every app open. deviceId is unique, so a
    // device that logs in as a new user has its ownership (userId) reassigned.
    async registerOrUpdateDevice(userId: number, dto: CreateDeviceDto): Promise<{ uid: string; deviceId: string }> {
        try {
            return await this.drizzleService.db.transaction(async (tx) => {
                const now = new Date();

                const existingDevice = await tx
                    .select({ id: userDevice.id, uid: userDevice.uid })
                    .from(userDevice)
                    .where(eq(userDevice.deviceId, dto.deviceId))
                    .limit(1);

                // Keep the user's last-active in sync with the app-open call.
                await tx
                    .update(user)
                    .set({ lastActiveAt: now })
                    .where(eq(user.id, userId));

                if (existingDevice.length > 0) {
                    const updateData: Partial<typeof userDevice.$inferInsert> = {
                        userId,
                        lastActiveAt: now,
                        updatedAt: now,
                    };

                    if (dto.oneSignalId !== undefined) updateData.oneSignalId = dto.oneSignalId;
                    if (dto.deviceOs !== undefined) updateData.deviceOs = dto.deviceOs;
                    if (dto.deviceName !== undefined) updateData.deviceName = dto.deviceName;
                    if (dto.deviceModel !== undefined) updateData.deviceModel = dto.deviceModel;
                    if (dto.osVersion !== undefined) updateData.osVersion = dto.osVersion;
                    if (dto.appVersion !== undefined) updateData.appVersion = dto.appVersion;
                    if (dto.locale !== undefined) updateData.locale = dto.locale;
                    if (dto.timezone !== undefined) updateData.timezone = dto.timezone;
                    if (dto.notificationPermission !== undefined) updateData.notificationPermission = dto.notificationPermission;
                    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

                    await tx
                        .update(userDevice)
                        .set(updateData)
                        .where(eq(userDevice.deviceId, dto.deviceId));

                    return {
                        uid: existingDevice[0].uid,
                        deviceId: dto.deviceId,
                    };
                }

                const deviceUid = generateUid('dev');
                await tx.insert(userDevice).values({
                    uid: deviceUid,
                    deviceId: dto.deviceId,
                    userId,
                    oneSignalId: dto.oneSignalId || null,
                    deviceOs: dto.deviceOs || null,
                    deviceName: dto.deviceName || null,
                    deviceModel: dto.deviceModel || null,
                    osVersion: dto.osVersion || null,
                    appVersion: dto.appVersion || null,
                    locale: dto.locale || null,
                    timezone: dto.timezone || null,
                    notificationPermission: dto.notificationPermission ?? true,
                    isActive: dto.isActive ?? true,
                    lastActiveAt: now,
                    createdAt: now,
                    updatedAt: now,
                });

                return {
                    uid: deviceUid,
                    deviceId: dto.deviceId,
                };
            });
        } catch (error) {
            this.logger.error(`Failed to register device for user ${userId}`, error);

            // drizzle-orm >=0.44 wraps driver errors in DrizzleQueryError; the
            // original pg error (with .code) may be under .cause -- check both.
            if ((error?.cause?.code ?? error?.code) === '23505') {
                throw new ConflictException('Device already registered');
            }

            throw new InternalServerErrorException('Failed to register device');
        }
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