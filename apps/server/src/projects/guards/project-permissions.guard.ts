import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectsService } from '../projects.service';
import { ProjectCacheService } from 'src/cache/project-cache.service';
import { PROJECT_PERMISSIONS_KEY } from '../decorators/project-permissions.decorator';

const PROJECT_PARAM_ALIASES = ['id', 'projectId', 'projectUid', 'uid'] as const;

function resolveProjectUid(params: Record<string, any> | undefined): string | undefined {
  if (!params) return undefined;
  for (const key of PROJECT_PARAM_ALIASES) {
    if (params[key]) return params[key];
  }
  return undefined;
}

@Injectable()
export class ProjectPermissionsGuard implements CanActivate {
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
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    const projectUid = resolveProjectUid(request.params);
    if (!projectUid) {
      throw new BadRequestException('Project identifier missing from route params');
    }
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
    if (!hasRole && !hasPerm) {
      throw new ForbiddenException(`You need one of these roles: ${(roles ?? []).join(', ')} or a matching extra permission to access this resource`);
    }
    request.membership = membership;
    return true;
  }
}