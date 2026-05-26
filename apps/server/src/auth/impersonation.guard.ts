import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { user, workspace, workspaceMember } from '../database/schema';

@Injectable()
export class ImpersonationGuard implements CanActivate {
  private readonly logger = new Logger(ImpersonationGuard.name);

  constructor(private readonly drizzleService: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requestUser = request.user;

    if (!requestUser?.auth0Id) {
      throw new ForbiddenException('Authentication required');
    }

    if (requestUser.impersonated === true) {
      throw new ForbiddenException('Cannot impersonate while already impersonating');
    }

    const [admin] = await this.drizzleService.db
      .select({
        id: user.id,
        type: user.type,
        primaryWorkspaceUid: user.primaryWorkspaceUid,
      })
      .from(user)
      .where(eq(user.auth0Id, requestUser.auth0Id))
      .limit(1);

    if (!admin) {
      throw new ForbiddenException('Authenticated user not found');
    }

    if (admin.type === 'superadmin') {
      return true;
    }

    const targetUid = request.params?.person;
    if (!targetUid) {
      return true;
    }

    if (!admin.primaryWorkspaceUid) {
      throw new ForbiddenException('No workspace context for impersonation');
    }

    const [ws] = await this.drizzleService.db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.uid, admin.primaryWorkspaceUid))
      .limit(1);

    if (!ws) {
      throw new ForbiddenException('Workspace not found');
    }

    const [adminMembership] = await this.drizzleService.db
      .select({ role: workspaceMember.role })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, ws.id),
          eq(workspaceMember.userId, admin.id),
          eq(workspaceMember.status, 'active'),
        ),
      )
      .limit(1);

    if (!adminMembership || !['owner', 'admin'].includes(adminMembership.role)) {
      throw new ForbiddenException('Workspace owner or admin role required to impersonate');
    }

    const [target] = await this.drizzleService.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.uid, targetUid))
      .limit(1);

    if (!target) {
      throw new BadRequestException('Target user not found');
    }

    const [targetMembership] = await this.drizzleService.db
      .select({ id: workspaceMember.id })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, ws.id),
          eq(workspaceMember.userId, target.id),
          eq(workspaceMember.status, 'active'),
        ),
      )
      .limit(1);

    if (!targetMembership) {
      throw new ForbiddenException('Target user is not a member of your workspace');
    }

    return true;
  }
}
