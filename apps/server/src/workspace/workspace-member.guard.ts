import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { workspace, workspaceMember, user } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { CacheService } from 'src/cache/cache.service';

const SUPERADMIN_TYPE_TTL_MS = 60 * 1000;

const WORKSPACE_PARAM_ALIASES = ['uid', 'workspaceUid', 'workspaceId', 'id'] as const;

function resolveWorkspaceUid(params: Record<string, any> | undefined): string | undefined {
  if (!params) return undefined;
  for (const key of WORKSPACE_PARAM_ALIASES) {
    if (params[key]) return params[key];
  }
  return undefined;
}

/**
 * Read-side workspace guard: the caller must be an ACTIVE member of the target
 * workspace (any role), or a superadmin. Use this on workspace-scoped GET
 * routes so a member can view their own workspace, but a stranger cannot read
 * another tenant's data. Mutations still use WorkspacePermissionsGuard
 * (owner/admin only).
 */
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const workspaceUid = resolveWorkspaceUid(request.params);

    if (!userId) throw new UnauthorizedException('Authentication required');
    if (!workspaceUid) throw new BadRequestException('Workspace identifier missing from route params');

    const [ws] = await this.drizzleService.db
      .select({ id: workspace.id, uid: workspace.uid })
      .from(workspace)
      .where(eq(workspace.uid, workspaceUid))
      .limit(1);

    if (!ws) throw new ForbiddenException('Workspace not found');

    if (request.user?.impersonated !== true && (await this.isSuperAdmin(request.user?.auth0Id))) {
      request.workspace = { id: ws.id, uid: ws.uid };
      return true;
    }

    const [member] = await this.drizzleService.db
      .select({ role: workspaceMember.role })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, ws.id),
          eq(workspaceMember.userId, userId),
          eq(workspaceMember.status, 'active'),
        ),
      )
      .limit(1);

    if (!member) throw new ForbiddenException('You do not have access to this workspace');

    request.workspace = { id: ws.id, uid: ws.uid };
    return true;
  }

  private async isSuperAdmin(auth0Id?: string): Promise<boolean> {
    if (!auth0Id) return false;
    const cacheKey = `superadmin:type:${auth0Id}`;
    let type = await this.cacheService.get<string>(cacheKey);
    if (!type) {
      const [userData] = await this.drizzleService.db
        .select({ type: user.type })
        .from(user)
        .where(eq(user.auth0Id, auth0Id))
        .limit(1);
      type = userData?.type ?? null;
      if (type) {
        await this.cacheService.set(cacheKey, type, SUPERADMIN_TYPE_TTL_MS);
      }
    }
    return type === 'superadmin';
  }
}
