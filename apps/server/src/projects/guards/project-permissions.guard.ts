import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectsService } from '../projects.service';
import { ProjectCacheService } from 'src/cache/project-cache.service';

@Injectable()
export class ProjectPermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private projectsService: ProjectsService,
    private projectCacheService: ProjectCacheService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('projectRoles', context.getHandler());
    if (!roles) {
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
      throw new ForbiddenException('You do not have access to this project');
    }
    const hasPermission = roles.includes(membership.role);
    if (!hasPermission) {
      throw new ForbiddenException(`You need one of these roles: ${roles.join(', ')} to access this resource`);
    }
    request.membership = membership;
    return true;
  }
}