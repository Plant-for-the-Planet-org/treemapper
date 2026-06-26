import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and, or, sql } from 'drizzle-orm';
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
      .where(or(eq(user.uid, targetUid), sql`lower(${user.email}) = lower(${targetUid})`))
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

    // NOTE (workspace-admin impersonation scope):
    // We intentionally allow a workspace owner/admin to impersonate a member of
    // their workspace even when that member also has access in OTHER workspaces.
    // The only floor is the workspaceMember check above (target must be an active
    // member of the initiator's workspace).
    //
    // CAVEAT — this is FULL-ACCESS impersonation: jwt.strategy.ts swaps in the
    // target's full identity and findProjectsAndWorkspace loads ALL of the
    // target's memberships, so the impersonating owner will see every
    // workspace/project the target belongs to, including ones outside their own
    // workspace. This was a deliberate product decision; if cross-workspace
    // exposure becomes a concern, scope the session to the initiator's workspace
    // (persist initiator workspace in impersonation state, pin primaryWorkspaceUid
    // in jwt.strategy.ts, filter findProjectsAndWorkspace, and enforce in
    // ProjectPermissionsGuard).

    return true;
  }
}
