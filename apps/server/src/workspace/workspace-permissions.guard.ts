import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { workspace, workspaceMember } from '../database/schema';
import { eq, and, inArray } from 'drizzle-orm';

@Injectable()
export class WorkspacePermissionsGuard implements CanActivate {
  constructor(private readonly drizzleService: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const workspaceUid = request.params?.uid;

    if (!userId || !workspaceUid) return false;

    const [proj] = await this.drizzleService.db
      .select({ id: workspace.id, uid: workspace.uid })
      .from(workspace)
      .where(eq(workspace.uid, workspaceUid))
      .limit(1);

    if (!proj) throw new ForbiddenException('Workspace not found');

    const [member] = await this.drizzleService.db
      .select({ role: workspaceMember.role })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, proj.id),
          eq(workspaceMember.userId, userId),
          inArray(workspaceMember.role, ['owner', 'admin']),
          eq(workspaceMember.status, 'active'),
        ),
      )
      .limit(1);

    if (!member) throw new ForbiddenException('Workspace admin access required');

    request.workspace = { id: proj.id, uid: proj.uid };
    return true;
  }
}
