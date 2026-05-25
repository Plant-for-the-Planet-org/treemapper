import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { user } from '../database/schema';
import { eq } from 'drizzle-orm';
import { CacheService } from 'src/cache/cache.service';

const SUPERADMIN_TYPE_TTL_MS = 60 * 1000;
const cacheKey = (auth0Id: string) => `superadmin:type:${auth0Id}`;

@Injectable()
export class SuperAdminGuard implements CanActivate {
  private readonly logger = new Logger(SuperAdminGuard.name);

  constructor(
    private drizzleService: DrizzleService,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requestUser = request.user;
    if (!requestUser?.auth0Id) {
      throw new ForbiddenException('Authentication required');
    }

    if (requestUser.impersonated === true) {
      throw new ForbiddenException('Super admin actions are not allowed during impersonation');
    }

    const cachedType = await this.cacheService.get<string>(cacheKey(requestUser.auth0Id));
    let type = cachedType;
    if (!type) {
      const [userData] = await this.drizzleService.db
        .select({ type: user.type })
        .from(user)
        .where(eq(user.auth0Id, requestUser.auth0Id))
        .limit(1);
      type = userData?.type ?? null;
      if (type) {
        await this.cacheService.set(cacheKey(requestUser.auth0Id), type, SUPERADMIN_TYPE_TTL_MS);
      }
    }

    this.logger.debug(`SuperAdminGuard: auth0Id=${requestUser.auth0Id} resolved type=${type}`);

    if (type !== 'superadmin') {
      throw new ForbiddenException('Super admin access required');
    }
    return true;
  }
}
