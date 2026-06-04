import { Injectable, Logger, CanActivate, ExecutionContext, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectsService } from '../projects.service';
import { ProjectCacheService } from 'src/cache/project-cache.service';
import { PROJECT_PERMISSIONS_KEY } from '../decorators/project-permissions.decorator';

const PROJECT_PARAM_ALIASES = ['id', 'projectId', 'projectUid', 'uid'] as const;

// Resolve the project identifier from the request. Route params take priority,
// then the body, then the query. This lets routes that carry the project id in
// the body (e.g. POST /mobile/site) pass the guard without a :id path param.
function resolveProjectUid(...sources: Array<Record<string, any> | undefined>): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    for (const key of PROJECT_PARAM_ALIASES) {
      if (source[key]) return source[key];
    }
  }
  return undefined;
}

@Injectable()
export class ProjectPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(ProjectPermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private projectsService: ProjectsService,
    private projectCacheService: ProjectCacheService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('projectRoles', context.getHandler());
    const requiredPerms = this.reflector.get<string[]>(PROJECT_PERMISSIONS_KEY, context.getHandler());
    if (!roles && !requiredPerms) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    this.logger.log(`[ProjectGuard] ${request.method} ${request.url} userId=${userId} roles=${JSON.stringify(roles)} perms=${JSON.stringify(requiredPerms)}`);
    if (!userId) {
      this.logger.warn(`[ProjectGuard] DENY: no userId (unauthenticated)`);
      throw new UnauthorizedException('Authentication required');
    }
    const projectUid = resolveProjectUid(request.params, request.body, request.query);
    if (!projectUid) {
      this.logger.warn(`[ProjectGuard] DENY: project identifier missing from params=${JSON.stringify(request.params)} body=${JSON.stringify(request.body)}`);
      throw new BadRequestException('Project identifier missing from request');
    }
    let membership = await this.projectCacheService.getUserProject(projectUid, userId);
    let source = membership ? 'cache' : 'none';
    if (!membership) {
      membership = await this.projectsService.getMemberRoleFromUid(projectUid, userId);
      if (membership) source = 'db';
    }
    if (!membership) {
      const wsInfo = await this.projectsService.getWorkspaceAdminRoleForProject(projectUid, userId);
      if (!wsInfo) {
        this.logger.warn(`[ProjectGuard] DENY: no membership for projectUid=${projectUid} userId=${userId}`);
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
      source = 'workspaceAdmin';
    }
    this.logger.log(`[ProjectGuard] membership source=${source} projectId=${membership.projectId} role=${membership.role} extraPerms=${JSON.stringify(membership.extraPermissions ?? [])}`);
    const hasRole = roles ? roles.includes(membership.role) : false;
    const hasPerm = requiredPerms
      ? requiredPerms.some(p => (membership.extraPermissions ?? []).includes(p))
      : false;
    if (!hasRole && !hasPerm) {
      this.logger.warn(`[ProjectGuard] DENY: role=${membership.role} not in ${JSON.stringify(roles)} and no matching perm`);
      throw new ForbiddenException(`You need one of these roles: ${(roles ?? []).join(', ')} or a matching extra permission to access this resource`);
    }
    request.membership = membership;
    this.logger.log(`[ProjectGuard] ALLOW projectId=${membership.projectId} role=${membership.role}`);
    return true;
  }
}