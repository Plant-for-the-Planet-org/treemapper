import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectsService } from '../projects.service';
import { ProjectCacheService } from 'src/cache/project-cache.service';
import { PROJECT_PERMISSIONS_KEY } from '../decorators/project-permissions.decorator';

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
    const projectUid = request.params?.id
    if (!userId || !projectUid) {
      return false;
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
        extraPermissions: ['approve_intervention', 'approve_site'],
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