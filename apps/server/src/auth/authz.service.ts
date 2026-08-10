import { ForbiddenException, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { projectMember, project, workspaceMember, user } from '../database/schema';

export type ProjectRole = 'owner' | 'admin' | 'contributor' | 'observer';

const ROLE_RANK: Record<ProjectRole, number> = {
  observer: 0,
  contributor: 1,
  admin: 2,
  owner: 3,
};

function rolesAtOrAbove(minRole: ProjectRole): ProjectRole[] {
  const min = ROLE_RANK[minRole];
  return (Object.keys(ROLE_RANK) as ProjectRole[]).filter((r) => ROLE_RANK[r] >= min);
}

@Injectable()
export class AuthzService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async assertProjectMembership(
    userId: number,
    projectId: number,
    minRole: ProjectRole = 'contributor',
  ): Promise<void> {
    const allowedRoles = rolesAtOrAbove(minRole);
    const [row] = await this.drizzleService.db
      .select({ id: projectMember.id })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, userId),
          inArray(projectMember.projectRole, allowedRoles),
          isNull(projectMember.deletedAt),
        ),
      )
      .limit(1);
    if (!row) {
      throw new ForbiddenException('Project membership required');
    }
  }

  /**
   * Assert the user may access the given project. Mirrors the access set of
   * ProjectPermissionsGuard so read paths that carry a bare entity UID (and so
   * cannot use that guard) still resolve the same way: a direct project member
   * of any role, a workspace owner/admin of the project's workspace, or a
   * superadmin. Throws ForbiddenException otherwise.
   */
  async assertProjectAccess(userId: number, projectId: number): Promise<void> {
    const [directMember] = await this.drizzleService.db
      .select({ id: projectMember.id })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, userId),
          isNull(projectMember.deletedAt),
        ),
      )
      .limit(1);
    if (directMember) return;

    const [wsAdmin] = await this.drizzleService.db
      .select({ id: workspaceMember.id })
      .from(project)
      .innerJoin(workspaceMember, eq(workspaceMember.workspaceId, project.workspaceId))
      .where(
        and(
          eq(project.id, projectId),
          eq(workspaceMember.userId, userId),
          inArray(workspaceMember.role, ['owner', 'admin']),
          eq(workspaceMember.status, 'active'),
        ),
      )
      .limit(1);
    if (wsAdmin) return;

    const [superAdmin] = await this.drizzleService.db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.id, userId), eq(user.type, 'superadmin')))
      .limit(1);
    if (superAdmin) return;

    throw new ForbiddenException('You do not have access to this project');
  }
}
