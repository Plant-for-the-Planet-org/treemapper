import {
  Injectable,
  Logger,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import { ProjectsService, ProjectGuardResponse } from '../projects/projects.service';
import { ProjectCacheService } from 'src/cache/project-cache.service';
import { DrizzleService } from '../database/drizzle.service';
import { CacheService } from 'src/cache/cache.service';
import { project, user } from '../database/schema';
import { PROJECT_PERMISSIONS_KEY } from '../projects/decorators/project-permissions.decorator';

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
 * Authorization for approval-board decision endpoints (approve / reject /
 * start-review / decision comments) for both interventions and sites.
 *
 * Rules:
 *  - A superadmin (not impersonating) can act on any project.
 *  - On platform projects, project role alone is NOT enough: the member must
 *    hold the explicit approve permission, which only a superadmin can grant.
 *    This makes the superadmin the sole authority over who approves.
 *  - On all other workspaces, the project owner/admin (or a member with the
 *    explicit approve permission) may act, matching the prior behavior.
 */
@Injectable()
export class ApprovalDecisionGuard implements CanActivate {
  private readonly logger = new Logger(ApprovalDecisionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly projectsService: ProjectsService,
    private readonly projectCacheService: ProjectCacheService,
    private readonly drizzleService: DrizzleService,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('projectRoles', context.getHandler());
    const requiredPerms = this.reflector.get<string[]>(PROJECT_PERMISSIONS_KEY, context.getHandler());
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const projectUid = resolveProjectUid(request.params, request.body, request.query);
    if (!projectUid) {
      throw new BadRequestException('Project identifier missing from request');
    }

    // Superadmins bypass project membership entirely (unless impersonating).
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
        extraPermissions: requiredPerms ?? [],
      } as ProjectGuardResponse;
      return true;
    }

    // Resolve project membership (cache → db → workspace-admin escalation).
    let membership = await this.projectCacheService.getUserProject(projectUid, userId);
    if (!membership) {
      membership = await this.projectsService.getMemberRoleFromUid(projectUid, userId);
    }
    if (!membership) {
      const wsInfo = await this.projectsService.getWorkspaceAdminRoleForProject(projectUid, userId);
      if (!wsInfo) {
        throw new ForbiddenException('You do not have access to this project');
      }
      membership = {
        projectId: wsInfo.projectId,
        role: 'admin',
        userId,
        projectName: '',
        siteAccess: 'all',
        restrictedSites: null,
        extraPermissions: [],
      };
    }

    const hasRole = roles ? roles.includes(membership.role) : false;
    const hasPerm = requiredPerms
      ? requiredPerms.some(p => (membership.extraPermissions ?? []).includes(p))
      : false;

    const isPlatform = await this.projectsService.isPlatformProject(membership.projectId);

    if (isPlatform) {
      // Role alone never grants approval on platform projects.
      if (!hasPerm) {
        this.logger.warn(
          `[ApprovalGuard] DENY platform project: role=${membership.role} lacks approval permission`,
        );
        throw new ForbiddenException(
          'On platform projects, approval rights must be granted by a super admin',
        );
      }
    } else if (!hasRole && !hasPerm) {
      throw new ForbiddenException(
        `You need one of these roles: ${(roles ?? []).join(', ')} or a matching approval permission`,
      );
    }

    request.membership = membership;
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
