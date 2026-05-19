import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { user } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  private readonly logger = new Logger(SuperAdminGuard.name);

  constructor(private drizzleService: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requestUser = request.user;
    if (!requestUser?.auth0Id) {
      throw new ForbiddenException('Authentication required');
    }

    // auth0Id always reflects the JWT token holder (the actual admin),
    // even during impersonation where request.user.id is the impersonated user.
    const [userData] = await this.drizzleService.db
      .select({ type: user.type })
      .from(user)
      .where(eq(user.auth0Id, requestUser.auth0Id))
      .limit(1);

    this.logger.debug(`SuperAdminGuard: auth0Id=${requestUser.auth0Id} resolved type=${userData?.type}`);

    if (!userData || userData.type !== 'superadmin') {
      throw new ForbiddenException('Super admin access required');
    }
    return true;
  }
}
