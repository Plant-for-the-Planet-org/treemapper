import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { and, eq, gte } from "drizzle-orm";
import { user as users } from "src/database/schema";
// import { UsersService } from "src/users/users.service";
import { CACHE_KEYS, CACHE_TTL } from "./cache-keys";
import { CacheService } from "./cache.service";

@Injectable()
export class CacheWarmerService {
    drizzleService: any;
    constructor(
        // private usersService: UsersService,
        private cacheService: CacheService,
    ) { }

    @Cron('0 */6 * * *') // Every 6 hours
    async warmUserCache() {
        // Warm cache for active users who logged in recently
        const recentUsers = await this.drizzleService.db
            .select({
                uid: users.uid,
                email: users.email,
                firstname: users.firstName,
                lastname: users.lastName,
                displayName: users.displayName,
                image: users.image,
                slug: users.slug,
                type: users.type,
                country: users.country,
                url: users.website,
                isPrivate: users.isPrivate,
                bio: users.bio,
                locale: users.locale,
                isActive: users.isActive,
                migratedAt: users.migratedAt,
            })
            .from(users)
            .where(
                and(
                    eq(users.isActive, true),
                )
            );

        for (const user of recentUsers) {
            await Promise.all([
                this.cacheService.set(CACHE_KEYS.USER.BY_ID(user.id), user, CACHE_TTL.LONG),
                this.cacheService.set(CACHE_KEYS.USER.BY_AUTH0_ID(user.auth0Id), user, CACHE_TTL.LONG),
            ]);
        }
    }
}