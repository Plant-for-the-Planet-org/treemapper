import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { users } from '../database/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAuth0UserDto } from './dto/create-auth0-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { User, PublicUser } from './entities/user.entity';
import { eq, and, or, like, desc, asc, count, isNull } from 'drizzle-orm';
import { generateUid } from 'src/util/uidGenerator';

import { CacheService } from '../cache/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '../cache/cache-keys';
import { R2Service } from 'src/common/services/r2.service';
import { CreatePresignedUrlDto } from './dto/signed-url.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private drizzleService: DrizzleService,
    private cacheService: CacheService,
    private readonly r2Service: R2Service
  ) { }

  // Consistent user selection for full user data
  private readonly FULL_USER_SELECT = {
    id: users.id,
    uid: users.uid,
    auth0Id: users.auth0Id,
    email: users.email,
    firstname: users.firstname,
    lastname: users.lastname,
    displayName: users.displayName,
    image: users.image,
    slug: users.slug,
    type: users.type,
    country: users.country,
    url: users.url,
    isPrivate: users.isPrivate,
    bio: users.bio,
    locale: users.locale,
    isActive: users.isActive,
    lastLoginAt: users.lastLoginAt,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    deletedAt: users.deletedAt,
    migratedAt: users.migratedAt,
    existingPlanetUser: users.existingPlanetUser,
    flag: users.flag,
    flagReason: users.flagReason
  } as const;

  // Public user selection (excludes sensitive fields)
  private readonly PUBLIC_USER_SELECT = {
    uid: users.uid,
    email: users.email,
    firstname: users.firstname,
    lastname: users.lastname,
    displayName: users.displayName,
    image: users.image,
    slug: users.slug,
    type: users.type,
    country: users.country,
    url: users.url,
    isPrivate: users.isPrivate,
    bio: users.bio,
    locale: users.locale,
    isActive: users.isActive,
    migratedAt: users.migratedAt,
  } as const;


  async createFromAuth0(auth0Id: string, email: string, name: string): Promise<User> {
    try {
      const existingUser = await this.drizzleService.db
        .select(this.FULL_USER_SELECT)
        .from(users)
        .where(and(eq(users.auth0Id, auth0Id), isNull(users.deletedAt)))
        .limit(1);
      if (existingUser.length > 0) {
        this.cacheNewUser(existingUser[0]);
        return existingUser[0];
      }
      const user = await this.drizzleService.db.transaction(async (tx) => {
        const result = await tx
          .insert(users)
          .values({
            uid: generateUid('usr'),
            auth0Id: auth0Id,
            email: email,
            displayName: name || email.split('@')[0],
            isActive: true,
            lastLoginAt: new Date(),
          })
          .returning(this.FULL_USER_SELECT);
        return result[0];
      });
      if (!user) {
        throw new ConflictException(`User not created`);
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = CACHE_KEYS.USER.BY_EMAIL(email);
    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const result = await this.drizzleService.db
          .select(this.FULL_USER_SELECT)
          .from(users)
          .where(and(eq(users.email, email), isNull(users.deletedAt)))
          .limit(1);

        return result[0] || null;
      },
      CACHE_TTL.MEDIUM
    );
  }

  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    try {
      return await this.cacheService.get(CACHE_KEYS.USER.BY_AUTH0_ID(auth0Id));
    } catch (error) {
      return null
    }
  }

  async findById(id: number): Promise<User | null> {
    const cacheKey = CACHE_KEYS.USER.BY_ID(id);

    return await this.cacheService.get(
      cacheKey
    );
  }



  // Private helper methods
  private async cacheNewUser(user: User): Promise<void> {
    try {
      await Promise.all([
        this.cacheService.set(CACHE_KEYS.USER.BY_AUTH0_ID(user.auth0Id), user, CACHE_TTL.MEDIUM),
        this.cacheService.set(CACHE_KEYS.USER.BY_EMAIL(user.email), user, CACHE_TTL.MEDIUM),
        this.cacheService.set(CACHE_KEYS.USER.BY_ID(user.id), user, CACHE_TTL.MEDIUM),
      ]);
      this.logger.debug(`Cached user: ${user.auth0Id}`);
    } catch (error) {
      this.logger.error(`Failed to cache user: ${user.auth0Id}`, error);
      // Don't throw - cache failure shouldn't break user operations
    }
  }


  public async resetUserCache(user: number): Promise<void> {
    try {
      await this.cacheService.reset()
    } catch (error) {
      // Don't throw - cache failure shouldn't break user operations
    }
  }


  async migrateSuccess(id: number): Promise<Boolean> {
    return await this.updateUseMigration(id);
  }

  async generateR2Url(udi: number, dto: CreatePresignedUrlDto): Promise<any> {
    try {
      if (!dto.fileName || !dto.fileType) {
        throw new BadRequestException('fileName and fileType are required');
      }

      // Validate file type (optional)
      const allowedTypes = ['image/'];
      if (!allowedTypes.some(type => dto.fileType.startsWith(type))) {
        throw new BadRequestException('File type not allowed');
      }

      // Validate file size through filename or add size parameter
      // This is a simple check - you might want more sophisticated validation

      const result = await this.r2Service.generatePresignedUrl({
        fileName: dto.fileName,
        fileType: dto.fileType,
        folder: dto.folder || 'uploads', // default folder
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

  async updateUseMigration(id: number): Promise<Boolean> {
    const result = await this.drizzleService.db
      .update(users)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
    this.cacheService.delete(CACHE_KEYS.USER.BY_ID(id));
    this.cacheService.delete(CACHE_KEYS.USER.BY_AUTH0_ID(result[0].authID));
    this.cacheService.delete(CACHE_KEYS.USER.BY_EMAIL(result[0].email));
    return true;
  }


  async update(id: number, updateUserDto: UpdateUserDto): Promise<PublicUser> {
    const result = await this.drizzleService.db
      .update(users)
      .set({
        ...updateUserDto,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        uid: users.uid,
        email: users.email,
        firstname: users.firstname,
        lastname: users.lastname,
        displayName: users.displayName,
        image: users.image,
        slug: users.slug,
        type: users.type,
        country: users.country,
        url: users.url,
        isPrivate: users.isPrivate,
        bio: users.bio,
        locale: users.locale,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        migratedAt: users.migratedAt,
        existingPlanetUser: users.existingPlanetUser, flag: users.flag,
        flagReason: users.flagReason
      });

    return result[0];
  }


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