import { Injectable } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";
import { CacheService } from "./cache.service";
import { CACHE_KEYS, CACHE_TTL } from "./cache-keys";

@Injectable()
export class UserCacheService {
    constructor(private cacheService: CacheService) { }

    private getUseAuthrKey(identifier: string): string {
        return CACHE_KEYS.USER.BY_AUTH0_ID(identifier)
    }

    async getUserByAuth(auth0Id: string): Promise<User | null> {
        return this.cacheService.get(this.getUseAuthrKey(auth0Id));
    }

    async setUserByAuth(user: User, auth0Id: string): Promise<void> {
        await this.cacheService.set(this.getUseAuthrKey(auth0Id), user, CACHE_TTL.MEDIUM);
    }

    async refreshAuthUser(user: User): Promise<void> {
        await this.cacheService.delete(this.getUseAuthrKey(user.auth0Id));
        await this.cacheService.set(this.getUseAuthrKey(user.auth0Id), user, CACHE_TTL.MEDIUM);
    }

    async invalidateUser(user: User): Promise<void> {
        await this.cacheService.delete(this.getUseAuthrKey(user.auth0Id));
    }
}