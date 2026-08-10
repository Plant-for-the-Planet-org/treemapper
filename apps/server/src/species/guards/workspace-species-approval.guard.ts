import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ProjectsService, ProjectGuardResponse } from '../../projects/projects.service';
import { DrizzleService } from '../../database/drizzle.service';
import { CacheService } from 'src/cache/cache.service';
import { project, user } from '../../database/schema';

const PROJECT_PARAM_ALIASES = ['id', 'projectId', 'projectUid', 'uid'] as const;
const SUPERADMIN_TYPE_TTL_MS = 60 * 1000;

function resolveProjectUid(...sources: Array<Record<string, any> | undefined>): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    for (const key of PROJECT_PARAM_ALIASES) {
      if (source[key]) return source[key];
    }
  }
  return undefined;
}

/**
 * Species requests (queue + review) are a workspace-admin capability, not a
 * project one: neither project role nor a project extraPermission grant is
 * enough. This resolves the workspace from the project uid route param and
 * requires the caller to be that workspace's owner or admin.
 */
@Injectable()
export class WorkspaceSpeciesApprovalGuard implements CanActivate {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly drizzleService: DrizzleService,
    private readonly cacheService: CacheService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');

    const projectUid = resolveProjectUid(request.params, request.body, request.query);
    if (!projectUid) throw new BadRequestException('Project identifier missing from request');

    if (request.user.impersonated !== true && (await this.isSuperAdmin(request.user.auth0Id))) {
      const [proj] = await this.drizzleService.db
        .select({ id: project.id, name: project.name })
        .from(project)
        .where(eq(project.uid, projectUid))
        .limit(1);
      if (!proj) throw new BadRequestException('Project not found');
      request.membership = {
        projectId: proj.id,
        role: 'admin',
        userId,
        projectName: proj.name,
        siteAccess: 'all',
        restrictedSites: null,
        extraPermissions: [],
      } as ProjectGuardResponse;
      return true;
    }

    const wsInfo = await this.projectsService.getWorkspaceAdminRoleForProject(projectUid, userId);
    if (!wsInfo) {
      throw new ForbiddenException('Only workspace owners or admins can review species requests');
    }

    request.membership = {
      projectId: wsInfo.projectId,
      role: 'admin',
      userId,
      projectName: '',
      siteAccess: 'all',
      restrictedSites: null,
      extraPermissions: [],
    } as ProjectGuardResponse;
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
