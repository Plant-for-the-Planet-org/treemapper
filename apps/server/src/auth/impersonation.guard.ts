import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and, or, sql, ne, isNull } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { user, workspace, workspaceMember, project, projectMember } from '../database/schema';

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

    // SECURITY (workspace-admin impersonation scope):
    // The JWT strategy swaps in the target's full identity and
    // findProjectsAndWorkspace loads ALL of the target's memberships, so an
    // impersonated session sees every workspace/project the target belongs to.
    // To stop a workspace admin from seeing data outside their own workspace,
    // we restrict targets to users whose (non-deleted) project access is
    // confined to the admin's workspace. Superadmin (handled above) is exempt.
    //
    // FUTURE (Option B) — allow impersonating multi-workspace users with a
    // scoped view instead of blocking them. This needs ALL of:
    //   1. Persist the initiator's workspace in the impersonation state
    //      (workspace.service.ts startImpersonation).
    //   2. In jwt.strategy.ts, when impersonation is admin-initiated, pin the
    //      effective user's primaryWorkspaceUid to that workspace.
    //   3. Filter findProjectsAndWorkspace to the initiator workspace.
    //   4. Enforce it in ProjectPermissionsGuard so deep-linking to a project
    //      in another workspace is rejected while impersonating.
    // Until all four exist, keep this single-workspace restriction.
    const [crossWorkspaceProject] = await this.drizzleService.db
      .select({ id: project.id })
      .from(projectMember)
      .innerJoin(project, eq(projectMember.projectId, project.id))
      .where(
        and(
          eq(projectMember.userId, target.id),
          ne(project.workspaceId, ws.id),
          isNull(project.deletedAt),
        ),
      )
      .limit(1);

    if (crossWorkspaceProject) {
      throw new ForbiddenException(
        'This user has access in other workspaces and can only be impersonated by a super admin',
      );
    }

    return true;
  }
}
